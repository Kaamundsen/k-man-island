/**
 * Strategy Registry - Core Slot Management + Scoring
 * 
 * V2-compliant strategy management:
 * - Core slot limits (3 TREND, 2 ASYM, max 5 total)
 * - Strategy-specific scoring weights
 * - Qualification filters per strategy
 * 
 * See docs/15_STRATEGY_PACKS_V2.md
 */

import { STRATEGIES, StrategyId, StrategyDefinition } from './index';
import { Stock } from '../types';

// ============================================
// CORE SLOT CONFIGURATION
// ============================================

// Default max core slots for the portfolio
const DEFAULT_MAX_CORE_SLOTS = 5;

// Profile-based slot limits
const PROFILE_SLOTS = {
  TREND: 3,   // Max 3 trend positions
  ASYM: 2,    // Max 2 asymmetric positions
};

// ============================================
// CORE QUALIFICATION
// ============================================

export interface CoreQualification {
  qualifies: boolean;
  profile: 'TREND' | 'ASYM' | null;
  reasons: string[];
  score: number;
}

/**
 * Check if a stock/trade qualifies for CORE position
 * Based on V2 docs - only MOMENTUM_TREND and MOMENTUM_ASYM qualify
 */
export function qualifiesForCore(
  strategyId: StrategyId,
  kScore?: number,
  riskRewardRatio?: number
): CoreQualification {
  const reasons: string[] = [];
  let qualifies = false;
  let profile: 'TREND' | 'ASYM' | null = null;
  let score = 0;

  // Only momentum strategies qualify for CORE
  if (strategyId === 'MOMENTUM_TREND') {
    profile = 'TREND';
    qualifies = true;
    reasons.push('MOMENTUM_TREND strategi kvalifiserer for CORE TREND');
    score = 70;

    if (kScore && kScore >= 75) {
      reasons.push(`K-Score ${kScore} - sterk kandidat`);
      score = 85;
    }
  } else if (strategyId === 'MOMENTUM_ASYM') {
    profile = 'ASYM';
    qualifies = true;
    reasons.push('MOMENTUM_ASYM strategi kvalifiserer for CORE ASYM');
    score = 65;

    if (riskRewardRatio && riskRewardRatio >= 3) {
      reasons.push(`R/R ${riskRewardRatio}:1 - god asymmetri`);
      score = 80;
    }
  } else {
    reasons.push(`${strategyId} er ikke en CORE-kvalifisert strategi`);
    reasons.push('Kun MOMENTUM_TREND og MOMENTUM_ASYM kvalifiserer');
  }

  return {
    qualifies,
    profile,
    reasons,
    score,
  };
}

/**
 * Get maximum number of CORE slots
 */
export function getMaxCoreSlots(): number {
  // Could be made configurable via settings
  return DEFAULT_MAX_CORE_SLOTS;
}

/**
 * Get maximum slots per profile type
 */
export function getMaxSlotsPerProfile(): typeof PROFILE_SLOTS {
  return { ...PROFILE_SLOTS };
}

/**
 * Check if there's room for a new CORE position
 */
export function hasAvailableCoreSlot(
  currentTrendCount: number,
  currentAsymCount: number,
  profile: 'TREND' | 'ASYM'
): boolean {
  const totalUsed = currentTrendCount + currentAsymCount;
  
  if (totalUsed >= DEFAULT_MAX_CORE_SLOTS) {
    return false;
  }

  if (profile === 'TREND' && currentTrendCount >= PROFILE_SLOTS.TREND) {
    return false;
  }

  if (profile === 'ASYM' && currentAsymCount >= PROFILE_SLOTS.ASYM) {
    return false;
  }

  return true;
}

/**
 * Get CORE-qualified strategies
 */
export function getCoreStrategies() {
  return [
    STRATEGIES.MOMENTUM_TREND,
    STRATEGIES.MOMENTUM_ASYM,
  ];
}

/**
 * Calculate recommended position size for CORE
 * Based on total capital and max slots
 */
export function calculateCorePositionSize(
  totalCapital: number,
  riskPerTradePercent: number = 1
): {
  maxPositionSize: number;
  riskAmount: number;
  recommendedShares: (price: number, stopLoss: number) => number;
} {
  const maxSlots = getMaxCoreSlots();
  const maxPositionSize = totalCapital / maxSlots;
  const riskAmount = (totalCapital * riskPerTradePercent) / 100;

  return {
    maxPositionSize,
    riskAmount,
    recommendedShares: (price: number, stopLoss: number) => {
      const riskPerShare = price - stopLoss;
      if (riskPerShare <= 0) return 0;
      return Math.floor(riskAmount / riskPerShare);
    },
  };
}

// ============================================
// STRATEGY SCORING WEIGHTS (V2)
// ============================================

export interface StrategyScoreWeights {
  kScore: number;      // K-Score weight (0-1)
  rsi: number;         // RSI weight
  riskReward: number;  // R/R ratio weight
  momentum: number;    // Price momentum weight
  volume: number;      // Volume weight
}

const STRATEGY_WEIGHTS: Record<StrategyId, StrategyScoreWeights> = {
  // Momentum strategies - heavy K-Score and momentum
  MOMENTUM_TREND: { kScore: 0.50, rsi: 0.15, riskReward: 0.20, momentum: 0.10, volume: 0.05 },
  MOMENTUM_ASYM: { kScore: 0.30, rsi: 0.10, riskReward: 0.40, momentum: 0.15, volume: 0.05 },
  
  // Value strategies - balanced
  BUFFETT: { kScore: 0.40, rsi: 0.20, riskReward: 0.20, momentum: 0.10, volume: 0.10 },
  TVEITEREID: { kScore: 0.30, rsi: 0.15, riskReward: 0.15, momentum: 0.15, volume: 0.25 },
  
  // Rebound - RSI focused
  REBOUND: { kScore: 0.20, rsi: 0.40, riskReward: 0.25, momentum: 0.10, volume: 0.05 },
  
  // Insider - special handling
  INSIDER: { kScore: 0.30, rsi: 0.10, riskReward: 0.20, momentum: 0.10, volume: 0.30 },
  
  // Short-term
  DAYTRADER: { kScore: 0.20, rsi: 0.25, riskReward: 0.15, momentum: 0.30, volume: 0.10 },
  SWING_SHORT: { kScore: 0.30, rsi: 0.20, riskReward: 0.20, momentum: 0.20, volume: 0.10 },
  
  // Analyst picks - rely on external scores
  DNB_MONTHLY: { kScore: 0.40, rsi: 0.15, riskReward: 0.25, momentum: 0.10, volume: 0.10 },
  PARETO_TOP: { kScore: 0.40, rsi: 0.15, riskReward: 0.25, momentum: 0.10, volume: 0.10 },
  ARCTIC_PICKS: { kScore: 0.40, rsi: 0.15, riskReward: 0.25, momentum: 0.10, volume: 0.10 },
  ANALYST_CONSENSUS: { kScore: 0.40, rsi: 0.15, riskReward: 0.25, momentum: 0.10, volume: 0.10 },
  
  // Event-based
  EARNINGS_PLAY: { kScore: 0.25, rsi: 0.20, riskReward: 0.30, momentum: 0.15, volume: 0.10 },
  SECTOR_ROTATION: { kScore: 0.35, rsi: 0.15, riskReward: 0.20, momentum: 0.20, volume: 0.10 },
  DIVIDEND_HUNTER: { kScore: 0.30, rsi: 0.20, riskReward: 0.15, momentum: 0.05, volume: 0.30 },
  
  // "Honest" strategies - minimal filtering
  YOLO: { kScore: 0.25, rsi: 0.25, riskReward: 0.25, momentum: 0.25, volume: 0.00 },
  TIPS: { kScore: 0.25, rsi: 0.25, riskReward: 0.25, momentum: 0.25, volume: 0.00 },
  HODL: { kScore: 0.30, rsi: 0.10, riskReward: 0.10, momentum: 0.10, volume: 0.40 },
  FOMO: { kScore: 0.15, rsi: 0.15, riskReward: 0.10, momentum: 0.50, volume: 0.10 },
  
  // Expert
  UKENS_AKSJE: { kScore: 0.35, rsi: 0.15, riskReward: 0.25, momentum: 0.15, volume: 0.10 },
};

// ============================================
// STRATEGY FILTERS (V2)
// ============================================

export interface StrategyFilters {
  minKScore: number;
  maxRsi?: number;
  minRsi?: number;
  minRiskReward: number;
  minChangePercent?: number;
  maxChangePercent?: number;
}

const STRATEGY_FILTERS: Record<StrategyId, StrategyFilters> = {
  MOMENTUM_TREND: { minKScore: 70, maxRsi: 65, minRsi: 35, minRiskReward: 1.5 },
  MOMENTUM_ASYM: { minKScore: 60, maxRsi: 70, minRsi: 30, minRiskReward: 2.5 },
  BUFFETT: { minKScore: 65, maxRsi: 60, minRiskReward: 1.5 },
  TVEITEREID: { minKScore: 60, minRiskReward: 1.3 },
  REBOUND: { minKScore: 40, maxRsi: 45, minRiskReward: 2.0, minChangePercent: -5 },
  INSIDER: { minKScore: 50, minRiskReward: 1.5 },
  DAYTRADER: { minKScore: 55, maxRsi: 70, minRsi: 30, minRiskReward: 1.2, minChangePercent: 0.5 },
  SWING_SHORT: { minKScore: 60, maxRsi: 65, minRiskReward: 1.5 },
  DNB_MONTHLY: { minKScore: 55, minRiskReward: 1.3 },
  PARETO_TOP: { minKScore: 55, minRiskReward: 1.3 },
  ARCTIC_PICKS: { minKScore: 55, minRiskReward: 1.3 },
  ANALYST_CONSENSUS: { minKScore: 55, minRiskReward: 1.3 },
  EARNINGS_PLAY: { minKScore: 50, minRiskReward: 1.8 },
  SECTOR_ROTATION: { minKScore: 60, minRiskReward: 1.5 },
  DIVIDEND_HUNTER: { minKScore: 50, minRiskReward: 1.0 },
  YOLO: { minKScore: 0, minRiskReward: 0 },
  TIPS: { minKScore: 0, minRiskReward: 0 },
  HODL: { minKScore: 0, minRiskReward: 0 },
  FOMO: { minKScore: 0, minRiskReward: 0 },
  UKENS_AKSJE: { minKScore: 55, minRiskReward: 1.5 },
};

// ============================================
// SCORING FUNCTIONS
// ============================================

/**
 * Calculate strategy-specific score for a stock
 */
export function calculateStrategyScore(
  stock: Stock,
  strategyId: StrategyId
): number {
  const weights = STRATEGY_WEIGHTS[strategyId] || STRATEGY_WEIGHTS.MOMENTUM_TREND;
  
  // Normalize inputs to 0-100 scale
  const kScoreNorm = stock.kScore; // Already 0-100
  
  // RSI: optimal is 50, score decreases as it moves away
  const rsiOptimal = 50;
  const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
  const rsiNorm = Math.max(0, 100 - (rsiDistance * 2));
  
  // Risk/Reward: higher is better, cap at 5:1
  const rr = stock.gainPercent / Math.max(0.1, stock.riskPercent);
  const rrNorm = Math.min(100, rr * 20);
  
  // Momentum: positive change is better
  const momentumNorm = Math.max(0, Math.min(100, 50 + (stock.changePercent * 10)));
  
  // Volume: placeholder (we don't have volume in Stock type currently)
  const volumeNorm = 50; // Neutral
  
  // Calculate weighted score
  const score = 
    (kScoreNorm * weights.kScore) +
    (rsiNorm * weights.rsi) +
    (rrNorm * weights.riskReward) +
    (momentumNorm * weights.momentum) +
    (volumeNorm * weights.volume);
  
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Check if a stock passes the filters for a strategy
 */
export function passesStrategyFilters(
  stock: Stock,
  strategyId: StrategyId
): { passed: boolean; reasons: string[] } {
  const filters = STRATEGY_FILTERS[strategyId] || STRATEGY_FILTERS.MOMENTUM_TREND;
  const reasons: string[] = [];
  let passed = true;
  
  // K-Score check
  if (stock.kScore < filters.minKScore) {
    passed = false;
    reasons.push(`K-Score ${stock.kScore} < minimum ${filters.minKScore}`);
  }
  
  // RSI checks
  if (filters.maxRsi && stock.rsi > filters.maxRsi) {
    passed = false;
    reasons.push(`RSI ${stock.rsi} > maximum ${filters.maxRsi} (overkjøpt)`);
  }
  if (filters.minRsi && stock.rsi < filters.minRsi) {
    passed = false;
    reasons.push(`RSI ${stock.rsi} < minimum ${filters.minRsi} (oversolgt)`);
  }
  
  // Risk/Reward check
  const rr = stock.gainPercent / Math.max(0.1, stock.riskPercent);
  if (rr < filters.minRiskReward) {
    passed = false;
    reasons.push(`R/R ${rr.toFixed(1)} < minimum ${filters.minRiskReward}`);
  }
  
  // Change percent checks
  if (filters.minChangePercent !== undefined && stock.changePercent < filters.minChangePercent) {
    passed = false;
    reasons.push(`Endring ${stock.changePercent.toFixed(1)}% < minimum ${filters.minChangePercent}%`);
  }
  if (filters.maxChangePercent !== undefined && stock.changePercent > filters.maxChangePercent) {
    passed = false;
    reasons.push(`Endring ${stock.changePercent.toFixed(1)}% > maximum ${filters.maxChangePercent}%`);
  }
  
  // If passed, add positive reason
  if (passed) {
    reasons.push(`Kvalifiserer for ${STRATEGIES[strategyId]?.name || strategyId}`);
  }
  
  return { passed, reasons };
}

/**
 * Rank stocks by strategy score
 */
export function rankByStrategy(
  stocks: Stock[],
  strategyId: StrategyId,
  filterFirst: boolean = true
): Array<Stock & { strategyScore: number; rank: number }> {
  // Filter stocks that pass strategy criteria
  let candidates = stocks;
  
  if (filterFirst) {
    candidates = stocks.filter(s => passesStrategyFilters(s, strategyId).passed);
  }
  
  // Calculate strategy-specific score and sort
  const ranked = candidates
    .map(stock => ({
      ...stock,
      strategyScore: calculateStrategyScore(stock, strategyId),
      rank: 0,
    }))
    .sort((a, b) => b.strategyScore - a.strategyScore);
  
  // Assign ranks
  ranked.forEach((stock, idx) => {
    stock.rank = idx + 1;
  });
  
  return ranked;
}

/**
 * Get all qualifying stocks per strategy
 */
export function getQualifyingStocksPerStrategy(
  stocks: Stock[]
): Record<StrategyId, Stock[]> {
  const result: Partial<Record<StrategyId, Stock[]>> = {};
  
  const coreStrategies: StrategyId[] = [
    'MOMENTUM_TREND',
    'MOMENTUM_ASYM',
    'BUFFETT',
    'TVEITEREID',
    'REBOUND',
  ];
  
  for (const strategyId of coreStrategies) {
    const qualifying = stocks.filter(s => passesStrategyFilters(s, strategyId).passed);
    if (qualifying.length > 0) {
      result[strategyId] = rankByStrategy(qualifying, strategyId, false)
        .slice(0, 5) // Top 5 per strategy
        .map(s => ({ ...s }));
    }
  }
  
  return result as Record<StrategyId, Stock[]>;
}

/**
 * Determine the best strategy for a stock
 */
export function determineBestStrategy(stock: Stock): {
  strategyId: StrategyId;
  score: number;
  reasons: string[];
} {
  const strategies: StrategyId[] = [
    'MOMENTUM_TREND',
    'MOMENTUM_ASYM',
    'BUFFETT',
    'TVEITEREID',
    'REBOUND',
  ];
  
  let bestStrategy: StrategyId = 'MOMENTUM_TREND';
  let bestScore = 0;
  let bestReasons: string[] = [];
  
  for (const strategyId of strategies) {
    const { passed, reasons } = passesStrategyFilters(stock, strategyId);
    if (passed) {
      const score = calculateStrategyScore(stock, strategyId);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategyId;
        bestReasons = reasons;
      }
    }
  }
  
  return {
    strategyId: bestStrategy,
    score: bestScore,
    reasons: bestReasons,
  };
}
