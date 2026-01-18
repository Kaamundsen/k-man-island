# 04_REPORTING_AS_IS.md - Rapportdokumentasjon

> Dokumentasjon av daglig rapport og portefølje-evaluering.

## Daglig Rapport Oversikt

Rapporten genereres i `/src/app/rapport/page.tsx` og bruker:
- `evaluatePortfolio()` fra `portfolio-evaluation.ts`
- `generateDailyReport()` for tekstgenerering

## Hva Rapporten Viser

1. **Quick Summary Cards**
   - Aktive trades (antall)
   - Urealisert P/L (kr)
   - Krever handling (antall critical/high)
   - Win Rate (%)

2. **Påminnelser og varsler**
   - Fra `notes-store.ts` (brukerdefinerte)

3. **Porteføljestatus**
   - Investert beløp
   - Nåværende verdi
   - Total P/L (kr og %)
   - Aktive trades

4. **Handlingsanbefalinger (accordion)**
   - 🔴 Krever handling nå (STRONG_SELL, SELL med critical/high urgency)
   - 🟠 Selg (SELL med lower urgency)
   - 🟡 Hold
   - 🟢 Kjøp mer

5. **Dagsrapport (tekst)**
   - Generert markdown-tekst med oppsummering

## Evaluering av Enkelt Trade

```typescript
interface TradeEvaluation {
  trade: Trade;
  currentPrice: number;
  
  // P/L
  unrealizedPnL: number;           // (currentPrice - entryPrice) * quantity
  unrealizedPnLPercent: number;    // unrealizedPnL / entryValue * 100
  
  // Progress
  progressToTarget: number;        // 0-100%+
  progressToStop: number;          // 0-100%
  daysHeld: number;
  daysToDeadline: number;          // Kan være negativ
  
  // Recommendation
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  reasons: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  
  // Warnings
  warnings: string[];
}
```

## SELL-logikk (Hva Trigger SELL)

### STRONG_SELL (kritisk)

```typescript
// 1. Stop loss trigget
if (currentPrice <= trade.stopLoss) {
  recommendation = 'STRONG_SELL';
  reasons.push('🛑 STOP LOSS TRIGGET! Selg umiddelbart');
  urgency = 'critical';
}

// 2. Target nådd
if (progressToTarget >= 100) {
  recommendation = 'STRONG_SELL';
  reasons.push(`✅ Target nådd! Opp ${unrealizedPnLPercent.toFixed(1)}%`);
  urgency = 'high';
}
```

### SELL (medium)

```typescript
// 3. Nær target (80-99%)
if (progressToTarget >= 80 && progressToTarget < 100) {
  recommendation = 'SELL';
  reasons.push(`🎯 Nær target (${progressToTarget.toFixed(0)}%)`);
  urgency = 'medium';
}

// 4. Nær stop (>60% av veien til stop)
if (progressToStop >= 60) {
  recommendation = 'SELL';
  reasons.push('⚠️ Nær stop loss');
  urgency = 'high';
}

// 5. Over tidsfristen
if (daysToDeadline < 0) {
  recommendation = 'SELL';
  reasons.push(`⏰ Over tidsfristen med ${Math.abs(daysToDeadline)} dager`);
  warnings.push('Dead money - kapital bundet opp for lenge');
  urgency = 'medium';
}
```

## HOLD-logikk

```typescript
// God progresjon
if (progressToTarget >= 30 && progressToTarget < 80) {
  recommendation = 'HOLD';
  reasons.push(`📈 God progresjon (${progressToTarget.toFixed(0)}% mot target)`);
  
  if (daysToDeadline < 7) {
    warnings.push(`Kun ${daysToDeadline} dager igjen`);
    urgency = 'medium';
  }
}

// Flat/stabil posisjon
if (unrealizedPnLPercent > -5 && progressToStop < 30) {
  recommendation = 'HOLD';
  reasons.push('Posisjon er stabil, avventer signal');
}
```

## BUY (Kjøp Mer) Logikk

```typescript
// Lønnsom med momentum (krever historisk profil)
if (profile && unrealizedPnLPercent > 5 && profile.return1m > 0) {
  recommendation = 'BUY';
  reasons.push('💪 Sterk momentum, vurder å øke posisjon');
}
```

**VIKTIG:** BUY-anbefalinger vises sjelden fordi de krever:
1. Tilgang til `StockAnalysisProfile` (historisk data)
2. Positiv urealisert gevinst (>5%)
3. Positiv 1-måneds avkastning

## Warnings

```typescript
// Lang holdetid uten fremgang
if (daysHeld > 30 && progressToTarget < 20) {
  warnings.push(`Holdt i ${daysHeld} dager uten vesentlig fremgang`);
}

// Nær deadline med lav progresjon
if (daysToDeadline > 0 && daysToDeadline < 5 && progressToTarget < 50) {
  warnings.push(`Tidsfrist nærmer seg, kun ${daysToDeadline} dager igjen`);
}

// Sesong-basert (hvis profil tilgjengelig)
if (isWorstMonth) {
  warnings.push(`${month} er historisk svak måned`);
}

// Svak momentum
if (profile.return1m < -10) {
  warnings.push(`Svak momentum siste måned (${profile.return1m.toFixed(1)}%)`);
}
```

## Pris-henting i Rapport

```typescript
// Prøver å hente live priser fra API
const response = await fetch(`/api/quotes?tickers=${tickers.join(',')}`);
const quotesData = await response.json();

// Fallback hvis API feiler
if (!quote.price) {
  prices[ticker] = trade.currentPrice || trade.entryPrice;
}
```

## Kjente Svakheter

### 1. Income vs Swing - Samme Logikk
Rapporten skiller IKKE mellom strategier:
- DIVIDEND_HUNTER trade evalueres likt som DAYTRADER
- Tidsfristen har samme betydning for alle
- Stop/target-logikken er identisk

### 2. Ingen Strategi-spesifikk Evaluering
```typescript
// Bruker IKKE strategi-definisjoner
// F.eks. BUFFETT har typicalHoldingDays: 60-365
// Men rapport varsler etter 30 dager uansett
```

### 3. Target er Fast Basert på Entry
- Target oppdateres IKKE basert på ny K-Score
- En aksje kan ha nytt signal=SELL men trade sier fortsatt HOLD

### 4. Ingen Fundamental Støtte
- Earnings date ignoreres
- Utbytte-dato ignoreres
- P/E-endringer ignoreres

### 5. Statiske Thresholds
```typescript
// Hardkodede verdier:
progressToTarget >= 100  // STRONG_SELL
progressToTarget >= 80   // SELL
progressToStop >= 60     // SELL
daysToDeadline < 0       // SELL
daysHeld > 30            // Warning
```

### 6. Profile-data Mangler Ofte
`StockAnalysisProfile` krever ekstra API-kall som sjelden gjøres:
- Sesong-warnings vises ikke
- BUY-anbefalinger vises nesten aldri
- Momentum-warnings mangler

### 7. Win Rate Beregning
```typescript
// Kun basert på lukkede trades
winRate = winners.length / closedTrades.length * 100;
// Sier ingenting om aktive trades
// Sier ingenting om R-multiple
```

## Generert Rapport-format

```markdown
# Daglig Porteføljerapport
*mandag 13. januar 2025*

## 📈 Totalstatus
- Investert: 150 000 kr
- Nåværende verdi: 162 500 kr
- P/L: +12 500 kr (+8.3%)

## 🚨 Krever handling (2)
### NHY.OL
- Anbefaling: **STRONG_SELL**
- ✅ Target nådd! Opp 15.2%

### EQNR.OL
- Anbefaling: **SELL**
- 🛑 STOP LOSS TRIGGET! Selg umiddelbart

## ⚠️ Advarsler (1)
- **DNB.OL**: Holdt i 45 dager uten vesentlig fremgang

## 📊 Oppsummering
- Trades ved target: 1
- Trades i risikosonen: 1
- Trades over tidsfrist: 0

## 📋 Anbefalinger
- 🔴 SELG NÅ: 1
- 🟠 Selg: 1
- 🟡 Hold: 3
- 🟢 Kjøp mer: 0
```

## Sortering av Evaluations

```typescript
// Sorteres på urgency (kritiske først)
const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
evaluations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
```
