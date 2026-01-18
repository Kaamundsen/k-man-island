# 01_CORE_ENGINE_AS_IS.md - K-Score og Trading-logikk

> Dokumentasjon av hvordan K-Score, signaler og trading-parametre beregnes.

## K-Score Beregning

K-Score er en verdi fra 0-100 som indikerer momentum-styrke. Beregnes i `src/lib/api/k-momentum.ts`.

### Hard Filters (må passere for å få score > 0)

Aksjer som feiler på NOEN av disse får `passed: false` og `score: 0`:

| Filter | Krav | Forklaring |
|--------|------|------------|
| SMA50 > SMA200 | Må være sant | Golden Cross - opptrend |
| Pris > SMA50 | Må være sant | Over kortsiktig trend |
| RSI < 70 | Må være sant | Ikke overkjøpt |
| Likviditet | ≥ 5M NOK/dag | Nok omsetning |
| Breakout | Innen 2% av 20d høy | Nær breakout |
| RelVol | ≥ 1.2x | Over gjennomsnittlig volum |

### Score-komponenter (hvis alle filters passerer)

| Komponent | Maks Poeng | Beregning |
|-----------|-----------|-----------|
| Breakout Strength | 30 | Avstand over 20d høy + close nær daghøy |
| Trend Strength | 25 | SMA50 slope + avstand over SMA50 |
| Relative Volume | 20 | (relVol - 1) * 20 |
| Room to Run | 15 | Avstand til 52-ukers høy / 2 |
| Volatility Fit | 10 | Sweet spot 2-5% ATR = 10p, ellers mindre |

**Total Score = Sum av alle komponenter (maks 100)**

### Kodeeksempel

```typescript
// Fra k-momentum.ts linje 114-166
const breakoutStrength = Math.min(30, 
  (distanceAbove20High / high20) * 200 + 
  (closeNearDayHigh * 10)
);

const trendStrength = Math.min(25,
  (sma50Slope * 100) + 
  (distanceAboveSMA50 * 2)
);

const relVolumeScore = Math.min(20, (relVol - 1) * 20);
const roomScore = Math.min(15, roomToRun / 2);

// Volatility sweet spot
if (atrPercent >= 2 && atrPercent <= 5) volScore = 10;
else if (atrPercent >= 1 && atrPercent < 2) volScore = 5;
else if (atrPercent > 5 && atrPercent <= 8) volScore = 5;
```

## BUY/HOLD/SELL Signal-logikk

Signalet bestemmes i `stock-data.ts` basert på K-Score og RSI:

```typescript
// Forenklet logikk fra stock-data.ts
function getSignal(kScore: number, rsi: number): 'BUY' | 'HOLD' | 'SELL' {
  if (kScore >= 70 && rsi < 70) return 'BUY';
  if (kScore < 40 || rsi >= 70) return 'SELL';
  return 'HOLD';
}
```

| Signal | Betingelse |
|--------|-----------|
| BUY | K-Score ≥ 70 OG RSI < 70 |
| SELL | K-Score < 40 ELLER RSI ≥ 70 |
| HOLD | Alt annet |

**VIKTIG:** Signalet er basert på K-Score fra K-Momentum analysen, IKKE fra individuelle strategi-evalueringer.

## Target, Stop og Risk/Reward Beregning

Beregnes automatisk i `analyzeKMomentum()`:

### Stop Loss
```typescript
const suggestedStop = currentPrice - (atr * 2);
// ATR = 14-dagers Average True Range
// Stop = 2 ATR under current price
```

### Target
```typescript
const riskAmount = currentPrice - suggestedStop;
const idealTarget = currentPrice + (riskAmount * 2.5); // 2.5R
const maxPercentGain = currentPrice * 1.15;            // Maks 15%
const recent20High = high20 * 1.02;                    // 20d høy + 2%

// Bruker det LAVESTE av de tre (mest konservativt)
const suggestedTarget = Math.min(idealTarget, maxPercentGain, recent20High);
```

### Risk/Reward Ratio
```typescript
const riskRewardRatio = (suggestedTarget - currentPrice) / riskAmount;
// Typisk mellom 1.5 - 2.5 avhengig av target-beregning
```

## Returnert Data-struktur

```typescript
interface KMomentumResult {
  passed: boolean;              // Passerte alle hard filters
  score: number;                // 0-100
  breakdownScores: {
    breakoutStrength: number;   // 0-30
    trendStrength: number;      // 0-25
    relVolume: number;          // 0-20
    roomToRun: number;          // 0-15
    volatilityFit: number;      // 0-10
  };
  failedFilters: string[];      // Liste over feilede filters
  suggestedEntry: number;       // Current price (avrundet)
  suggestedStop: number;        // Stop loss
  suggestedTarget: number;      // Target price
  riskRewardRatio: number;      // R/R
}
```

## Begrensninger

### K-Score Begrensninger
1. **Krever 200+ dager data** - Nye aksjer får ikke score
2. **Kun teknisk analyse** - Ingen fundamental data
3. **Statisk threshold** - Samme krav for alle markeder
4. **Likviditetskrav favoriserer store aksjer** - 5M NOK/dag cutoff
5. **RSI 70 cutoff** - Kan miste aksjer i sterk opptrend

### Signal Begrensninger
1. **Binære signaler** - Ingen gradering (styrke på BUY)
2. **Ingen tidshorisont** - Samme signal for day/swing/position
3. **Ikke strategi-spesifikt** - Samme logikk for alle strategier

### Target/Stop Begrensninger
1. **ATR-basert** - Kan gi for tett stop i volatile aksjer
2. **15% cap på target** - Begrenser oppside i momentum-aksjer
3. **2.5R fast** - Ikke tilpasset strategi eller marked
4. **Ingen fundamental støtte** - Target kan være over/under realistisk verdi

## Hvordan K-Score Brukes i UI

### Dashboard
- Topp 3 aksjer vises som kort (sortert på composite score)
- Resten vises i liste
- Composite score = K-Score * 0.5 + RSI-bonus * 0.2 + R/R * 0.3

### Markedsskanner
- Sorteres på K-Score (default)
- Signal-farger: BUY=grønn, HOLD=gul, SELL=rød

### Aksjedetalj (/analyse/[ticker])
- Viser K-Score med breakdown
- Viser alle passerte strategier
- Viser entry/stop/target som trading-plan
