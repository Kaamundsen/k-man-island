/**
 * SB-Scan (SB-Levels Scoreboard) - Lightweight Quick Scan
 * 
 * This is a fast, lightweight scanner that ranks all stocks in the watchlist
 * WITHOUT running the full deep SB-Levels analysis.
 * 
 * Purpose: Spot the best SB-Levels opportunities from the dashboard
 * at a glance without clicking into each stock.
 * 
 * IMPORTANT: SB-Scan is a PRIORITIZATION layer, not a decision layer.
 * - Never removes, hides, or deactivates stocks
 * - All stocks can always be opened for deep analysis
 * - Score is for ranking only, not veto
 */

export interface SBScanResult {
  ticker: string;
  name: string;
  currentPrice: number;
  
  // Key levels
  resistance: number;
  support: number;
  
  // Percentages
  percentToResistance: number;
  percentToSupport: number;
  atrPercent: number;
  
  // Structure & momentum
  structure: 'Impuls' | 'Trend' | 'Range' | 'Chop';
  momentumBias: 'positive' | 'negative' | 'neutral';
  
  // Scoring
  sbScore: number;
  scoreBreakdown: {
    nearResistance: number;
    structureScore: number;
    volatilityScore: number;
    momentumScore: number;
    notChopScore: number;
  };
  
  // Candidate hint (prioritization only, not decision)
  scenarioHint: 'A-candidate' | 'B-candidate' | 'C/no-edge';
  scenarioReason: string;
  
  // Metadata
  lastUpdated: string;
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Calculate ATR (Average True Range) - lightweight version
 */
function calculateATR(candles: PriceData[], period: number = 14): number {
  if (candles.length < period + 1) {
    const recentCandles = candles.slice(-Math.min(10, candles.length));
    const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / recentCandles.length;
    return avgRange;
  }
  
  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    trueRanges.push(tr);
  }
  
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((sum, tr) => sum + tr, 0) / recentTR.length;
}

/**
 * Find simple resistance level (recent high)
 */
function findResistance(candles: PriceData[], currentPrice: number): number {
  if (candles.length < 5) return currentPrice * 1.05;
  
  const lookbackPeriod = Math.min(30, candles.length);
  const recentCandles = candles.slice(-lookbackPeriod);
  const recentHigh = Math.max(...recentCandles.map(c => c.high));
  
  if (currentPrice >= recentHigh * 0.98) {
    const extendedPeriod = Math.min(60, candles.length);
    const extendedCandles = candles.slice(-extendedPeriod);
    return Math.max(...extendedCandles.map(c => c.high));
  }
  
  return recentHigh;
}

/**
 * Find simple support level (recent low)
 */
function findSupport(candles: PriceData[], currentPrice: number): number {
  if (candles.length < 5) return currentPrice * 0.95;
  
  const lookbackPeriod = Math.min(30, candles.length);
  const recentCandles = candles.slice(-lookbackPeriod);
  const recentLow = Math.min(...recentCandles.map(c => c.low));
  
  if (currentPrice <= recentLow * 1.02) {
    const extendedPeriod = Math.min(60, candles.length);
    const extendedCandles = candles.slice(-extendedPeriod);
    return Math.min(...extendedCandles.map(c => c.low));
  }
  
  return recentLow;
}

/**
 * Determine market structure quickly
 */
function determineStructure(candles: PriceData[]): 'Impuls' | 'Trend' | 'Range' | 'Chop' {
  if (candles.length < 20) return 'Range';
  
  const recent = candles.slice(-20);
  const older = candles.slice(-40, -20);
  
  const recentAvg = recent.reduce((sum, c) => sum + c.close, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, c) => sum + c.close, 0) / older.length 
    : recentAvg;
  
  const recentHighs = recent.map(c => c.high);
  const recentLows = recent.map(c => c.low);
  const first10Highs = recentHighs.slice(0, 10);
  const last10Highs = recentHighs.slice(10);
  const first10Lows = recentLows.slice(0, 10);
  const last10Lows = recentLows.slice(10);
  
  const avgFirst10High = Math.max(...first10Highs);
  const avgLast10High = Math.max(...last10Highs);
  const avgFirst10Low = Math.min(...first10Lows);
  const avgLast10Low = Math.min(...last10Lows);
  
  const higherHighs = avgLast10High > avgFirst10High * 1.01;
  const higherLows = avgLast10Low > avgFirst10Low * 1.01;
  const lowerHighs = avgLast10High < avgFirst10High * 0.99;
  const lowerLows = avgLast10Low < avgFirst10Low * 0.99;
  
  const recentATR = calculateATR(recent, 10);
  const olderATR = older.length >= 10 ? calculateATR(older, 10) : recentATR;
  const volatilityExpanding = recentATR > olderATR * 1.2;
  
  if (higherHighs && higherLows && volatilityExpanding) {
    return 'Impuls';
  }
  
  if (higherHighs && higherLows) {
    return 'Trend';
  }
  
  if (lowerHighs && lowerLows) {
    return 'Trend';
  }
  
  const rangePercent = ((avgLast10High - avgLast10Low) / ((avgLast10High + avgLast10Low) / 2)) * 100;
  if (rangePercent < 10 && !higherHighs && !higherLows && !lowerHighs && !lowerLows) {
    return 'Range';
  }
  
  return 'Chop';
}

/**
 * Determine momentum bias quickly
 */
function determineMomentumBias(candles: PriceData[]): 'positive' | 'negative' | 'neutral' {
  if (candles.length < 10) return 'neutral';
  
  const recent = candles.slice(-10);
  const older = candles.slice(-20, -10);
  
  if (older.length === 0) return 'neutral';
  
  const recentAvg = recent.reduce((sum, c) => sum + c.close, 0) / recent.length;
  const olderAvg = older.reduce((sum, c) => sum + c.close, 0) / older.length;
  
  const lastClose = candles[candles.length - 1].close;
  const tenDaysAgo = candles[candles.length - 10].close;
  const closeMomentum = (lastClose - tenDaysAgo) / tenDaysAgo;
  
  if (recentAvg > olderAvg * 1.02 && closeMomentum > 0.02) {
    return 'positive';
  }
  
  if (recentAvg < olderAvg * 0.98 && closeMomentum < -0.02) {
    return 'negative';
  }
  
  return 'neutral';
}

/**
 * Calculate SB-Opportunity Score (0-100)
 * 
 * Scoring weights:
 * - Near resistance (<3%) = +30
 * - Impuls/Trend structure = +25
 * - High ATR% / expansion = +20
 * - Positive momentum = +15
 * - Not Chop = +10
 */
function calculateSBScore(
  percentToResistance: number,
  percentToSupport: number,
  atrPercent: number,
  structure: 'Impuls' | 'Trend' | 'Range' | 'Chop',
  momentumBias: 'positive' | 'negative' | 'neutral'
): { score: number; breakdown: SBScanResult['scoreBreakdown'] } {
  
  let nearResistance = 0;
  if (percentToResistance <= 1) {
    nearResistance = 30;
  } else if (percentToResistance <= 2) {
    nearResistance = 25;
  } else if (percentToResistance <= 3) {
    nearResistance = 20;
  } else if (percentToResistance <= 5) {
    nearResistance = 10;
  }
  if (percentToSupport <= 3) {
    nearResistance += 15;
  }
  nearResistance = Math.min(30, nearResistance);
  
  let structureScore = 0;
  switch (structure) {
    case 'Impuls': structureScore = 25; break;
    case 'Trend': structureScore = 20; break;
    case 'Range': structureScore = 10; break;
    case 'Chop': structureScore = 0; break;
  }
  
  let volatilityScore = 0;
  if (atrPercent >= 2 && atrPercent <= 5) {
    volatilityScore = 20;
  } else if (atrPercent >= 1.5 && atrPercent <= 7) {
    volatilityScore = 15;
  } else if (atrPercent >= 1) {
    volatilityScore = 10;
  } else {
    volatilityScore = 5;
  }
  
  let momentumScore = 0;
  switch (momentumBias) {
    case 'positive': momentumScore = 15; break;
    case 'neutral': momentumScore = 8; break;
    case 'negative': momentumScore = 0; break;
  }
  
  const notChopScore = structure !== 'Chop' ? 10 : 0;
  
  const score = nearResistance + structureScore + volatilityScore + momentumScore + notChopScore;
  
  return {
    score: Math.min(100, score),
    breakdown: {
      nearResistance,
      structureScore,
      volatilityScore,
      momentumScore,
      notChopScore,
    },
  };
}

/**
 * Determine scenario hint
 * 
 * NOTE: This is a PRIORITIZATION hint, not a trading decision.
 * All stocks can still be analyzed in deep SB-Levels analysis.
 */
function determineScenarioHint(
  percentToResistance: number,
  percentToSupport: number,
  structure: 'Impuls' | 'Trend' | 'Range' | 'Chop'
): { hint: SBScanResult['scenarioHint']; reason: string } {
  
  if (percentToResistance <= 3) {
    return {
      hint: 'A-candidate',
      reason: `${percentToResistance.toFixed(1)}% til motstand – se på breakout-scenario i dyp analyse`,
    };
  }
  
  if (percentToSupport <= 5) {
    return {
      hint: 'B-candidate',
      reason: `${percentToSupport.toFixed(1)}% til støtte – se på pullback-scenario i dyp analyse`,
    };
  }
  
  if (structure === 'Chop') {
    return {
      hint: 'C/no-edge',
      reason: 'Chop-struktur – lavere prioritet, men kan analyseres',
    };
  }
  
  return {
    hint: 'C/no-edge',
    reason: 'Midt i range – lavere prioritet akkurat nå, vent på ytterkant',
  };
}

/**
 * Main SB-Scan function - lightweight analysis for a single stock
 */
export function sbScan(
  ticker: string,
  name: string,
  candles: PriceData[],
  currentPrice?: number
): SBScanResult | null {
  if (!candles || candles.length < 10) {
    return null;
  }
  
  const price = currentPrice ?? candles[candles.length - 1].close;
  
  const resistance = findResistance(candles, price);
  const support = findSupport(candles, price);
  const atr = calculateATR(candles, 14);
  
  const percentToResistance = ((resistance - price) / price) * 100;
  const percentToSupport = ((price - support) / price) * 100;
  const atrPercent = (atr / price) * 100;
  
  const structure = determineStructure(candles);
  const momentumBias = determineMomentumBias(candles);
  
  const { score, breakdown } = calculateSBScore(
    Math.max(0, percentToResistance),
    Math.max(0, percentToSupport),
    atrPercent,
    structure,
    momentumBias
  );
  
  const { hint, reason } = determineScenarioHint(
    Math.max(0, percentToResistance),
    Math.max(0, percentToSupport),
    structure
  );
  
  return {
    ticker,
    name,
    currentPrice: price,
    resistance,
    support,
    percentToResistance: Math.max(0, percentToResistance),
    percentToSupport: Math.max(0, percentToSupport),
    atrPercent,
    structure,
    momentumBias,
    sbScore: score,
    scoreBreakdown: breakdown,
    scenarioHint: hint,
    scenarioReason: reason,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Batch SB-Scan for multiple stocks
 */
export function sbScanBatch(
  stocks: Array<{ ticker: string; name: string; price: number; candles?: PriceData[] }>
): SBScanResult[] {
  const results: SBScanResult[] = [];
  
  for (const stock of stocks) {
    if (stock.candles && stock.candles.length >= 10) {
      const result = sbScan(stock.ticker, stock.name, stock.candles, stock.price);
      if (result) {
        results.push(result);
      }
    }
  }
  
  return results.sort((a, b) => b.sbScore - a.sbScore);
}

/**
 * Get score explanation text
 */
export function getScoreExplanation(result: SBScanResult): string {
  const parts: string[] = [];
  const { scoreBreakdown } = result;
  
  if (scoreBreakdown.nearResistance > 0) {
    parts.push(`Nær nivå: +${scoreBreakdown.nearResistance}`);
  }
  if (scoreBreakdown.structureScore > 0) {
    parts.push(`${result.structure}: +${scoreBreakdown.structureScore}`);
  }
  if (scoreBreakdown.volatilityScore > 0) {
    parts.push(`ATR: +${scoreBreakdown.volatilityScore}`);
  }
  if (scoreBreakdown.momentumScore > 0) {
    parts.push(`Momentum: +${scoreBreakdown.momentumScore}`);
  }
  if (scoreBreakdown.notChopScore > 0) {
    parts.push(`Ikke chop: +${scoreBreakdown.notChopScore}`);
  }
  
  return parts.join(' | ');
}
