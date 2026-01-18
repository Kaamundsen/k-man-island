/**
 * Breakout Tips Scanner
 * Forutsi morgendagens potensielle vinnere basert på:
 * - Konsolidering nær motstand
 * - Volum-akkumulering
 * - Mønstergjenkjenning (bull flag, cup & handle, ascending triangle)
 */

import { fetchHistoricalData, StockHistory } from './historical-data';

export interface BreakoutCandidate {
  ticker: string;
  name: string;
  price: number;
  breakoutScore: number; // 0-100
  patterns: PatternMatch[];
  resistanceLevel: number;
  distanceToBreakout: number; // % til motstand
  volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  consolidationDays: number;
  avgVolume: number;
  recentVolume: number;
  volumeRatio: number;
  setup: 'IMMINENT' | 'BUILDING' | 'WATCHING';
  notes: string[];
}

export interface PatternMatch {
  pattern: string;
  confidence: number; // 0-100
  description: string;
}

interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================
// MAIN SCANNER
// ============================================

export async function scanForBreakouts(tickers: string[]): Promise<BreakoutCandidate[]> {
  console.log(`🔍 Scanning ${tickers.length} stocks for breakout setups...`);
  
  const candidates: BreakoutCandidate[] = [];
  
  // Analyser alle aksjer parallelt
  const analyses = await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const history = await fetchHistoricalData(ticker, 0.5); // 6 måneder
        if (!history || history.candles.length < 50) {
          return null;
        }
        return analyzeBreakoutPotential(history);
      } catch (error) {
        console.error(`Error analyzing ${ticker}:`, error);
        return null;
      }
    })
  );
  
  // Filtrer og sorter
  for (const analysis of analyses) {
    if (analysis && analysis.breakoutScore >= 50) {
      candidates.push(analysis);
    }
  }
  
  // Sorter etter breakout score
  candidates.sort((a, b) => b.breakoutScore - a.breakoutScore);
  
  console.log(`✅ Found ${candidates.length} breakout candidates`);
  return candidates;
}

// ============================================
// BREAKOUT ANALYSIS
// ============================================

function analyzeBreakoutPotential(history: StockHistory): BreakoutCandidate | null {
  const candles = history.candles;
  if (candles.length < 50) return null;
  
  const currentPrice = candles[candles.length - 1].close;
  const notes: string[] = [];
  let breakoutScore = 0;
  
  // 1. Finn motstandsnivå (20-dagers høy)
  const recent20 = candles.slice(-20);
  const resistance20 = Math.max(...recent20.map(c => c.high));
  
  // 2. Finn 50-dagers høy for sterkere motstand
  const recent50 = candles.slice(-50);
  const resistance50 = Math.max(...recent50.map(c => c.high));
  
  // Bruk nærmeste motstand
  const resistanceLevel = resistance20;
  const distanceToBreakout = ((resistanceLevel - currentPrice) / currentPrice) * 100;
  
  // 3. Analyser konsolidering
  const consolidation = analyzeConsolidation(candles.slice(-20));
  
  // 4. Analyser volum-trend
  const volumeAnalysis = analyzeVolumeTrend(candles);
  
  // 5. Mønstergjenkjenning
  const patterns = detectPatterns(candles);
  
  // ============================================
  // SCORE BEREGNING
  // ============================================
  
  // Nærhet til motstand (0-25 poeng)
  // Beste setup: 0-3% fra motstand
  if (distanceToBreakout >= 0 && distanceToBreakout <= 2) {
    breakoutScore += 25;
    notes.push(`🎯 Kun ${distanceToBreakout.toFixed(1)}% fra motstand`);
  } else if (distanceToBreakout > 2 && distanceToBreakout <= 5) {
    breakoutScore += 20;
    notes.push(`📍 ${distanceToBreakout.toFixed(1)}% fra motstand`);
  } else if (distanceToBreakout > 5 && distanceToBreakout <= 10) {
    breakoutScore += 10;
  }
  
  // Konsolidering (0-25 poeng)
  if (consolidation.isConsolidating) {
    breakoutScore += Math.min(25, consolidation.days * 2);
    notes.push(`📊 ${consolidation.days} dager konsolidering (${consolidation.range.toFixed(1)}% range)`);
  }
  
  // Volum-akkumulering (0-25 poeng)
  if (volumeAnalysis.trend === 'INCREASING') {
    breakoutScore += 25;
    notes.push(`📈 Økende volum (${volumeAnalysis.ratio.toFixed(1)}x normal)`);
  } else if (volumeAnalysis.trend === 'STABLE' && volumeAnalysis.ratio >= 0.8) {
    breakoutScore += 15;
  }
  
  // Mønstre (0-25 poeng)
  for (const pattern of patterns) {
    breakoutScore += Math.min(10, pattern.confidence / 10);
    notes.push(`${pattern.pattern}: ${pattern.description}`);
  }
  
  // Ekstra bonus for kombinasjoner
  if (consolidation.isConsolidating && volumeAnalysis.trend === 'INCREASING' && distanceToBreakout < 5) {
    breakoutScore += 10;
    notes.push(`⭐ Perfekt setup: Konsolidering + volum nær motstand`);
  }
  
  // Cap score
  breakoutScore = Math.min(100, breakoutScore);
  
  // Bestem setup-type
  let setup: 'IMMINENT' | 'BUILDING' | 'WATCHING';
  if (breakoutScore >= 75 && distanceToBreakout < 3) {
    setup = 'IMMINENT';
  } else if (breakoutScore >= 50) {
    setup = 'BUILDING';
  } else {
    setup = 'WATCHING';
  }
  
  return {
    ticker: history.ticker,
    name: history.name,
    price: currentPrice,
    breakoutScore,
    patterns,
    resistanceLevel,
    distanceToBreakout,
    volumeTrend: volumeAnalysis.trend,
    consolidationDays: consolidation.days,
    avgVolume: volumeAnalysis.avgVolume,
    recentVolume: volumeAnalysis.recentVolume,
    volumeRatio: volumeAnalysis.ratio,
    setup,
    notes,
  };
}

// ============================================
// KONSOLIDERINGSANALYSE
// ============================================

function analyzeConsolidation(candles: Candle[]): {
  isConsolidating: boolean;
  days: number;
  range: number;
} {
  if (candles.length < 5) {
    return { isConsolidating: false, days: 0, range: 0 };
  }
  
  // Beregn range for siste dager
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const avgPrice = candles.reduce((sum, c) => sum + c.close, 0) / candles.length;
  
  const range = ((maxHigh - minLow) / avgPrice) * 100;
  
  // Konsolidering = tight range (under 8%) over flere dager
  const isConsolidating = range < 8;
  
  // Tell dager i konsolidering
  let consolidationDays = 0;
  for (let i = candles.length - 1; i >= 0; i--) {
    const dayRange = ((candles[i].high - candles[i].low) / candles[i].close) * 100;
    if (dayRange < 4) {
      consolidationDays++;
    } else {
      break;
    }
  }
  
  return {
    isConsolidating,
    days: Math.max(consolidationDays, isConsolidating ? candles.length : 0),
    range,
  };
}

// ============================================
// VOLUMANALYSE
// ============================================

function analyzeVolumeTrend(candles: Candle[]): {
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  avgVolume: number;
  recentVolume: number;
  ratio: number;
} {
  if (candles.length < 30) {
    return { trend: 'STABLE', avgVolume: 0, recentVolume: 0, ratio: 1 };
  }
  
  // Gjennomsnittlig volum siste 30 dager
  const last30 = candles.slice(-30);
  const avgVolume = last30.reduce((sum, c) => sum + c.volume, 0) / 30;
  
  // Gjennomsnittlig volum siste 5 dager
  const last5 = candles.slice(-5);
  const recentVolume = last5.reduce((sum, c) => sum + c.volume, 0) / 5;
  
  const ratio = avgVolume > 0 ? recentVolume / avgVolume : 1;
  
  // Trend
  let trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  if (ratio >= 1.3) {
    trend = 'INCREASING';
  } else if (ratio <= 0.7) {
    trend = 'DECREASING';
  } else {
    trend = 'STABLE';
  }
  
  return { trend, avgVolume, recentVolume, ratio };
}

// ============================================
// MØNSTERGJENKJENNING
// ============================================

function detectPatterns(candles: Candle[]): PatternMatch[] {
  const patterns: PatternMatch[] = [];
  
  if (candles.length < 30) return patterns;
  
  // 1. Bull Flag
  const bullFlag = detectBullFlag(candles);
  if (bullFlag) patterns.push(bullFlag);
  
  // 2. Ascending Triangle
  const ascTriangle = detectAscendingTriangle(candles);
  if (ascTriangle) patterns.push(ascTriangle);
  
  // 3. Cup & Handle (simplified)
  const cupHandle = detectCupAndHandle(candles);
  if (cupHandle) patterns.push(cupHandle);
  
  // 4. Higher Lows
  const higherLows = detectHigherLows(candles);
  if (higherLows) patterns.push(higherLows);
  
  return patterns;
}

function detectBullFlag(candles: Candle[]): PatternMatch | null {
  const recent = candles.slice(-20);
  if (recent.length < 15) return null;
  
  // Finn "pole" - sterk oppgang
  const first5 = recent.slice(0, 5);
  const poleMove = ((first5[4].close - first5[0].close) / first5[0].close) * 100;
  
  if (poleMove < 5) return null; // Trenger minst 5% oppgang for pole
  
  // Sjekk "flag" - konsolidering/svak nedgang etter pole
  const flag = recent.slice(5);
  const flagHigh = Math.max(...flag.map(c => c.high));
  const flagLow = Math.min(...flag.map(c => c.low));
  const flagRange = ((flagHigh - flagLow) / flagLow) * 100;
  
  const flagMove = ((flag[flag.length - 1].close - flag[0].close) / flag[0].close) * 100;
  
  // Flag skal være tight (< 8% range) og svakt ned eller sidelengs (-5% til +2%)
  if (flagRange < 8 && flagMove >= -5 && flagMove <= 2) {
    const confidence = Math.min(80, 50 + poleMove * 2 - flagRange * 2);
    return {
      pattern: '🚩 Bull Flag',
      confidence,
      description: `Pole +${poleMove.toFixed(1)}%, flag ${flagMove.toFixed(1)}%`,
    };
  }
  
  return null;
}

function detectAscendingTriangle(candles: Candle[]): PatternMatch | null {
  const recent = candles.slice(-30);
  if (recent.length < 20) return null;
  
  // Finn flat motstand (lignende highs)
  const highs = recent.map(c => c.high);
  const maxHigh = Math.max(...highs);
  const highsNearResistance = highs.filter(h => h >= maxHigh * 0.98).length;
  
  // Sjekk stigende lows
  const lows = recent.map(c => c.low);
  let risingLows = 0;
  for (let i = 5; i < lows.length; i += 5) {
    if (lows[i] > lows[i - 5]) risingLows++;
  }
  
  // Trenger minst 3 touches på motstand og stigende lows
  if (highsNearResistance >= 3 && risingLows >= 2) {
    const confidence = Math.min(75, 40 + highsNearResistance * 5 + risingLows * 10);
    return {
      pattern: '📐 Ascending Triangle',
      confidence,
      description: `${highsNearResistance} touches på motstand, stigende bunner`,
    };
  }
  
  return null;
}

function detectCupAndHandle(candles: Candle[]): PatternMatch | null {
  if (candles.length < 60) return null;
  
  const recent = candles.slice(-60);
  
  // Forenklet: Se etter U-formet bevegelse
  const first = recent.slice(0, 20);
  const middle = recent.slice(20, 40);
  const last = recent.slice(40);
  
  const firstAvg = first.reduce((sum, c) => sum + c.close, 0) / first.length;
  const middleAvg = middle.reduce((sum, c) => sum + c.close, 0) / middle.length;
  const lastAvg = last.reduce((sum, c) => sum + c.close, 0) / last.length;
  
  // Cup: Ned, så opp igjen
  const downMove = ((middleAvg - firstAvg) / firstAvg) * 100;
  const upMove = ((lastAvg - middleAvg) / middleAvg) * 100;
  
  // Handle: Siste dager konsoliderer
  const handle = recent.slice(-10);
  const handleRange = ((Math.max(...handle.map(c => c.high)) - Math.min(...handle.map(c => c.low))) / lastAvg) * 100;
  
  if (downMove < -5 && upMove > 5 && handleRange < 6 && lastAvg >= firstAvg * 0.95) {
    return {
      pattern: '☕ Cup & Handle',
      confidence: 60,
      description: `Bunn ${downMove.toFixed(1)}%, comeback ${upMove.toFixed(1)}%`,
    };
  }
  
  return null;
}

function detectHigherLows(candles: Candle[]): PatternMatch | null {
  const recent = candles.slice(-20);
  if (recent.length < 15) return null;
  
  // Finn lokale lavpunkter
  const lows: number[] = [];
  for (let i = 2; i < recent.length - 2; i++) {
    if (recent[i].low < recent[i - 1].low && 
        recent[i].low < recent[i - 2].low &&
        recent[i].low < recent[i + 1].low && 
        recent[i].low < recent[i + 2].low) {
      lows.push(recent[i].low);
    }
  }
  
  if (lows.length < 2) return null;
  
  // Sjekk om hver low er høyere enn forrige
  let higherLowCount = 0;
  for (let i = 1; i < lows.length; i++) {
    if (lows[i] > lows[i - 1]) higherLowCount++;
  }
  
  if (higherLowCount >= 2) {
    return {
      pattern: '📈 Higher Lows',
      confidence: 50 + higherLowCount * 15,
      description: `${higherLowCount + 1} stigende bunnpunkter`,
    };
  }
  
  return null;
}
