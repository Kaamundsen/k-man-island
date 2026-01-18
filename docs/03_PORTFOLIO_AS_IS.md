# 03_PORTFOLIO_AS_IS.md - Porteføljedokumentasjon

> Dokumentasjon av hvordan trades og porteføljer lagres og håndteres.

## Lagringsarkitektur

All data lagres i **localStorage** via `src/lib/store/local-store.ts`.

```typescript
const STORAGE_KEYS = {
  PORTFOLIOS: 'kman_portfolios',
  TRADES: 'kman_trades',
  SIGNALS: 'kman_signals',
  DIVIDENDS: 'kman_dividends',
};
```

## Default Porteføljer

Disse opprettes automatisk ved første lasting:

| ID | Navn | Hovedstrategi | Tillatte strategier |
|----|------|---------------|---------------------|
| portfolio-momentum-trend | Momentum Trend | MOMENTUM_TREND | MOMENTUM_TREND |
| portfolio-momentum-asym | Momentum Asymmetrisk | MOMENTUM_ASYM | MOMENTUM_ASYM |
| portfolio-mixed | Blandet Portefølje | - | Alle inkl. YOLO, TIPS, HODL |
| portfolio-daytrading | Daytrading | DAYTRADER | DAYTRADER, SWING_SHORT |
| portfolio-dividend | Utbytte | DIVIDEND_HUNTER | DIVIDEND_HUNTER, BUFFETT |
| portfolio-value | Verdi & Kvalitet | BUFFETT | BUFFETT, INSIDER |

## Trade Data-struktur

```typescript
interface Trade {
  id: string;                    // Auto-generert: "trade-{timestamp}-{random}"
  ticker: string;                // F.eks. "NHY.OL"
  name?: string;                 // "Norsk Hydro"
  
  // Entry
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  
  // Portfolio & Strategy
  portfolioId: string;
  strategyId: StrategyId;
  
  // Trading-plan
  stopLoss: number;
  target: number;
  timeHorizonEnd: Date;
  
  // Status
  status: 'ACTIVE' | 'CLOSED' | 'STOPPED' | 'TARGET_HIT';
  
  // Exit (for lukkede trades)
  exitPrice?: number;
  exitDate?: Date;
  exitReason?: 'TARGET' | 'STOP_LOSS' | 'MANUAL' | 'TIME_LIMIT';
  
  // Beregnet P/L
  currentPrice?: number;
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  
  // Warnings
  deadMoneyWarning: boolean;
  daysHeld?: number;
  
  // Notater
  notes?: string;
}
```

## Hvordan Trades Opprettes

### 1. Via AddTradeModal (manuell)

```typescript
// Required fields:
const tradeInput: TradeInput = {
  ticker: string;           // Normaliseres til UPPERCASE + .OL
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  portfolioId: string;
  strategyId: StrategyId;   // Default: MOMENTUM_TREND
  stopLoss: number;         // Default: entryPrice * 0.9 (-10%)
  target: number;           // Default: entryPrice * 1.2 (+20%)
  timeHorizonEnd: Date;     // Default: basert på strategi
  notes?: string;
};
```

### 2. Via Aksjedetalj ("Registrer Trade"-knapp)

Pre-fyller data fra analysen:
```typescript
const prefilledData = {
  ticker: stock.ticker,
  name: stock.name,
  price: stock.price,        // Live pris
  stopLoss: stock.stopLoss,  // Fra K-Score analyse
  target: stock.target,      // Fra K-Score analyse
  strategyId: bestStrategy   // Høyeste score
};
```

### 3. Via BulkImportModal (Nordnet)

Parser Nordnet-format automatisk:
```
12.1.2026
Aksjesparekonto · 55702096
Kjøpt
Norsk Hydro
120
81,88 NOK
29 NOK
−9 854,60 NOK
```

## Bulk Import Logikk

### KJØP-transaksjoner
```typescript
// Opprett ny trade med:
- ticker fra TICKER_MAP eller {name}.OL
- Default target: +15%
- Default stop: -8%
- timeHorizonEnd: basert på valgt strategi
- notes: "Importert fra Nordnet. Kurtasje: XX NOK"
```

### SALG-transaksjoner
```typescript
// 1. Finn matchende AKTIV trade med samme ticker
const matchingTrades = activeTrades.filter(t => 
  t.ticker === trade.ticker && t.status === 'ACTIVE'
);

// 2. Lukk den ELDSTE matchende traden
if (matchingTrades.length > 0) {
  updateTrade({
    id: oldestTrade.id,
    status: 'CLOSED',
    exitPrice: trade.price,
    exitDate: trade.date,
    exitReason: 'MANUAL'
  });
}

// 3. Hvis ingen match: Opprett og lukk umiddelbart
// (for historiske salg uten registrert kjøp)
```

### Ticker-mapping

```typescript
const TICKER_MAP = {
  'norsk hydro': 'NHY.OL',
  'equinor': 'EQNR.OL',
  'dnb': 'DNB.OL',
  // ... 40+ aksjer mappet
};
```

## Portefølje-struktur

```typescript
interface Portfolio {
  id: string;
  name: string;
  description?: string;
  
  strategyId?: StrategyId;          // Hvis én strategi
  allowedStrategies?: StrategyId[]; // Hvis flere
  
  trades: Trade[];                  // Populeres ved henting
  stats?: PortfolioStats;           // Beregnes on-demand
}
```

## Flytte Trade Mellom Porteføljer

Via `updateTrade()`:

```typescript
updateTrade({
  id: trade.id,
  portfolioId: 'new-portfolio-id'
});
```

**Merk:** Strategi på trade endres IKKE automatisk ved flytting. Må endres separat.

## Bytte Strategi på Trade

Via `updateTrade()`:

```typescript
updateTrade({
  id: trade.id,
  strategyId: 'MOMENTUM_ASYM'  // Ny strategi
});
```

## Statistikk-beregning

### Per Portefølje

```typescript
function getPortfolioStats(portfolioId: string) {
  const trades = getTradesByPortfolio(portfolioId);
  const activeTrades = trades.filter(t => t.status === 'ACTIVE');
  const closedTrades = trades.filter(t => t.status !== 'ACTIVE');
  const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
  
  return {
    totalTrades: trades.length,
    activeTrades: activeTrades.length,
    closedTrades: closedTrades.length,
    totalInvested: sum(activeTrades, t => t.entryPrice * t.quantity),
    totalRealizedPnL: sum(closedTrades, t => t.realizedPnL || 0),
    winRate: closedTrades.length > 0 
      ? (winningTrades.length / closedTrades.length) * 100 
      : 0
  };
}
```

### Per Strategi

```typescript
function getStrategyStats(strategyId: StrategyId) {
  const trades = getTradesByStrategy(strategyId);
  // Samme beregning som over
  return { totalTrades, activeTrades, closedTrades, winRate, totalPnL, avgReturn };
}
```

## Utbytte (Dividends)

### Data-struktur

```typescript
interface Dividend {
  id: string;
  ticker: string;
  name?: string;
  date: Date;
  quantity: number;           // Antall aksjer
  dividendPerShare: number;
  totalAmount: number;
  currency: string;           // NOK, USD, etc.
  source?: 'NORDNET' | 'MANUAL';
}
```

### Import fra Nordnet

```
28.11.2025
Aksjesparekonto · 55702096
Utbytte
Kid
80
2,50
-
200,00 NOK
```

### Utbytte-statistikk

```typescript
interface DividendSummary {
  ticker: string;
  totalDividends: number;      // Sum mottatt
  dividendCount: number;       // Antall utbetalinger
  avgDividendPerShare: number;
  lastDividendDate?: Date;
}
```

## Eksport/Import av Data

### Eksporter all data

```typescript
exportLocalData(): string {
  return JSON.stringify({
    portfolios: [...],
    trades: [...],
    dividends: [...]
  }, null, 2);
}
```

### Importer data

```typescript
importLocalData(jsonData: string): boolean {
  const data = JSON.parse(jsonData);
  if (data.portfolios) saveToStorage(KEYS.PORTFOLIOS, data.portfolios);
  if (data.trades) saveToStorage(KEYS.TRADES, data.trades);
  if (data.dividends) saveToStorage(KEYS.DIVIDENDS, data.dividends);
  return true;
}
```

## Begrensninger

1. **localStorage-begrensning:** ~5-10MB per domene
2. **Ingen synkronisering:** Data kun på én enhet
3. **Ingen backup:** Sletter browser-data = mister alt
4. **Ingen validering:** Kan manuelt redigere feil data
5. **Ticker-normalisering:** Ikke alle aksjer mappet
6. **Ingen FIFO/LIFO:** Salg matcher eldste kjøp, ikke nødvendigvis riktig
