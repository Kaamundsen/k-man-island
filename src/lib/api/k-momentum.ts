import { Stock } from '../types';
import {
  FinnhubCandle,
  calculateSMA,
  calculateATR,
  calculateRelativeVolume,
  findHighest,
} from './finnhub';

export interface KMomentumResult {
  passed: boolean;
  score: number;
  breakdownScores: {
    breakoutStrength: number;
    trendStrength: number;
    relVolume: number;
    roomToRun: number;
    volatilityFit: number;
  };
  failedFilters: string[];
  suggestedEntry: number;
  suggestedStop: number;
  suggestedTarget: number;
  riskRewardRatio: number;
}

export interface KMomentumConfig {
  minLiquidity: number; // Minimum daily value traded
  breakoutThreshold: number; // % from 20d high to qualify
  relVolumeMin: number; // Minimum relative volume
  maxPositions: number;
  maxNewEntriesPerDay: number;
  timeLimitDays: number;
}

export const DEFAULT_CONFIG: KMomentumConfig = {
  minLiquidity: 5_000_000, // 5M NOK/USD daily
  breakoutThreshold: 2, // Within 2% of 20d high
  relVolumeMin: 1.2,
  maxPositions: 5,
  maxNewEntriesPerDay: 2,
  timeLimitDays: 15,
};

/**
 * Kjør K-Momentum analyse på en aksje
 */
export function analyzeKMomentum(
  candles: FinnhubCandle,
  currentPrice: number,
  config: KMomentumConfig = DEFAULT_CONFIG
): KMomentumResult {
  const { c: closes, h: highs, l: lows, o: opens, v: volumes } = candles;
  
  if (closes.length < 200) {
    return createFailedResult('Insufficient data (need 200+ days)');
  }
  
  const failedFilters: string[] = [];
  
  // HARD FILTERS
  
  // 1. SMA50 > SMA200 (Golden Cross)
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);
  
  if (!sma50 || !sma200) {
    return createFailedResult('Cannot calculate SMAs');
  }
  
  if (sma50 <= sma200) {
    failedFilters.push('SMA50 not above SMA200');
  }
  
  // 2. Close > SMA50
  if (currentPrice <= sma50) {
    failedFilters.push('Price not above SMA50');
  }
  
  // 3. RSI < 70 (not overbought)
  const rsi = calculateRSI(closes, 14);
  if (rsi >= 70) {
    failedFilters.push('RSI >= 70 (overbought)');
  }
  
  // 4. Liquidity check
  const avgVolume = volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
  const dailyValue = avgVolume * currentPrice;
  
  if (dailyValue < config.minLiquidity) {
    failedFilters.push(`Liquidity too low (${(dailyValue / 1_000_000).toFixed(1)}M)`);
  }
  
  // 5. Breakout candidate
  const high20 = findHighest(closes, 20);
  const distanceFromHigh = ((currentPrice - high20) / high20) * 100;
  
  if (distanceFromHigh < -config.breakoutThreshold) {
    failedFilters.push(`Too far from 20d high (${distanceFromHigh.toFixed(1)}%)`);
  }
  
  // 6. Relative Volume
  const relVol = calculateRelativeVolume(volumes, 20);
  
  if (relVol < config.relVolumeMin) {
    failedFilters.push(`RelVol too low (${relVol.toFixed(2)})`);
  }
  
  // If failed any filter, return early
  if (failedFilters.length > 0) {
    return createFailedResult(failedFilters.join('; '));
  }
  
  // CALCULATE K-MOMENTUM SCORE (0-100)
  
  // 1. Breakout Strength (0-30)
  const dayHigh = highs[highs.length - 1];
  const dayLow = lows[lows.length - 1];
  const dayRange = dayHigh - dayLow;
  
  const distanceAbove20High = Math.max(0, currentPrice - high20);
  const closeNearDayHigh = dayRange > 0 ? ((currentPrice - dayLow) / dayRange) : 0.5;
  
  const breakoutStrength = Math.min(30, 
    (distanceAbove20High / high20) * 200 + // Max 20 poeng
    (closeNearDayHigh * 10) // Max 10 poeng
  );
  
  // 2. Trend Strength (0-25)
  const sma50Slope = calculateSlope(closes.slice(-60, -10), 50);
  const distanceAboveSMA50 = ((currentPrice - sma50) / sma50) * 100;
  
  const trendStrength = Math.min(25,
    (sma50Slope * 100) + // Max 15 poeng
    (distanceAboveSMA50 * 2) // Max 10 poeng
  );
  
  // 3. Relative Volume (0-20)
  const relVolumeScore = Math.min(20, (relVol - 1) * 20);
  
  // 4. Room to Run (0-15)
  const high52 = Math.max(...closes);
  const roomToRun = ((high52 - currentPrice) / currentPrice) * 100;
  const roomScore = Math.min(15, roomToRun / 2);
  
  // 5. Volatility Fit (0-10)
  const atr = calculateATR(highs, lows, closes, 14);
  const atrPercent = atr ? (atr / currentPrice) * 100 : 0;
  
  // Prefer 2-5% ATR (sweet spot for swing trading)
  let volScore = 0;
  if (atrPercent >= 2 && atrPercent <= 5) {
    volScore = 10;
  } else if (atrPercent >= 1 && atrPercent < 2) {
    volScore = 5;
  } else if (atrPercent > 5 && atrPercent <= 8) {
    volScore = 5;
  }
  
  const totalScore = Math.round(
    breakoutStrength + 
    trendStrength + 
    relVolumeScore + 
    roomScore + 
    volScore
  );
  
  // EXECUTION PLAN
  const suggestedStop = currentPrice - (atr || currentPrice * 0.02) * 2;
  const riskAmount = currentPrice - suggestedStop;
  const suggestedTarget = currentPrice + (riskAmount * 3); // 3R target
  const riskRewardRatio = (suggestedTarget - currentPrice) / riskAmount;
  
  return {
    passed: true,
    score: totalScore,
    breakdownScores: {
      breakoutStrength: Math.round(breakoutStrength),
      trendStrength: Math.round(trendStrength),
      relVolume: Math.round(relVolumeScore),
      roomToRun: Math.round(roomScore),
      volatilityFit: Math.round(volScore),
    },
    failedFilters: [],
    suggestedEntry: Math.round(currentPrice * 100) / 100,
    suggestedStop: Math.round(suggestedStop * 100) / 100,
    suggestedTarget: Math.round(suggestedTarget * 100) / 100,
    riskRewardRatio: Math.round(riskRewardRatio * 100) / 100,
  };
}

/**
 * Helper: Calculate RSI
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / period;
  const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / period;
  
  if (losses === 0) return 100;
  
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

/**
 * Helper: Calculate slope of SMA
 */
function calculateSlope(closes: number[], period: number): number {
  if (closes.length < period) return 0;
  
  const smaStart = calculateSMA(closes.slice(0, period), period) || 0;
  const smaEnd = calculateSMA(closes.slice(-period), period) || 0;
  
  return ((smaEnd - smaStart) / smaStart);
}

/**
 * Helper: Create failed result
 */
function createFailedResult(reason: string): KMomentumResult {
  return {
    passed: false,
    score: 0,
    breakdownScores: {
      breakoutStrength: 0,
      trendStrength: 0,
      relVolume: 0,
      roomToRun: 0,
      volatilityFit: 0,
    },
    failedFilters: [reason],
    suggestedEntry: 0,
    suggestedStop: 0,
    suggestedTarget: 0,
    riskRewardRatio: 0,
  };
}
