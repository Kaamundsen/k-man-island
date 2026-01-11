import { Trade } from '../types';

/**
 * Dead Money Logic:
 * A trade is considered "dead money" if it has consumed more than 50% of the planned time
 * but has not moved at least halfway to the target price.
 * 
 * This helps identify positions that are not performing as expected and may need review.
 */

export interface DeadMoneyAnalysis {
  isDeadMoney: boolean;
  timeProgress: number;
  priceProgress: number;
  daysElapsed: number;
  daysRemaining: number;
  recommendation: string;
}

export function calculateDeadMoney(
  trade: Trade, 
  currentPrice: number
): DeadMoneyAnalysis {
  const now = new Date();
  const entryDate = new Date(trade.entryDate);
  const endDate = new Date(trade.timeHorizonEnd);
  
  // Calculate time progress
  const totalTime = endDate.getTime() - entryDate.getTime();
  const elapsedTime = now.getTime() - entryDate.getTime();
  const timeProgress = totalTime > 0 ? Math.min(elapsedTime / totalTime, 1) : 0;
  
  // Calculate price progress
  const targetMove = trade.target - trade.entryPrice;
  const actualMove = currentPrice - trade.entryPrice;
  const priceProgress = targetMove !== 0 ? actualMove / targetMove : 0;
  
  // Calculate days
  const daysElapsed = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Dead Money determination: >50% time used but <50% progress to target
  const isDeadMoney = timeProgress > 0.5 && priceProgress < 0.5;
  
  // Generate recommendation
  let recommendation = '';
  if (isDeadMoney) {
    if (currentPrice < trade.stopLoss) {
      recommendation = 'KRITISK: Pris under stop loss. Vurder umiddelbar exit.';
    } else if (priceProgress < 0) {
      recommendation = 'ADVARSEL: Negativ utvikling. Vurder å stramme inn stop loss eller exit.';
    } else if (priceProgress < 0.25) {
      recommendation = 'Dead Money identifisert. Kapitalen kan gi bedre avkastning andre steder.';
    } else {
      recommendation = 'Langsom progresjon. Overvåk nøye eller vurder delvis exit.';
    }
  } else if (timeProgress > 0.75 && priceProgress < 0.75) {
    recommendation = 'Tidspress: Nærmer seg deadline uten full progresjon. Vurder strategi.';
  } else if (priceProgress >= 0.9) {
    recommendation = 'GODT: Nær target. Vurder å ta profit eller sette trailing stop.';
  } else if (priceProgress >= 0.5) {
    recommendation = 'På rett spor. Fortsett overvåking i henhold til plan.';
  } else {
    recommendation = 'Tidlig fase. Fortsett overvåking.';
  }
  
  return {
    isDeadMoney,
    timeProgress: Math.round(timeProgress * 100),
    priceProgress: Math.round(priceProgress * 100),
    daysElapsed,
    daysRemaining,
    recommendation,
  };
}

/**
 * Calculate the performance status of a trade
 */
export function getTradePerformanceStatus(
  trade: Trade,
  currentPrice: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
  const profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
  
  if (currentPrice <= trade.stopLoss) {
    return 'critical';
  }
  
  const targetPercent = ((trade.target - trade.entryPrice) / trade.entryPrice) * 100;
  const progressToTarget = profitPercent / targetPercent;
  
  if (progressToTarget >= 0.9) return 'excellent';
  if (progressToTarget >= 0.6) return 'good';
  if (progressToTarget >= 0.3) return 'fair';
  if (profitPercent >= 0) return 'fair';
  return 'poor';
}

/**
 * Get color coding for Dead Money status
 */
export function getDeadMoneyColor(analysis: DeadMoneyAnalysis): {
  bg: string;
  text: string;
  border: string;
} {
  if (analysis.isDeadMoney) {
    if (analysis.priceProgress < 0) {
      return {
        bg: 'bg-brand-rose/10',
        text: 'text-brand-rose',
        border: 'border-brand-rose',
      };
    }
    return {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
    };
  }
  
  if (analysis.priceProgress >= 90) {
    return {
      bg: 'bg-brand-emerald/10',
      text: 'text-brand-emerald',
      border: 'border-brand-emerald',
    };
  }
  
  return {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
  };
}

/**
 * Batch analyze multiple trades for Dead Money
 */
export function analyzePortfolio(
  trades: Trade[],
  currentPrices: Record<string, number>
): Array<Trade & { deadMoneyAnalysis: DeadMoneyAnalysis }> {
  return trades
    .filter(trade => trade.status === 'ACTIVE')
    .map(trade => ({
      ...trade,
      deadMoneyAnalysis: calculateDeadMoney(trade, currentPrices[trade.ticker] || trade.entryPrice),
    }))
    .sort((a, b) => {
      // Sort: Dead Money first, then by time progress
      if (a.deadMoneyAnalysis.isDeadMoney && !b.deadMoneyAnalysis.isDeadMoney) return -1;
      if (!a.deadMoneyAnalysis.isDeadMoney && b.deadMoneyAnalysis.isDeadMoney) return 1;
      return b.deadMoneyAnalysis.timeProgress - a.deadMoneyAnalysis.timeProgress;
    });
}
