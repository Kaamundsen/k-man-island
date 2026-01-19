/**
 * Strategy Registry - Core Slot Management
 * 
 * Manages core trading slots and qualifications for the V2 system.
 */

import { STRATEGIES, StrategyId } from './index';

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
