# K-man Island Trading System - Roadmap

> Mål: 100-200% årlig avkastning gjennom systematisk swing-trading

## 🎯 Overordnet Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     K-MAN ISLAND SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  DATALAG     │    │  ANALYSE     │    │  VARSLING    │      │
│  │              │    │              │    │              │      │
│  │ • Historikk  │───▶│ • K-Score    │───▶│ • Mønstre    │      │
│  │ • Live data  │    │ • Strategier │    │ • Kjøp/Salg  │      │
│  │ • Nyheter    │    │ • Mønstre    │    │ • Notater    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────┐       │
│  │                    BRUKERGRENSESNITT                 │       │
│  │                                                      │       │
│  │  Dashboard │ Portefølje │ Dyp Analyse │ Strategier  │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Fase 1: Scoring-system (K-Score validering)

### Hva K-Score BØR være basert på (akademisk forskning):

**Momentum-faktoren** (Jegadeesh & Titman, 1993) viser at aksjer som har gått bra siste 3-12 måneder, fortsetter å gå bra.

#### Ny K-Score formel:

```
K-SCORE (0-100) = Vektet sum av:

1. MOMENTUM (50%)
   ├── 1-mnd avkastning × 0.10
   ├── 3-mnd avkastning × 0.20
   └── 6-mnd avkastning × 0.20

2. TEKNISK STYRKE (30%)
   ├── Pris vs SMA50 (over = +15, under = -10)
   ├── RSI-posisjon (40-60 = +10, ekstrem = -5)
   └── Volum-trend (økende = +5)

3. RISK/REWARD (20%)
   ├── Avstand til 52w-high (rom for oppside)
   └── ATR-basert R/R ratio
```

### Validering:
- [ ] Backtest på OSEBX 2020-2024
- [ ] Sammenlign med enkel buy-and-hold
- [ ] Juster vekter basert på resultat

---

## 📈 Fase 2: Strategi-spesifikke Scorer

Hver strategi skal ha EGEN scoring uavhengig av K-Score:

### M-TREND Score
```
Kriterier for høy score:
✓ Pris > SMA20 > SMA50 (trend bekreftet)
✓ RSI mellom 40-65 (ikke overkjøpt)
✓ Volum over snitt siste 5 dager
✓ Positiv momentum siste 10 dager
✓ ADX > 25 (sterk trend)
```

### M-ASYM Score
```
Kriterier for høy score:
✓ Risk/Reward ratio > 3:1
✓ Nær definert support-nivå
✓ ATR indikerer volatilitet (mulighet)
✓ Ikke i fritt fall (stabilisert)
✓ Volum-spike kan indikere reversering
```

### REBOUND Score
```
Kriterier for høy score:
✓ RSI < 30 (oversolgt)
✓ Pris nær 52-ukers bunn
✓ Volum-spike (kapitulasjonstegn)
✓ Bullish divergens på RSI
✓ Støtte ved tidligere bunn
```

---

## 🔍 Fase 3: Mønstergjenkjenning

### A) Spike-aksjer (IOX-type)
```javascript
// Identifiser aksjer med historikk for store bevegelser
const spikeProfile = {
  avgDailyMove: 1.2%,           // Snitt daglig bevegelse
  spikeDays: 15,                 // Dager med >5% bevegelse siste år
  maxSpike: 32%,                 // Største enkeltdag
  avgSpike: 12%,                 // Snitt på spike-dager
  typicalTrigger: "volume",      // Hva trigger spikes?
  seasonality: ["jan", "aug"],   // Når skjer de oftest?
}
```

### B) Pre-rapport mønstre
```javascript
// Aksjer som typisk stiger før kvartalsrapport
const earningsPattern = {
  ticker: "EQNR.OL",
  avgMoveBeforeEarnings: +3.2%,  // Snitt 5 dager før
  avgMoveAfterEarnings: -1.1%,   // Snitt 5 dager etter
  consistency: 75%,              // Hvor ofte følger mønsteret
  nextEarnings: "2026-02-05",
  alert: true,
}
```

### C) Sesongmønstre
```javascript
// Aksjer med konsistent sesongmønster
const seasonalPattern = {
  ticker: "MOWI.OL",
  bestMonths: ["jan", "feb", "sep"],
  worstMonths: ["jun", "jul"],
  avgJanReturn: +8.2%,
  consistency: 80%,              // 4 av 5 år
}
```

---

## 🔔 Fase 4: Varslingssystem

### Typer varsler:
1. **Mønster-varsler**: "IOX nærmer seg historisk spike-sone"
2. **Kjøp-varsler**: "EQNR matcher M-Trend kriterier (score 85)"
3. **Salg-varsler**: "Din posisjon i NHY er opp 12%, nær target"
4. **Notat-varsler**: "Påminnelse: MOWI typisk sterk i januar"
5. **Rapport-varsler**: "YAR rapporterer om 3 dager, historisk +4% før"

### Varsel-innstillinger per aksje:
```javascript
const stockAlerts = {
  ticker: "IOX.OL",
  enabled: true,
  triggers: {
    priceAbove: 15.00,
    priceBelow: 10.00,
    volumeSpike: 3x,             // 3x normalt volum
    rsiOversold: 30,
    patternMatch: "spike-setup",
    customNote: "Sjekk rundt månedsskiftet",
  }
}
```

---

## 📱 Fase 5: UI-forbedringer

### Dyp Analyse-side (forbedret):
```
┌─────────────────────────────────────────────────────────────┐
│  EQNR.OL - Equinor ASA                              ⭐ 🔔   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DINE NOTATER                                    [+ Ny]    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 "Stiger alltid før Q4-rapport" - 15.11.2025     │   │
│  │ 📝 "Svak i juni pga utbytte" - 02.06.2025          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  AKSJE-PROFIL                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type: Stabil storaksje, lav volatilitet             │   │
│  │ Snitt daglig bevegelse: 1.8%                        │   │
│  │ Spike-frekvens: Lav (2 dager >5% siste år)          │   │
│  │ Beste måneder: Jan (+5.2%), Sep (+3.1%)             │   │
│  │ Verste måneder: Jun (-2.1%)                         │   │
│  │ Pre-rapport mønster: +2.8% snitt 5 dager før        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  AKTIVE VARSLER                                            │
│  ✓ Varsel hvis pris > 320 kr                               │
│  ✓ Varsel 5 dager før kvartalsrapport                      │
│                                                             │
│  STRATEGI-MATCH                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ M-Trend  │ M-Asym   │ Buffett  │ Rebound  │            │
│  │   72     │   45     │   88     │   31     │            │
│  │  ████░░  │  ██░░░░  │ █████░   │  █░░░░░  │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Portefølje-rapport (toppen av aksjesiden):
```
┌─────────────────────────────────────────────────────────────┐
│  📊 DIN POSISJON I EQNR                                     │
├─────────────────────────────────────────────────────────────┤
│  Kjøpt: 280 kr × 50 stk = 14.000 kr (15.10.2025)           │
│  Nå: 295 kr × 50 stk = 14.750 kr                           │
│  P/L: +750 kr (+5.4%)                                      │
│                                                             │
│  STATUS: 🟢 På vei mot target                               │
│  ├── Entry: 280 kr ✓                                       │
│  ├── Nå: 295 kr (halvveis til target)                      │
│  ├── Target: 310 kr (5.1% igjen)                           │
│  └── Stop: 265 kr (10.2% ned)                              │
│                                                             │
│  ANBEFALING: Hold. RSI 52, ingen salgssignal.              │
│  ⚠️ Kvartalsrapport om 12 dager - vurder å sikre gevinst   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗓️ Implementasjonsrekkefølge

### Sprint 1: Fundament (denne uken)
- [x] Caching-system for API-kall
- [ ] Validere/fikse K-Score formel
- [ ] Hente historisk data (Yahoo Finance, 2 år)
- [ ] Lagre i lokal database/JSON

### Sprint 2: Analyse
- [ ] Beregne momentum-score fra historikk
- [ ] Identifisere spike-aksjer
- [ ] Finne sesongmønstre
- [ ] Pre-rapport analyse

### Sprint 3: Varsling
- [ ] Notat-system med påminnelser
- [ ] Pris-varsler
- [ ] Mønster-varsler
- [ ] Daglig portefølje-evaluering

### Sprint 4: UI
- [ ] Forbedret Dyp Analyse-side
- [ ] Aksje-profil med mønstre
- [ ] Posisjon-rapport på aksjesiden
- [ ] Dashboard med varsler

---

## 📦 Datamodell

### Historisk data (per aksje)
```typescript
interface StockHistory {
  ticker: string;
  daily: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  
  // Beregnet fra historikk
  analysis: {
    avgDailyMove: number;
    spikeDays: number;
    bestMonths: string[];
    worstMonths: string[];
    preEarningsPattern: number;
    volatilityRank: number;
  };
}
```

### Notat-system
```typescript
interface StockNote {
  id: string;
  ticker: string;
  note: string;
  createdAt: Date;
  reminder?: Date;          // Når skal jeg varsles?
  alertEnabled: boolean;
  tags: string[];           // "sesong", "rapport", "mønster"
}
```

### Varsler
```typescript
interface Alert {
  id: string;
  ticker: string;
  type: 'price' | 'volume' | 'pattern' | 'note' | 'earnings';
  condition: {
    operator: 'above' | 'below' | 'equals';
    value: number | string;
  };
  triggered: boolean;
  createdAt: Date;
}
```

---

## ✅ Suksesskriterier

1. **K-Score validert**: Backtestet og bevist at den predikerer avkastning
2. **Mønstre identifisert**: System finner IOX-type aksjer automatisk
3. **Varsler fungerer**: Får beskjed FØR muligheten er borte
4. **Portefølje-evaluering**: Daglig anbefaling for hver posisjon
5. **Avkastning**: Tracking viser at systemet slår markedet

---

*Sist oppdatert: Januar 2026*
