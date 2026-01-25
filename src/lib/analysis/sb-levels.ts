/**
 * SB-Levels (Scenario-Based Levels) Analysis
 * 
 * This module implements a reactive trading strategy that identifies
 * three distinct scenarios based on price position relative to key levels.
 * 
 * Key Principles:
 * - Stop-loss belongs to the scenario, not the stock
 * - Breakout scenarios use tight stops near breakout level
 * - Pullback scenarios use structural stops under support
 * - No trades in the middle of a range
 */

export interface PriceCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceLevel {
  price: number;
  type: 'resistance' | 'support';
  strength: number; // 1-10
  touchCount: number;
}

export interface ScenarioZone {
  type: 'breakout' | 'retest' | 'chop' | 'target' | 'noTrade';
  y1: number;
  y2: number;
  color: string;
  label: string;
}

export interface TradingPlan {
  trigger: string;
  entryType: string;
  entryPrice: number;
  stopLoss: number;
  stopReason: string;
  target1: number;
  target2?: number;
  riskReward: number;
  trailStrategy?: string;
}

export interface Scenario {
  id: 'A' | 'B' | 'C';
  name: string;
  description: string;
  isActive: boolean;
  confidence: number; // 0-100
  tradeable: boolean;
  tradeableReason?: string;
  tradingPlan?: TradingPlan;
  zones: ScenarioZone[];
  whyTrade: string;
  whyNotTrade: string;
  invalidationExplanation: string;
}

export interface SBLevelsAnalysis {
  ticker: string;
  currentPrice: number;
  atr: number;
  atrPercent: number;
  
  // Key levels
  primaryResistance: number;
  primarySupport: number;
  secondaryResistance?: number;
  secondarySupport?: number;
  
  // Range info
  rangeHigh: number;
  rangeLow: number;
  rangePosition: number; // 0-100, where in range the price is
  
  // Market structure
  marketStructure: 'uptrend' | 'downtrend' | 'range' | 'breakout';
  
  // Scenarios
  scenarioA: Scenario;
  scenarioB: Scenario;
  scenarioC: Scenario;
  
  // Active scenario
  activeScenario: 'A' | 'B' | 'C' | null;
  
  // Metadata
  analysisDate: string;
  dataPoints: number;
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(candles: PriceCandle[], period: number = 14): number {
  if (candles.length < period + 1) {
    // Not enough data, estimate from recent range
    const recentCandles = candles.slice(-Math.min(10, candles.length));
    return recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / recentCandles.length;
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
 * Find pivot points (swing highs and lows)
 */
function findPivotPoints(candles: PriceCandle[], lookback: number = 5): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;
    
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i) {
        if (candles[j].high >= candles[i].high) isHigh = false;
        if (candles[j].low <= candles[i].low) isLow = false;
      }
    }
    
    if (isHigh) highs.push(candles[i].high);
    if (isLow) lows.push(candles[i].low);
  }
  
  return { highs, lows };
}

/**
 * Cluster similar price levels
 */
function clusterLevels(prices: number[], tolerance: number): number[] {
  if (prices.length === 0) return [];
  
  const sorted = [...prices].sort((a, b) => a - b);
  const clusters: number[][] = [[sorted[0]]];
  
  for (let i = 1; i < sorted.length; i++) {
    const lastCluster = clusters[clusters.length - 1];
    const clusterAvg = lastCluster.reduce((sum, p) => sum + p, 0) / lastCluster.length;
    
    if (Math.abs(sorted[i] - clusterAvg) <= tolerance) {
      lastCluster.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  
  // Return cluster averages, weighted by cluster size
  return clusters
    .map(cluster => ({
      price: cluster.reduce((sum, p) => sum + p, 0) / cluster.length,
      weight: cluster.length
    }))
    .sort((a, b) => b.weight - a.weight)
    .map(c => c.price);
}

/**
 * Calculate key support and resistance levels
 */
function calculateLevels(candles: PriceCandle[], currentPrice: number, atr: number): {
  resistance: number;
  support: number;
  rangeHigh: number;
  rangeLow: number;
} {
  const { highs, lows } = findPivotPoints(candles);
  
  // Cluster levels with ATR-based tolerance
  const resistanceLevels = clusterLevels(highs.filter(h => h > currentPrice), atr * 0.5);
  const supportLevels = clusterLevels(lows.filter(l => l < currentPrice), atr * 0.5);
  
  // Get recent range
  const recentCandles = candles.slice(-30);
  const rangeHigh = Math.max(...recentCandles.map(c => c.high));
  const rangeLow = Math.min(...recentCandles.map(c => c.low));
  
  // Primary resistance: nearest above current price
  const resistance = resistanceLevels.length > 0 
    ? resistanceLevels.reduce((closest, level) => 
        Math.abs(level - currentPrice) < Math.abs(closest - currentPrice) ? level : closest
      )
    : rangeHigh;
  
  // Primary support: nearest below current price
  const support = supportLevels.length > 0
    ? supportLevels.reduce((closest, level) =>
        Math.abs(level - currentPrice) < Math.abs(closest - currentPrice) ? level : closest
      )
    : rangeLow;
  
  return { resistance, support, rangeHigh, rangeLow };
}

/**
 * Determine market structure
 */
function determineMarketStructure(candles: PriceCandle[]): 'uptrend' | 'downtrend' | 'range' | 'breakout' {
  if (candles.length < 20) return 'range';
  
  const recent = candles.slice(-20);
  const older = candles.slice(-40, -20);
  
  const recentAvg = recent.reduce((sum, c) => sum + c.close, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, c) => sum + c.close, 0) / older.length 
    : recentAvg;
  
  const recentHighs = recent.map(c => c.high);
  const recentLows = recent.map(c => c.low);
  
  // Check for breakout
  const lastClose = candles[candles.length - 1].close;
  const rangeHigh = Math.max(...candles.slice(-30).map(c => c.high));
  const rangeLow = Math.min(...candles.slice(-30).map(c => c.low));
  
  if (lastClose > rangeHigh * 0.98) return 'breakout';
  
  // Check for trend
  const higherHighs = recentHighs.slice(10).every((h, i) => h >= recentHighs[i] * 0.98);
  const higherLows = recentLows.slice(10).every((l, i) => l >= recentLows[i] * 0.98);
  const lowerHighs = recentHighs.slice(10).every((h, i) => h <= recentHighs[i] * 1.02);
  const lowerLows = recentLows.slice(10).every((l, i) => l <= recentLows[i] * 1.02);
  
  if (higherHighs && higherLows && recentAvg > olderAvg * 1.02) return 'uptrend';
  if (lowerHighs && lowerLows && recentAvg < olderAvg * 0.98) return 'downtrend';
  
  return 'range';
}

/**
 * Calculate position in range (0-100)
 */
function calculateRangePosition(currentPrice: number, rangeHigh: number, rangeLow: number): number {
  const range = rangeHigh - rangeLow;
  if (range === 0) return 50;
  return Math.min(100, Math.max(0, ((currentPrice - rangeLow) / range) * 100));
}

/**
 * Generate Scenario A - Impulse/Breakout
 * 
 * KRITISK REGEL: Stop-loss i breakout-scenario skal ALLTID være tett under
 * breakout-nivået (0.5-1.5 × ATR), ALDRI under range-bunn.
 */
function generateScenarioA(
  currentPrice: number,
  resistance: number,
  support: number,
  atr: number,
  rangePosition: number,
  marketStructure: string
): Scenario {
  const isActive = rangePosition > 80 || marketStructure === 'breakout';
  const distanceToResistance = ((resistance - currentPrice) / currentPrice) * 100;
  
  // Confidence based on position and structure
  let confidence = 0;
  if (isActive) {
    confidence = 50;
    if (marketStructure === 'breakout') confidence += 30;
    if (distanceToResistance < 2) confidence += 20;
    if (marketStructure === 'uptrend') confidence += 10;
  }
  confidence = Math.min(100, confidence);
  
  // Entry and levels
  const breakAndHoldLevel = resistance;
  const entryPrice = currentPrice > resistance ? currentPrice : breakAndHoldLevel;
  
  // KRITISK: Stop i breakout-scenario = TETT under breakout-nivå
  // ALDRI bruk range-bunn (support) som stop i Scenario A
  const stopLevel = resistance - (atr * 1.0); // Tett stop: 1 ATR under breakout-nivå
  
  // Targets based on ATR
  const target1 = resistance + (atr * 2);
  const target2 = resistance + (atr * 4);
  
  // Calculate R/R with the CORRECT tight stop
  const risk = entryPrice - stopLevel;
  const reward = target1 - entryPrice;
  const riskReward = risk > 0 ? reward / risk : 0;
  
  // TRADEABILITY: R/R must be >= 1.5 for Scenario A
  const meetsRRRequirement = riskReward >= 1.5;
  const isTradeable = isActive && confidence >= 50 && meetsRRRequirement;
  
  // Generate tradeable reason
  let tradeableReason = '';
  if (!isActive) {
    tradeableReason = 'Ikke aktiv – pris ikke nær motstand';
  } else if (riskReward < 1.5) {
    tradeableReason = `Ikke tradeable – R/R ${riskReward.toFixed(2)} < 1.5 minimum`;
  } else if (confidence < 50) {
    tradeableReason = 'Lav confidence – vent på bedre setup';
  } else {
    tradeableReason = `Tradeable – R/R ${riskReward.toFixed(2)} ✓`;
  }
  
  return {
    id: 'A',
    name: 'Impuls / Breakout',
    description: 'Aksjen bryter ut av range/konsolidering og fortsetter i trendretning',
    isActive,
    confidence,
    tradeable: isTradeable,
    tradeableReason,
    tradingPlan: {
      trigger: `Pris holder over ${breakAndHoldLevel.toFixed(2)} (motstand) etter brudd`,
      entryType: 'Break & Hold',
      entryPrice,
      stopLoss: stopLevel,
      stopReason: `TETT breakout-stop: 1×ATR (${atr.toFixed(2)}) under breakout-nivå. IKKE range-bunn!`,
      target1,
      target2,
      riskReward,
      trailStrategy: 'Trail stop til break-even ved T1, deretter 1.5×ATR trailing',
    },
    zones: [
      {
        type: 'breakout',
        y1: resistance,
        y2: resistance + (atr * 0.5),
        color: 'rgba(34, 197, 94, 0.2)',
        label: 'Breakout Zone',
      },
      {
        type: 'target',
        y1: target1,
        y2: target2,
        color: 'rgba(34, 197, 94, 0.1)',
        label: 'Target Zone',
      },
    ],
    whyTrade: `Ved breakout over ${resistance.toFixed(2)}, momentum fortsetter ofte. TETT stop like under breakout-nivå gir god R/R ved rask bevegelse. Krav: R/R ≥ 1.5`,
    whyNotTrade: riskReward < 1.5 
      ? `R/R er ${riskReward.toFixed(2)} som er under minimum 1.5. Med tett stop er ikke denne tradeable.`
      : 'Ikke i breakout-posisjon ennå, eller lav confidence.',
    invalidationExplanation: `Breakout-ideen er feil hvis pris faller tilbake under ${stopLevel.toFixed(2)} (tett stop). Dette viser at breakout ikke holder.`,
  };
}

/**
 * Generate Scenario B - Pullback/Retest
 * 
 * I pullback-scenario brukes STRUKTURELL stop under støtte.
 * Dette er den ENESTE gangen dyp stop er tillatt.
 */
function generateScenarioB(
  currentPrice: number,
  resistance: number,
  support: number,
  atr: number,
  rangePosition: number,
  marketStructure: string
): Scenario {
  const isActive = rangePosition < 40 && rangePosition > 10;
  const distanceToSupport = ((currentPrice - support) / currentPrice) * 100;
  
  // Confidence based on position and structure
  let confidence = 0;
  if (isActive) {
    confidence = 40;
    if (distanceToSupport < 3) confidence += 25;
    if (marketStructure === 'uptrend') confidence += 20;
    if (marketStructure !== 'downtrend') confidence += 15;
  }
  confidence = Math.min(100, confidence);
  
  // Entry after confirmed reaction (higher low)
  const entryPrice = support + (atr * 0.3); // Entry after bounce confirmation
  
  // STRUKTURELL STOP: Under støtte (dette er korrekt for pullback)
  const stopLevel = support - atr;
  
  // Targets
  const target1 = resistance - (atr * 0.5);
  const target2 = resistance + (atr * 1);
  
  // Calculate R/R
  const risk = entryPrice - stopLevel;
  const reward = target1 - entryPrice;
  const riskReward = risk > 0 ? reward / risk : 0;
  
  // TRADEABILITY: R/R must be >= 1.3 for Scenario B
  const meetsRRRequirement = riskReward >= 1.3;
  const isTradeable = isActive && confidence >= 50 && meetsRRRequirement && marketStructure !== 'downtrend';
  
  // Generate tradeable reason
  let tradeableReason = '';
  if (!isActive) {
    tradeableReason = 'Ikke aktiv – pris ikke nær støtte';
  } else if (marketStructure === 'downtrend') {
    tradeableReason = 'Ikke tradeable – mot trend (downtrend)';
  } else if (riskReward < 1.3) {
    tradeableReason = `Ikke tradeable – R/R ${riskReward.toFixed(2)} < 1.3 minimum`;
  } else if (confidence < 50) {
    tradeableReason = 'Lav confidence – vent på bekreftet reaksjon';
  } else {
    tradeableReason = `Tradeable – R/R ${riskReward.toFixed(2)} ✓`;
  }
  
  return {
    id: 'B',
    name: 'Pullback / Retest',
    description: 'Aksjen tester støtte etter en oppgang, mulig fortsettelse',
    isActive,
    confidence,
    tradeable: isTradeable,
    tradeableReason,
    tradingPlan: {
      trigger: `Pris viser reaksjon/higher low ved ${support.toFixed(2)} støtte`,
      entryType: 'Higher Low / Reclaim',
      entryPrice,
      stopLoss: stopLevel,
      stopReason: `Strukturell støtte-stop: 1×ATR under ${support.toFixed(2)}. Dyp stop er RIKTIG i pullback.`,
      target1,
      target2,
      riskReward,
      trailStrategy: 'Hold til T1, vurder å ta halv posisjon, trail resten',
    },
    zones: [
      {
        type: 'retest',
        y1: support - (atr * 0.5),
        y2: support + (atr * 0.5),
        color: 'rgba(59, 130, 246, 0.2)',
        label: 'Pullback Zone',
      },
      {
        type: 'target',
        y1: target1,
        y2: target2,
        color: 'rgba(59, 130, 246, 0.1)',
        label: 'Target Zone',
      },
    ],
    whyTrade: `Ved støtte ${support.toFixed(2)} med bekreftet reaksjon (higher low), kan vi kjøpe med strukturell stop. Krav: R/R ≥ 1.3, ikke mot trend.`,
    whyNotTrade: marketStructure === 'downtrend'
      ? 'Mot hovedtrenden. Pullback-kjøp i downtrend er høyrisiko.'
      : riskReward < 1.3 
        ? `R/R er ${riskReward.toFixed(2)} som er under minimum 1.3.`
        : 'Ikke nær støtte, eller ingen bekreftet reaksjon ennå.',
    invalidationExplanation: `Pullback-ideen er feil hvis pris bryter under ${stopLevel.toFixed(2)}. Dette viser at støtten ikke holder, og trenden kan ha snudd.`,
  };
}

/**
 * Generate Scenario C - Chop/No Trade
 * 
 * ALLTID tradeable = false. Ingen entry, ingen stop, ingen targets.
 */
function generateScenarioC(
  currentPrice: number,
  resistance: number,
  support: number,
  atr: number,
  rangePosition: number,
  marketStructure: string
): Scenario {
  const isActive = rangePosition >= 20 && rangePosition <= 80 && marketStructure === 'range';
  
  // Confidence that we're in chop
  let confidence = 0;
  if (rangePosition >= 30 && rangePosition <= 70) confidence += 40;
  if (marketStructure === 'range') confidence += 40;
  if (rangePosition >= 40 && rangePosition <= 60) confidence += 20;
  confidence = Math.min(100, confidence);
  
  return {
    id: 'C',
    name: 'Chop / Diagonal / NO TRADE',
    description: 'Aksjen er i usikkert territorium midt i range - ingen edge',
    isActive,
    confidence,
    tradeable: false, // ALWAYS false for Scenario C
    tradeableReason: 'NO TRADE – Scenario C har ingen edge og skal aldri handles',
    // NO tradingPlan for Scenario C
    zones: [
      {
        type: 'noTrade',
        y1: support + (atr * 0.5),
        y2: resistance - (atr * 0.5),
        color: 'rgba(239, 68, 68, 0.15)',
        label: 'NO TRADE ZONE',
      },
      {
        type: 'chop',
        y1: support,
        y2: resistance,
        color: 'rgba(239, 68, 68, 0.05)',
        label: 'Chop Range',
      },
    ],
    whyTrade: 'INGEN HANDEL I SCENARIO C. Vent på at prisen beveger seg til ytterkant (A eller B scenario).',
    whyNotTrade: `Midt i range (${rangePosition.toFixed(0)}% posisjon). INGEN ENTRY, INGEN STOP, INGEN TARGETS. Dårlig R/R uansett retning - avstand til støtte og motstand er lik. Vent på bedre posisjonering.`,
    invalidationExplanation: 'Scenario C "invalideres" når prisen beveger seg til ytterkant av range, og A eller B scenario aktiveres.',
  };
}

/**
 * Main SB-Levels analysis function
 */
export function analyzeSBLevels(
  ticker: string,
  candles: PriceCandle[],
  currentPrice?: number
): SBLevelsAnalysis | null {
  if (!candles || candles.length < 30) {
    return null;
  }
  
  const price = currentPrice ?? candles[candles.length - 1].close;
  const atr = calculateATR(candles);
  const atrPercent = (atr / price) * 100;
  
  // Calculate levels
  const { resistance, support, rangeHigh, rangeLow } = calculateLevels(candles, price, atr);
  
  // Market structure
  const marketStructure = determineMarketStructure(candles);
  
  // Range position
  const rangePosition = calculateRangePosition(price, rangeHigh, rangeLow);
  
  // Generate scenarios
  const scenarioA = generateScenarioA(price, resistance, support, atr, rangePosition, marketStructure);
  const scenarioB = generateScenarioB(price, resistance, support, atr, rangePosition, marketStructure);
  const scenarioC = generateScenarioC(price, resistance, support, atr, rangePosition, marketStructure);
  
  // Determine active scenario
  let activeScenario: 'A' | 'B' | 'C' | null = null;
  
  if (scenarioA.isActive && scenarioA.confidence >= 50) {
    activeScenario = 'A';
  } else if (scenarioB.isActive && scenarioB.confidence >= 50) {
    activeScenario = 'B';
  } else if (scenarioC.isActive && scenarioC.confidence >= 50) {
    activeScenario = 'C';
  }
  
  return {
    ticker,
    currentPrice: price,
    atr,
    atrPercent,
    primaryResistance: resistance,
    primarySupport: support,
    rangeHigh,
    rangeLow,
    rangePosition,
    marketStructure,
    scenarioA,
    scenarioB,
    scenarioC,
    activeScenario,
    analysisDate: new Date().toISOString(),
    dataPoints: candles.length,
  };
}

/**
 * Get a summary string for the current analysis
 */
export function getSBLevelsSummary(analysis: SBLevelsAnalysis): string {
  if (!analysis.activeScenario) {
    return 'Analyserer markedsstruktur...';
  }
  
  if (analysis.activeScenario === 'A') {
    return `🚀 IMPULS-SCENARIO: Pris (${analysis.currentPrice.toFixed(2)}) nærmer seg motstand på ${analysis.primaryResistance.toFixed(2)}. Ved bekreftet breakout, vurder inngang med stop under ${analysis.primarySupport.toFixed(2)}.`;
  }
  
  if (analysis.activeScenario === 'B') {
    return `🔄 PULLBACK-SCENARIO: Pris (${analysis.currentPrice.toFixed(2)}) tester støtte på ${analysis.primarySupport.toFixed(2)}. Ved bekreftet reaksjon (higher low), vurder inngang med target mot ${analysis.primaryResistance.toFixed(2)}.`;
  }
  
  if (analysis.activeScenario === 'C') {
    return `⛔ NO TRADE: Pris (${analysis.currentPrice.toFixed(2)}) er midt i range mellom støtte (${analysis.primarySupport.toFixed(2)}) og motstand (${analysis.primaryResistance.toFixed(2)}). Vent på ytterkant.`;
  }
  
  return 'Analyserer markedsstruktur...';
}
