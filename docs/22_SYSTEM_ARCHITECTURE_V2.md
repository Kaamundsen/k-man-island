# 22_SYSTEM_ARCHITECTURE_V2.md - System Arkitektur

> Dokumenterer systemets oppbygning, dataflyt og ansvar.
> **Sist oppdatert:** Januar 2026

---

## Mappestruktur og Roller

### `src/` - Produksjonskode (CANONICAL)

Dette er den eneste mappen som skal brukes i produksjon.

```
src/
├── app/              # Next.js App Router sider
│   ├── api/          # API endpoints
│   │   ├── stocks/   # Hent aksjelist (Yahoo Finance)
│   │   ├── chart/    # Historiske candles
│   │   ├── analysis/ # Full teknisk analyse
│   │   └── quotes/   # Live priser
│   └── [pages]/      # UI sider
├── components/       # React komponenter
├── lib/
│   ├── api/          # Data-henting
│   │   ├── stock-data.ts      # CANONICAL: Aksjelist-henting
│   │   ├── stock-data-v2.ts   # Enkelt-aksje quotes
│   │   ├── historical-data.ts # 2 års historikk
│   │   └── k-momentum.ts      # K-Momentum analyse
│   ├── strategies/
│   │   ├── index.ts           # Strategi-definisjoner
│   │   └── registry.ts        # V2 Scoring + Filtering
│   └── store/        # LocalStorage persistering
└── strategy-packs/   # Legacy kode (skal fases ut)
```

### `k-man-island-inner/` - Migreringskilde (LEGACY)

**IKKE BRUK I PRODUKSJON**

Denne mappen inneholder kode som ble brukt under utviklingen.
Den eksisterer kun som referanse for migrering.

```
k-man-island-inner/
└── src/              # Gammel kodebase
    └── ...           # Referanse for migrering
```

**Regel:** Ingen import fra `k-man-island-inner/` i produksjonskode.

---

## Dataflyt

### 1. Dashboard / Markedsskanner

```
[Bruker åpner side]
       ↓
[Next.js Server] → fetchLiveStockData()
       ↓
[Yahoo Finance API] → 1-dags quotes
       ↓
[Strategy Registry] → passesStrategyFilters() + calculateStrategyScore()
       ↓
[Stock[] med signal, kScore, strategies]
       ↓
[UI rendres]
```

### 2. Aksje-analyse side

```
[Bruker klikker aksje]
       ↓
[/api/chart/[ticker]] → 2 års historikk (Yahoo → Finnhub fallback)
       ↓
[/api/analysis/[ticker]] → K-Momentum + guardrail
       ↓
[StockAnalyseContent] → Graf + teknisk analyse
```

### 3. Dagsrapport

```
[Bruker åpner /rapport]
       ↓
[/api/stocks] → Markedsdata
       ↓
[getQualifyingStocksPerStrategy()] → Strategifunn
       ↓
[getTrades()] → Portefølje fra LocalStorage
       ↓
[evaluatePortfolio()] → Anbefalinger
       ↓
[UI med Core Brief + Strategifunn + Portfolio Review]
```

---

## Refresh-mekanismer

### Manuell Refresh ("Oppdater nå"-knappen)

**Hvor:** Dashboard header, Rapport header

**Hva skjer:**
1. Kaller `/api/stocks?limit=50`
2. Henter ferske quotes fra Yahoo Finance
3. Beregner nye K-Scores og signaler
4. Oppdaterer state og UI
5. Viser ny timestamp

**Kode:**
```typescript
// DashboardClient.tsx
const handleRefresh = useCallback(async () => {
  const response = await fetch('/api/stocks?limit=50');
  const data = await response.json();
  setStocks(data.stocks);
  setLastUpdated(data.timestamp);
}, []);
```

### Cron-analyse (Ikke implementert ennå)

**Planlagt funksjon:**
- Kjøres automatisk på morgenen (08:00)
- Genererer rapport og sender varsler
- Lagrer historikk for "endringer siden sist"

**Status:** Ikke implementert. Krever:
- Scheduled job (Vercel Cron / external scheduler)
- Historikk-lagring i database

---

## Strategy Registry (V2)

### Scoring per strategi

Hver strategi har unike vekter:

| Strategi | K-Score | RSI | R/R | Momentum | Volume |
|----------|---------|-----|-----|----------|--------|
| MOMENTUM_TREND | 50% | 15% | 20% | 10% | 5% |
| MOMENTUM_ASYM | 30% | 10% | 40% | 15% | 5% |
| BUFFETT | 40% | 20% | 20% | 10% | 10% |
| REBOUND | 20% | 40% | 25% | 10% | 5% |

### Filtre per strategi

Hvert strategi har minimumskrav:

| Strategi | Min K-Score | RSI Range | Min R/R |
|----------|-------------|-----------|---------|
| MOMENTUM_TREND | 70 | 35-65 | 1.5 |
| MOMENTUM_ASYM | 60 | 30-70 | 2.5 |
| BUFFETT | 65 | ≤60 | 1.5 |
| REBOUND | 40 | ≤45 | 2.0 |

### passed=true Logikk

```typescript
// Konsistent: Bruker alltid passesStrategyFilters()
const { passed, reasons } = passesStrategyFilters(stock, strategyId);
```

---

## Guardrails

### Minimum Historikk

- **Krav:** ≥200 dager historikk for pålitelige signaler
- **Konstant:** `MIN_BARS_FOR_ANALYSIS = 200`
- **Anbefalt:** `RECOMMENDED_BARS = 500` (2 år)

**Fil:** `src/lib/constants.ts`

### Signal-blokkering

Hvis historikk < 200 dager:
- Signal settes til `HOLD`
- `signalBlocked: true`
- Warning vises i UI

**Fil:** `src/app/api/analysis/[ticker]/route.ts`

---

## Viktige konstanter

| Konstant | Verdi | Fil |
|----------|-------|-----|
| `MIN_BARS_FOR_ANALYSIS` | 200 | `lib/constants.ts` |
| `RECOMMENDED_BARS` | 500 | `lib/constants.ts` |
| `MAX_CORE_SLOTS` | 5 | `lib/strategies/registry.ts` |
| `MAX_TREND_SLOTS` | 3 | `lib/strategies/registry.ts` |
| `MAX_ASYM_SLOTS` | 2 | `lib/strategies/registry.ts` |

---

## API Endpoints

| Endpoint | Formål | Kilde |
|----------|--------|-------|
| `/api/stocks` | Aksjelist med scoring | Yahoo Finance |
| `/api/quotes` | Sanntidspriser | Yahoo Finance |
| `/api/chart/[ticker]` | Historiske candles | Yahoo → Finnhub |
| `/api/analysis/[ticker]` | Full analyse med guardrail | Yahoo → Finnhub |

---

**Sist oppdatert:** Januar 2026
