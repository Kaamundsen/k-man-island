# 19_CORE_SCORE_IMPLEMENTATION_V2

## Status: Implemented
Date: 2026-01-19

## Overview
Documents how CORE scoring is implemented, aligned with 11_CORE_ENGINE_V2.md.

---

## Two-Tier Scoring System

### 1. Strategy Registry Scoring (`src/lib/strategies/registry.ts`)

Each strategy profile has configurable weights:

```typescript
scoreWeights: {
  kScore: number;     // K-Momentum score (0-1)
  rsi: number;        // RSI (0-1)
  riskReward: number; // Risk/Reward (0-1)
  trend: number;      // Trend alignment (0-1)
  volume: number;     // Volume/liquidity (0-1)
}
```

#### CORE_TREND Weights
- kScore: 0.35
- rsi: 0.15
- riskReward: 0.25
- trend: 0.20
- volume: 0.05

#### CORE_ASYM Weights
- kScore: 0.25
- rsi: 0.10
- riskReward: 0.40 (highest for asymmetric)
- trend: 0.15
- volume: 0.10

### 2. V2 Core Engine Scoring (`src/v2/core/core-engine/profiles/`)

#### trend.ts - CORE_TREND Profile
Hard filters:
- Price > SMA50
- SMA50 > SMA200
- RSI 40-70
- R/R >= 1.8

Soft score components:
- Trend strength
- Volume confirmation
- Distance from 52-week high

#### asym.ts - CORE_ASYM Profile
Hard filters:
- ATR% >= 3%
- R/R >= 3.0

Soft score components:
- Asymmetry potential
- Breakout proximity
- Volume spike detection

---

## Score Calculation Function

```typescript
export function calculateStrategyScore(stock: Stock, profile: StrategyProfile): number {
  const config = STRATEGY_REGISTRY[profile];
  const weights = config.scoreWeights;
  let score = 0;
  
  // K-Score component (0-100)
  score += stock.kScore * weights.kScore;
  
  // RSI component (optimal around 50)
  const rsiOptimal = 50;
  const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
  const rsiScore = Math.max(0, 100 - (rsiDistance * 2));
  score += rsiScore * weights.rsi;
  
  // Risk/Reward component
  const riskRewardRatio = stock.gainPercent / Math.max(0.1, stock.riskPercent);
  const rrScore = Math.min(100, riskRewardRatio * 25);
  score += rrScore * weights.riskReward;
  
  // Trend component
  const trendScore = Math.max(0, Math.min(100, 50 + (stock.changePercent * 10)));
  score += trendScore * weights.trend;
  
  // Volume component
  score += 70 * weights.volume;
  
  return Math.round(Math.min(100, score));
}
```

---

## Filter Implementation

```typescript
export function passesStrategyFilters(stock: Stock, profile: StrategyProfile): boolean {
  const filters = STRATEGY_REGISTRY[profile].filters;
  
  if (filters.minKScore && stock.kScore < filters.minKScore) return false;
  if (filters.maxRsi && stock.rsi > filters.maxRsi) return false;
  if (filters.minRsi && stock.rsi < filters.minRsi) return false;
  
  const rr = stock.gainPercent / Math.max(0.1, stock.riskPercent);
  if (filters.minRiskReward && rr < filters.minRiskReward) return false;
  
  return true;
}
```

---

## CORE Qualification Check

```typescript
export function qualifiesForCore(stock: Stock): { 
  qualifies: boolean; 
  profile: CoreProfile | null; 
  score: number 
} {
  const trendPasses = passesStrategyFilters(stock, 'CORE_TREND');
  const asymPasses = passesStrategyFilters(stock, 'CORE_ASYM');
  
  if (!trendPasses && !asymPasses) {
    return { qualifies: false, profile: null, score: 0 };
  }
  
  const trendScore = trendPasses ? calculateStrategyScore(stock, 'CORE_TREND') : 0;
  const asymScore = asymPasses ? calculateStrategyScore(stock, 'CORE_ASYM') : 0;
  
  // Prefer ASYM if score is higher and passes filters
  if (asymScore > trendScore && asymPasses) {
    return { qualifies: true, profile: 'CORE_ASYM', score: asymScore };
  } else if (trendPasses) {
    return { qualifies: true, profile: 'CORE_TREND', score: trendScore };
  }
  
  return { qualifies: false, profile: null, score: 0 };
}
```

---

## Strategy-Specific Filters

| Profile | minKScore | RSI Range | minR/R | Volume |
|---------|-----------|-----------|--------|--------|
| CORE_TREND | 70 | 40-65 | 1.8 | - |
| CORE_ASYM | 65 | <60 | 3.0 | - |
| SWING | 65 | 35-65 | 1.5 | - |
| REBOUND | - | <40 | 2.5 | - |
| DAYTRADER | - | - | - | 10M+ |

---

## Usage in Dashboard

The dashboard uses composite scoring for ranking:

```typescript
const calculateCompositeScore = (stock: Stock): number => {
  let score = 0;
  score += stock.kScore * 0.5;        // K-Score: 50%
  
  const rsiOptimal = 50;
  const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
  const rsiScore = Math.max(0, 100 - (rsiDistance * 3));
  score += rsiScore * 0.2;            // RSI: 20%
  
  const riskRewardRatio = stock.gainPercent / stock.riskPercent;
  const rrScore = Math.min(100, riskRewardRatio * 20);
  score += rrScore * 0.3;             // R/R: 30%
  
  return score;
};
```

---

## Notes

- CORE_ASYM has stricter R/R requirements (3.0+) but lower K-Score threshold
- CORE_TREND prioritizes trend confirmation over asymmetric opportunity
- Satellite strategies have more relaxed filters for learning/comparison
- Trackers use filters for classification, not recommendation
