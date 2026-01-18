/**
 * Master Score - Kombinerer flere signalkilder
 * 
 * Vekting:
 * - K-Score (Momentum): 30%
 * - Investtech Score: 20%
 * - Analysthus Konsensus: 20%
 * - RSI/Teknisk: 15%
 * - Fundamental: 15%
 */

import type { Stock } from '../types';
import { getInvesttechScores, getConsensusForStock, type ConsensusResult } from '@/lib/store/analyst-store';

export interface MasterScoreBreakdown {
  ticker: string;
  masterScore: number;
  components: {
    kScore: { value: number; weighted: number; weight: number };
    investtech: { value: number; weighted: number; weight: number };
    consensus: { value: number; weighted: number; weight: number };
    technical: { value: number; weighted: number; weight: number };
    fundamental: { value: number; weighted: number; weight: number };
  };
  signal: 'STERK_KJØP' | 'KJØP' | 'HOLD' | 'SELG' | 'STERK_SELG';
  confidence: number; // 0-100
  reasons: string[];
}

const WEIGHTS = {
  kScore: 0.30,
  investtech: 0.20,
  consensus: 0.20,
  technical: 0.15,
  fundamental: 0.15,
};

function consensusToScore(consensus: ConsensusResult['consensus'] | null): number {
  if (!consensus) return 50; // Nøytral hvis ingen data
  switch (consensus) {
    case 'STERK_KJØP': return 100;
    case 'KJØP': return 80;
    case 'HOLD': return 50;
    case 'BLANDET': return 50;
    case 'SELG': return 20;
    case 'STERK_SELG': return 0;
    default: return 50;
  }
}

function calculateTechnicalScore(stock: Stock): number {
  let score = 50;
  
  // RSI component (40% of technical)
  if (stock.rsi >= 30 && stock.rsi <= 70) {
    // Optimal range
    if (stock.rsi >= 40 && stock.rsi <= 60) {
      score += 20;
    } else {
      score += 10;
    }
  } else if (stock.rsi < 30) {
    // Oversold - potential reversal
    score += 15;
  } else {
    // Overbought - caution
    score -= 10;
  }

  // Price momentum (30% of technical)
  if (stock.changePercent > 0) {
    score += Math.min(15, stock.changePercent * 3);
  } else {
    score += Math.max(-15, stock.changePercent * 2);
  }

  // Risk/Reward (30% of technical)
  if (stock.gainPercent && stock.riskPercent && stock.riskPercent > 0) {
    const rr = stock.gainPercent / stock.riskPercent;
    if (rr >= 3) score += 15;
    else if (rr >= 2) score += 10;
    else if (rr >= 1.5) score += 5;
    else if (rr < 1) score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateFundamentalScore(stock: Stock): number {
  let score = 50;
  let factors = 0;

  // P/E Ratio
  if ((stock as any).peRatio !== undefined && (stock as any).peRatio > 0) {
    factors++;
    if ((stock as any).peRatio < 10) score += 15;
    else if ((stock as any).peRatio < 15) score += 10;
    else if ((stock as any).peRatio < 20) score += 5;
    else if ((stock as any).peRatio < 30) score -= 5;
    else score -= 10;
  }

  // Dividend Yield
  if (stock.dividendYield !== undefined && stock.dividendYield > 0) {
    factors++;
    if (stock.dividendYield >= 5) score += 15;
    else if (stock.dividendYield >= 3) score += 10;
    else if (stock.dividendYield >= 1) score += 5;
  }

  // Market Cap (prefer mid-to-large cap for stability)
  if (stock.marketCap !== undefined) {
    factors++;
    if (stock.marketCap >= 50_000_000_000) score += 10; // Large cap
    else if (stock.marketCap >= 10_000_000_000) score += 5; // Mid cap
    else if (stock.marketCap < 1_000_000_000) score -= 5; // Small cap risk
  }

  // If no fundamental data, return neutral
  if (factors === 0) return 50;

  return Math.max(0, Math.min(100, score));
}

export function calculateMasterScore(stock: Stock): MasterScoreBreakdown {
  const reasons: string[] = [];
  
  // Get Investtech score
  const investtechScores = getInvesttechScores();
  const investtechData = investtechScores.find(s => s.ticker === stock.ticker);
  const investtechScore = investtechData?.totalScore ?? 50;

  // Get analyst consensus
  const consensusData = getConsensusForStock(stock.ticker);
  const consensusScore = consensusToScore(consensusData?.consensus ?? null);

  // Calculate technical & fundamental
  const technicalScore = calculateTechnicalScore(stock);
  const fundamentalScore = calculateFundamentalScore(stock);

  // Calculate weighted components
  const components = {
    kScore: {
      value: stock.kScore,
      weighted: stock.kScore * WEIGHTS.kScore,
      weight: WEIGHTS.kScore,
    },
    investtech: {
      value: investtechScore,
      weighted: investtechScore * WEIGHTS.investtech,
      weight: WEIGHTS.investtech,
    },
    consensus: {
      value: consensusScore,
      weighted: consensusScore * WEIGHTS.consensus,
      weight: WEIGHTS.consensus,
    },
    technical: {
      value: technicalScore,
      weighted: technicalScore * WEIGHTS.technical,
      weight: WEIGHTS.technical,
    },
    fundamental: {
      value: fundamentalScore,
      weighted: fundamentalScore * WEIGHTS.fundamental,
      weight: WEIGHTS.fundamental,
    },
  };

  // Calculate total master score
  const masterScore = Math.round(
    components.kScore.weighted +
    components.investtech.weighted +
    components.consensus.weighted +
    components.technical.weighted +
    components.fundamental.weighted
  );

  // Determine signal
  let signal: MasterScoreBreakdown['signal'] = 'HOLD';
  if (masterScore >= 80) signal = 'STERK_KJØP';
  else if (masterScore >= 65) signal = 'KJØP';
  else if (masterScore >= 40) signal = 'HOLD';
  else if (masterScore >= 25) signal = 'SELG';
  else signal = 'STERK_SELG';

  // Calculate confidence based on data availability
  let confidence = 50;
  if (investtechData) confidence += 15;
  if (consensusData && consensusData.recommendations.length >= 2) confidence += 20;
  if ((stock as any).peRatio && (stock as any).peRatio > 0) confidence += 10;
  if (stock.marketCap && stock.marketCap > 0) confidence += 5;
  confidence = Math.min(100, confidence);

  // Generate reasons
  if (stock.kScore >= 75) reasons.push('Sterkt K-Score momentum');
  if (stock.kScore < 40) reasons.push('Svakt K-Score momentum');
  
  if (investtechData) {
    if (investtechScore >= 90) reasons.push(`Investtech: ${investtechScore}/100 (Topp)`);
    else if (investtechScore >= 70) reasons.push(`Investtech: ${investtechScore}/100`);
    if (investtechData.trend === 'stigende') reasons.push('Investtech: Stigende trend');
    if (investtechData.trend === 'fallende') reasons.push('⚠️ Investtech: Fallende trend');
  }

  if (consensusData) {
    const numSources = consensusData.recommendations.length;
    if (consensusData.consensus === 'STERK_KJØP' || consensusData.consensus === 'KJØP') {
      reasons.push(`${numSources} analysthus anbefaler kjøp`);
    } else if (consensusData.consensus === 'SELG' || consensusData.consensus === 'STERK_SELG') {
      reasons.push(`⚠️ ${numSources} analysthus anbefaler salg`);
    }
  }

  if (stock.rsi < 30) reasons.push('RSI indikerer oversold');
  if (stock.rsi > 70) reasons.push('⚠️ RSI indikerer overbought');

  if (stock.dividendYield && stock.dividendYield >= 4) {
    reasons.push(`Høy utbytteyield: ${stock.dividendYield.toFixed(1)}%`);
  }

  return {
    ticker: stock.ticker,
    masterScore,
    components,
    signal,
    confidence,
    reasons,
  };
}

export function calculateAllMasterScores(stocks: Stock[]): MasterScoreBreakdown[] {
  return stocks
    .map(stock => calculateMasterScore(stock))
    .sort((a, b) => b.masterScore - a.masterScore);
}

// Utility to get stocks ranked by Master Score
export function getTopByMasterScore(stocks: Stock[], limit: number = 10): MasterScoreBreakdown[] {
  return calculateAllMasterScores(stocks).slice(0, limit);
}
