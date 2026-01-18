# 02_STRATEGIES_AS_IS.md - Strategidokumentasjon

> Dokumentasjon av alle strategier definert i `src/lib/strategies/index.ts`.

## Strategi-oversikt

### Aktive Trading-strategier (automatisk evaluering)

| ID | Navn | Kategori | Risiko | Target % | Holdtid |
|----|------|----------|--------|----------|---------|
| MOMENTUM_TREND | Momentum Trend | MOMENTUM | MEDIUM | 8-15% | 10-28d |
| MOMENTUM_ASYM | Momentum Asymmetrisk | MOMENTUM | HIGH | 15-25% | 5-21d |
| BUFFETT | Buffett | VALUE | LOW | 8-20% | 60-365d |
| TVEITEREID | Tveitereid | TECHNICAL | MEDIUM | 5-12% | 10-30d |
| INSIDER | Innsidehandel | EVENT | MEDIUM | 5-15% | 30-90d |
| REBOUND | Oversold Rebound | TECHNICAL | HIGH | -15-20% | 3-14d |
| DAYTRADER | Daytrader | TECHNICAL | VERY_HIGH | -5-3% | 0-1d |
| SWING_SHORT | Kort Swing | TECHNICAL | HIGH | 3-10% | 2-7d |

### Manuelle Strategier (krever bruker-input)

| ID | Navn | Kategori | Beskrivelse |
|----|------|----------|-------------|
| DIVIDEND_HUNTER | Utbytte Jeger | INCOME | Høyt utbytte aksjer |
| DNB_MONTHLY | DNB Månedlig | ANALYST | DNB Markets anbefalinger |
| PARETO_TOP | Pareto Topp | ANALYST | (ikke aktivert) |
| ARCTIC_PICKS | Arctic Picks | ANALYST | (ikke aktivert) |
| ANALYST_CONSENSUS | Analytiker Konsensus | ANALYST | (ikke aktivert) |
| UKENS_AKSJE | Ukens Aksje | EVENT | Espen Tingvoll/Investornytt |

### "Ærlige" Strategier (for ærlig logging)

| ID | Navn | Beskrivelse | Forventet avkastning |
|----|------|-------------|---------------------|
| YOLO | Magefølelse | Tro, håp og kjærlighet | -30% til +20% |
| TIPS | Tips fra noen | Kompis, forum, Reddit | -20% til +10% |
| HODL | Bare HODL | Langsiktig uten plan | -20% til +15% |
| FOMO | FOMO | Fear Of Missing Out | -50% til 0% |

## Hvordan Hver Strategi Scores

### MOMENTUM_TREND (score-basert, ingen hard fails)

```typescript
// Alle aksjer vises, score bestemmer rangering
let score = 0;

// Golden Cross: SMA50 > SMA200
if (sma50 > sma200) score += 25;  else score += 5;

// Pris over SMA50
if (price > sma50) score += 20;
else if (price > sma50 * 0.95) score += 10;
else score += 5;

// RSI 35-70
if (rsi >= 35 && rsi <= 70) score += 15;
else score += 5;

// Likviditet
if (dailyVolume >= 5M) score += 15;
else if (dailyVolume >= 1M) score += 10;
else score += 5;

// BONUSER:
// RelVol >= 1.2: +15
// Nær 20d høy: +15
// Rom til 52w høy: +10

// R/R: 2.5:1 fast
```

### MOMENTUM_ASYM (høy risiko/høy belønning)

```typescript
let score = 0;

// Opptrend (bonus, ikke krav)
if (sma50 > sma200) score += 20; else score += 5;

// Pris vs SMA50
if (price > sma50) score += 15;
else if (price > sma50 * 0.95) score += 8;
else score += 3;

// ATR volatilitet (viktigere her)
if (atrPercent >= 3) score += 20;
else if (atrPercent >= 2) score += 15;
else if (atrPercent >= 1.5) score += 5;

// RSI under 60 (rom for oppgang)
if (rsi < 60) score += 10;

// ASYMMETRI-FAKTORER:
// >20% til 52w høy: +25
// Breakout kandidat: +15
// RelVol >= 1.5: +15

// R/R: 4:1 (tettere stop, større target)
```

### BUFFETT (kvalitetsaksjer)

```typescript
let score = 0;
let passed = true;

// Stabil opptrend (HARD KRAV)
if (price > sma50 && sma50 > sma200) {
  score += 25;
} else if (price > sma200) {
  score += 10;
} else {
  passed = false; // Feiler
}

// RSI 35-60 (HARD KRAV)
if (rsi >= 35 && rsi <= 60) score += 20;
else if (rsi < 35) score += 5;
else passed = false;

// Høy likviditet (HARD KRAV)
if (dailyVolume >= 10M) score += 25;
else if (dailyVolume >= 5M) score += 15;
else passed = false;

// Lav volatilitet (bonus)
if (atrPercent <= 3) score += 20;

// R/R: 1.5:1
```

### TVEITEREID (likviditetsfokus)

```typescript
let passed = true;

// HOVEDKRAV: Likviditet
if (dailyVolume >= 20M) score += 40;
else if (dailyVolume >= 10M) score += 30;
else if (dailyVolume >= 8M) score += 20;
else passed = false; // FEILER

// Bonuser:
// Pris > SMA50: +20
// RSI < 70: +15
// RelVol >= 1.0: +15

// R/R: 1.5:1
```

### INSIDER (innsidehandel)

```typescript
let passed = false;

// HOVEDKRAV: Insider-score fra Finnhub
if (insiderScore >= 60) {
  score += 50;
  passed = true;
} else if (insiderScore >= 40) {
  score += 30;
  passed = true;
} else if (insiderBuys > 0) {
  score += 15;
}

// Bonuser:
// Pris > SMA50: +20
// insiderBuys >= 3: +20

// R/R: 2:1
```

### REBOUND (oversold bounce)

```typescript
let passed = false;

// HOVEDKRAV: Oversolgt RSI
if (rsi <= 30) {
  score += 40;
  passed = true;
} else if (rsi <= 40) {
  score += 25;
  passed = true;
}

// Pris > SMA200 (langsiktig støtte)
if (price > sma200) score += 25;
else score += 5;

// Volum-spike (kapitulasjon)
if (relVol >= 2) score += 20;

// Target = tilbake til SMA50
// R/R: 2:1
```

### DAYTRADER (intradag)

```typescript
let passed = true;

// VOLUM (HARD KRAV ved < 5M)
if (volumeInMillions >= 50) score += 30;
else if (volumeInMillions >= 20) score += 22;
else if (volumeInMillions >= 10) score += 15;
else if (volumeInMillions >= 5) score += 8;
else passed = false;

// VOLATILITET (HARD KRAV)
if (atrPercent >= 4) score += 25;
else if (atrPercent >= 3) score += 20;
else if (atrPercent >= 2) score += 12;
else if (atrPercent >= 1.5) score += 5;
else passed = false;

// Intraday momentum (relVol)
// RSI momentum

// Må også ha score >= 50 for å passere
const daytradePassed = passed && finalScore >= 50;

// Stop: 0.5 ATR, Target: 1.0 ATR
// R/R: 2:1
```

### SWING_SHORT (2-7 dager)

```typescript
let passed = true;

// Volum >= 5M (HARD KRAV)
// ATR >= 2.5% (HARD KRAV)

// Bonuser:
// RSI 45-65: +20
// Nær 20d høy: +25
// RelVol >= 1.2: +15

// Stop: 1.5 ATR, Target: 3 ATR
// R/R: 2:1
```

## Hva `passed = true` Betyr

### For MOMENTUM_TREND og MOMENTUM_ASYM:
- `passed` settes ALLTID til `true` i `evaluateAllStrategies()`
- Score brukes kun for rangering, ikke filtrering
- Alle aksjer vises, sortert på score

```typescript
// Fra index.ts linje 480-481
// Sett ALLE som "passed" - vi bruker score for rangering
evaluation.passed = true;
```

### For andre strategier (BUFFETT, TVEITEREID, etc.):
- `passed` bestemmes av hard requirements
- Aksjer som feiler vises IKKE under den strategien
- Men de kan fortsatt vises under andre strategier de passerer

## Hvordan ALLE/Filtrering Fungerer i Dashboard

### FilterBar-tilstander
```typescript
type StrategyFilter = 'ALLE' | StrategyId;
type MarketFilter = 'ALLE' | 'OSLO' | 'USA';
```

### Filtreringslogikk

```typescript
// Fra DashboardContent.tsx
let filtered = [...stocks];

// 1. Marked-filter
if (marketFilter !== 'ALLE') {
  filtered = filtered.filter(stock => stock.market === marketFilter);
}

// 2. Strategi-filter
if (strategyFilter !== 'ALLE') {
  filtered = filtered.filter(stock => 
    stock.strategies.includes(strategyFilter)
  );
}

// 3. Sorter på strategi-spesifikk score
filtered.sort((a, b) => {
  const scoreA = calculateCompositeScore(a, strategyFilter);
  const scoreB = calculateCompositeScore(b, strategyFilter);
  return scoreB - scoreA;
});
```

### Composite Score Beregning

```typescript
// Når strategi-filter er valgt:
if (strategyFilter !== 'ALLE' && stock.strategyEvaluations) {
  const evaluation = stock.strategyEvaluations.find(e => e.strategyId === strategyFilter);
  if (evaluation) return evaluation.score;
}

// Fallback (ALLE eller ingen evaluering):
score += stock.kScore * 0.5;        // K-Score 50%
score += rsiScore * 0.2;            // RSI bonus 20%
score += riskRewardScore * 0.3;     // R/R 30%
```

### Hvordan `stock.strategies[]` Populeres

I `stock-data.ts` etter analyse:

```typescript
const evaluations = evaluateAllStrategies(analysisInput);
stock.strategies = evaluations
  .filter(e => e.passed)
  .map(e => e.strategyId);
stock.strategyEvaluations = evaluations;
```

## Strategier per UI-komponent

| Komponent | Viser | Sorterer på |
|-----------|-------|-------------|
| Dashboard kort | Topp 3 (uansett signal) | Composite score |
| Dashboard liste | #4 og nedover | Composite score |
| Strategi-sammenligning | Topp 3 per strategi | Strategi-score |
| Markedsskanner | Alle aksjer | K-Score (default) |
| Aksjedetalj | Alle passerte strategier | Score |
