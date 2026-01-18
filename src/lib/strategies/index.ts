/**
 * K-man Island Strategy Registry
 * 
 * Alle trading-strategier er definert her. 
 * For å legge til en ny strategi:
 * 1. Legg til i StrategyId type
 * 2. Legg til definisjon i STRATEGIES objekt
 * 3. Implementer evalueringsfunksjon
 */

import { FinnhubCandle } from '../api/finnhub';

// ============================================
// STRATEGY TYPES
// ============================================

export type StrategyId = 
  // Momentum-strategier (delt opp)
  | 'MOMENTUM_TREND'    // Trygg trend-følging, 50-100% mål
  | 'MOMENTUM_ASYM'     // Asymmetrisk R/R, 100-200%+ mål
  
  // Klassiske strategier
  | 'BUFFETT'           // Kvalitetsaksjer, 20-50% mål
  | 'TVEITEREID'        // Høy likviditet, 15-40% mål
  | 'INSIDER'           // Innsidehandel-signal
  | 'REBOUND'           // Oversold bounce
  
  // Kortsiktige strategier
  | 'DAYTRADER'         // Daglig trading
  | 'SWING_SHORT'       // 1-5 dager swing
  
  // Analytiker-porteføljer
  | 'DNB_MONTHLY'       // DNB månedlige anbefalinger
  | 'PARETO_TOP'        // Pareto topp-picks
  | 'ARCTIC_PICKS'      // Arctic Securities
  | 'ANALYST_CONSENSUS' // Konsensus blant analytikere
  
  // Spesial-strategier
  | 'EARNINGS_PLAY'     // Rundt kvartalsrapporter
  | 'SECTOR_ROTATION'   // Sektor-momentum
  | 'DIVIDEND_HUNTER'   // Utbytte-fokus
  
  // "Ærlige" strategier - for når du bare... kjøper
  | 'YOLO'              // Magefølelse, tro håp og kjærlighet
  | 'TIPS'              // Noen tipset meg
  | 'HODL'              // Langsiktig hold uten plan
  | 'FOMO'              // Fear Of Missing Out - alle andre kjøper!
  
  // Ekspert-strategier - følger kjente investorer
  | 'UKENS_AKSJE';      // Espen Tingvoll - Investornytt

export type StrategyCategory = 
  | 'MOMENTUM'      // Momentum-baserte
  | 'VALUE'         // Verdi-baserte
  | 'ANALYST'       // Analytiker-anbefalinger
  | 'TECHNICAL'     // Rent tekniske
  | 'EVENT'         // Hendelsesbaserte
  | 'INCOME';       // Inntektsfokus

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type TimeHorizon = 'INTRADAY' | 'DAYS' | 'WEEKS' | 'MONTHS';

export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  shortName: string;           // For UI badges
  description: string;
  category: StrategyCategory;
  
  // Risiko og mål
  riskLevel: RiskLevel;
  targetReturn: {
    min: number;               // Minimum forventet avkastning %
    max: number;               // Maksimum forventet avkastning %
  };
  
  // Tid
  timeHorizon: TimeHorizon;
  typicalHoldingDays: {
    min: number;
    max: number;
  };
  
  // Visning
  color: string;               // Hex farge for UI
  emoji: string;               // For rask identifikasjon
  
  // Metadata
  enabled: boolean;            // Kan skrus av/på
  requiresManualInput: boolean; // Krever manuell input (f.eks. analytiker-picks)
  dataSource?: string;         // Hvor data kommer fra
}

export interface StrategyEvaluation {
  strategyId: StrategyId;
  passed: boolean;
  score: number;               // 0-100
  confidence: number;          // 0-100, hvor sikker er vi
  reasoning: string[];         // Hvorfor kvalifiserer/ikke
  suggestedEntry?: number;
  suggestedStop?: number;
  suggestedTarget?: number;
  riskRewardRatio?: number;
}

export interface StockAnalysisInput {
  ticker: string;
  price: number;
  candles: FinnhubCandle;
  rsi: number;
  atr: number;
  sma20: number;
  sma50: number;
  sma200: number;
  relativeVolume: number;
  dailyVolume: number;
  insiderScore: number;
  insiderBuys: number;
  distanceFrom52High: number;  // % fra 52-ukers høy
  distanceFrom20High: number;  // % fra 20-dagers høy
}

// ============================================
// STRATEGY DEFINITIONS
// ============================================

export const STRATEGIES: Record<StrategyId, StrategyDefinition> = {
  // ---- MOMENTUM STRATEGIER ----
  MOMENTUM_TREND: {
    id: 'MOMENTUM_TREND',
    name: 'Momentum Trend',
    shortName: 'M-Trend',
    description: 'Følger etablerte opptrender med høy win-rate (60-70%). Fokus på aksjer som allerede er i bevegelse med bekreftet trend.',
    category: 'MOMENTUM',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 8, max: 15 },  // Per trade, realistisk for 2-4 uker
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 10, max: 28 },
    color: '#10B981',
    emoji: '📈',
    enabled: true,
    requiresManualInput: false,
  },
  
  MOMENTUM_ASYM: {
    id: 'MOMENTUM_ASYM',
    name: 'Momentum Asymmetrisk',
    shortName: 'M-Asym',
    description: 'Asymmetriske muligheter med R/R 3:1+. Aksepterer lavere win-rate (45-50%) for større gevinster.',
    category: 'MOMENTUM',
    riskLevel: 'HIGH',
    targetReturn: { min: 15, max: 25 },  // Per trade, realistisk for 1-3 uker
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 5, max: 21 },
    color: '#F59E0B',
    emoji: '🚀',
    enabled: true,
    requiresManualInput: false,
  },

  // ---- KLASSISKE STRATEGIER ----
  BUFFETT: {
    id: 'BUFFETT',
    name: 'Buffett',
    shortName: 'Buffett',
    description: 'Kvalitetsaksjer med stabil vekst. Warren Buffett snittavkastning: ca. 20% årlig.',
    category: 'VALUE',
    riskLevel: 'LOW',
    targetReturn: { min: 8, max: 20 },  // Realistisk verdiinvestering årlig
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 60, max: 365 },
    color: '#3B82F6',
    emoji: '🏛️',
    enabled: true,
    requiresManualInput: false,
  },
  
  TVEITEREID: {
    id: 'TVEITEREID',
    name: 'Tveitereid',
    shortName: 'Tveitereid',
    description: 'Høyt omsatte aksjer. Lett å komme inn/ut. Lavere spread og slippage.',
    category: 'TECHNICAL',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 5, max: 12 },  // Per trade, realistisk for likvide aksjer
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 10, max: 30 },
    color: '#8B5CF6',
    emoji: '💧',
    enabled: true,
    requiresManualInput: false,
  },
  
  INSIDER: {
    id: 'INSIDER',
    name: 'Innsidehandel',
    shortName: 'Insider',
    description: 'Følger innsidekjøp. Studier viser 5-10% meravkastning over 12 mnd.',
    category: 'EVENT',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 5, max: 15 },  // Basert på akademiske studier
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 30, max: 90 },
    color: '#EC4899',
    emoji: '👔',
    enabled: true,
    requiresManualInput: false,
  },
  
  REBOUND: {
    id: 'REBOUND',
    name: 'Oversold Rebound',
    shortName: 'Rebound',
    description: 'Kjøp av oversolgte aksjer. Høy risiko - mange "dead cats" som fortsetter ned.',
    category: 'TECHNICAL',
    riskLevel: 'HIGH',
    targetReturn: { min: -15, max: 20 },  // Ærlig: Mange rebounds feiler
    timeHorizon: 'DAYS',
    typicalHoldingDays: { min: 3, max: 14 },
    color: '#EF4444',
    emoji: '🔄',
    enabled: true,
    requiresManualInput: false,
  },

  // ---- KORTSIKTIGE STRATEGIER ----
  DAYTRADER: {
    id: 'DAYTRADER',
    name: 'Daytrader',
    shortName: 'Day',
    description: 'Daglig trading. ADVARSEL: 90% av daytraders taper penger. Krever erfaring og disiplin.',
    category: 'TECHNICAL',
    riskLevel: 'VERY_HIGH',
    targetReturn: { min: -5, max: 3 },  // Ærlig: De fleste taper, gevinster er små
    timeHorizon: 'INTRADAY',
    typicalHoldingDays: { min: 0, max: 1 },
    color: '#F97316',
    emoji: '⚡',
    enabled: true,
    requiresManualInput: false,
  },
  
  SWING_SHORT: {
    id: 'SWING_SHORT',
    name: 'Kort Swing',
    shortName: 'Swing',
    description: 'Korte swings på 2-7 dager. Trenger god timing og disiplinert stop loss.',
    category: 'TECHNICAL',
    riskLevel: 'HIGH',
    targetReturn: { min: 3, max: 10 },  // Realistisk for korte swings
    timeHorizon: 'DAYS',
    typicalHoldingDays: { min: 2, max: 7 },
    color: '#06B6D4',
    emoji: '🏄',
    enabled: true,
    requiresManualInput: false,
  },

  // ---- ANALYTIKER-PORTEFØLJER ----
  DNB_MONTHLY: {
    id: 'DNB_MONTHLY',
    name: 'DNB Månedlig',
    shortName: 'DNB',
    description: 'DNB Markets månedlige aksjevalg. Oppdateres manuelt.',
    category: 'ANALYST',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 10, max: 30 },
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 20, max: 40 },
    color: '#004D40',
    emoji: '🏦',
    enabled: true,
    requiresManualInput: true,
    dataSource: 'DNB Markets',
  },
  
  PARETO_TOP: {
    id: 'PARETO_TOP',
    name: 'Pareto Topp',
    shortName: 'Pareto',
    description: 'Pareto Securities topp-anbefalinger.',
    category: 'ANALYST',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 15, max: 40 },
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 30, max: 90 },
    color: '#1E3A8A',
    emoji: '📊',
    enabled: false, // Ikke implementert ennå
    requiresManualInput: true,
    dataSource: 'Pareto Securities',
  },
  
  ARCTIC_PICKS: {
    id: 'ARCTIC_PICKS',
    name: 'Arctic Picks',
    shortName: 'Arctic',
    description: 'Arctic Securities anbefalinger.',
    category: 'ANALYST',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 15, max: 40 },
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 30, max: 90 },
    color: '#0EA5E9',
    emoji: '❄️',
    enabled: false,
    requiresManualInput: true,
    dataSource: 'Arctic Securities',
  },
  
  ANALYST_CONSENSUS: {
    id: 'ANALYST_CONSENSUS',
    name: 'Analytiker Konsensus',
    shortName: 'Konsensus',
    description: 'Aksjer med sterk kjøpsanbefaling fra flere analytikere.',
    category: 'ANALYST',
    riskLevel: 'LOW',
    targetReturn: { min: 10, max: 25 },
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 30, max: 180 },
    color: '#6366F1',
    emoji: '🎯',
    enabled: false,
    requiresManualInput: true,
  },

  // ---- SPESIAL-STRATEGIER ----
  EARNINGS_PLAY: {
    id: 'EARNINGS_PLAY',
    name: 'Earnings Play',
    shortName: 'Earnings',
    description: 'Trading rundt kvartalsrapporter. Høy volatilitet, høy belønning.',
    category: 'EVENT',
    riskLevel: 'VERY_HIGH',
    targetReturn: { min: 10, max: 50 },
    timeHorizon: 'DAYS',
    typicalHoldingDays: { min: 1, max: 5 },
    color: '#DC2626',
    emoji: '📅',
    enabled: false,
    requiresManualInput: false,
  },
  
  SECTOR_ROTATION: {
    id: 'SECTOR_ROTATION',
    name: 'Sektor Rotasjon',
    shortName: 'Sektor',
    description: 'Følger penger som roterer mellom sektorer.',
    category: 'MOMENTUM',
    riskLevel: 'MEDIUM',
    targetReturn: { min: 20, max: 50 },
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 14, max: 60 },
    color: '#7C3AED',
    emoji: '🔄',
    enabled: false,
    requiresManualInput: false,
  },
  
  DIVIDEND_HUNTER: {
    id: 'DIVIDEND_HUNTER',
    name: 'Utbytte Jeger',
    shortName: 'Utbytte',
    description: 'Høyt utbytte aksjer. Norske utbytteaksjer gir typisk 4-8% årlig yield + kursstigning.',
    category: 'INCOME',
    riskLevel: 'LOW',
    targetReturn: { min: 6, max: 12 },  // Utbytte + moderat kursstigning
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 90, max: 365 },
    color: '#059669',
    emoji: '💰',
    enabled: true,
    requiresManualInput: true,
  },

  // ---- "ÆRLIGE" STRATEGIER ----
  // For når du bare... kjøper uten en klar plan
  // VIKTIG: Disse har realistiske (ofte negative) forventninger!
  
  YOLO: {
    id: 'YOLO',
    name: 'Magefølelse',
    shortName: 'YOLO',
    description: 'Tro, håp og kjærlighet. Ingen analyse, bare følelser. Statistisk taper de fleste.',
    category: 'EVENT',
    riskLevel: 'VERY_HIGH',
    targetReturn: { min: -30, max: 20 },  // Realistisk: de fleste taper
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 1, max: 180 },
    color: '#E11D48',
    emoji: '🎲',
    enabled: true,
    requiresManualInput: true,
  },
  
  TIPS: {
    id: 'TIPS',
    name: 'Tips fra noen',
    shortName: 'Tips',
    description: 'Kompis, forum, Reddit, eller "noen på nettet". Ofte allerede priset inn når du hører om det.',
    category: 'EVENT',
    riskLevel: 'HIGH',
    targetReturn: { min: -20, max: 10 },  // Tips kommer ofte for sent
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 7, max: 90 },
    color: '#7C3AED',
    emoji: '💬',
    enabled: true,
    requiresManualInput: true,
  },
  
  HODL: {
    id: 'HODL',
    name: 'Bare HODL',
    shortName: 'HODL',
    description: 'Langsiktig hold uten exit-plan. Følger markedet opp og ned. Historisk ca. 8% årlig for indeks.',
    category: 'VALUE',
    riskLevel: 'MEDIUM',
    targetReturn: { min: -20, max: 15 },  // Følger markedet, kan gå begge veier
    timeHorizon: 'MONTHS',
    typicalHoldingDays: { min: 365, max: 3650 },
    color: '#0891B2',
    emoji: '💎',
    enabled: true,
    requiresManualInput: true,
  },
  
  FOMO: {
    id: 'FOMO',
    name: 'FOMO',
    shortName: 'FOMO',
    description: 'Fear Of Missing Out! Kjøper på toppen etter alle andre. 80%+ taper penger på FOMO-kjøp.',
    category: 'EVENT',
    riskLevel: 'VERY_HIGH',
    targetReturn: { min: -50, max: 0 },  // ÆRLIG: De aller fleste taper på FOMO
    timeHorizon: 'DAYS',
    typicalHoldingDays: { min: 1, max: 30 },
    color: '#F59E0B',
    emoji: '🚨',
    enabled: true,
    requiresManualInput: true,
  },
  
  // ============================================
  // EKSPERT-STRATEGIER (følger kjente investorer)
  // ============================================
  
  UKENS_AKSJE: {
    id: 'UKENS_AKSJE',
    name: 'Ukens Aksje (Espen Tingvoll)',
    shortName: 'Tingvoll',
    description: 'Følger Espen Tingvoll fra Investornytt. Resultat avhenger av hans track record.',
    category: 'EVENT',
    riskLevel: 'MEDIUM',
    targetReturn: { min: -5, max: 15 },  // Usikkert, avhenger av analytiker
    timeHorizon: 'WEEKS',
    typicalHoldingDays: { min: 7, max: 60 },
    color: '#0D9488',
    emoji: '📰',
    enabled: true,
    requiresManualInput: true,
  },
};

// ============================================
// STRATEGY EVALUATORS
// ============================================

/**
 * Evaluerer en aksje mot alle aktiverte strategier
 */
export function evaluateAllStrategies(input: StockAnalysisInput): StrategyEvaluation[] {
  const results: StrategyEvaluation[] = [];
  
  for (const strategy of Object.values(STRATEGIES)) {
    if (!strategy.enabled || strategy.requiresManualInput) continue;
    
    const evaluation = evaluateStrategy(strategy.id, input);
    if (evaluation) {
      // Sett ALLE som "passed" - vi bruker score for rangering istedenfor pass/fail
      evaluation.passed = true;
      results.push(evaluation);
    }
  }
  
  // Sorter etter score - beste strategi først
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Evaluerer en aksje mot én spesifikk strategi
 */
export function evaluateStrategy(strategyId: StrategyId, input: StockAnalysisInput): StrategyEvaluation | null {
  switch (strategyId) {
    case 'MOMENTUM_TREND':
      return evaluateMomentumTrend(input);
    case 'MOMENTUM_ASYM':
      return evaluateMomentumAsym(input);
    case 'BUFFETT':
      return evaluateBuffett(input);
    case 'TVEITEREID':
      return evaluateTveitereid(input);
    case 'INSIDER':
      return evaluateInsider(input);
    case 'REBOUND':
      return evaluateRebound(input);
    case 'DAYTRADER':
      return evaluateDaytrader(input);
    case 'SWING_SHORT':
      return evaluateSwingShort(input);
    default:
      return null;
  }
}

// ---- MOMENTUM TREND ----
// Trygg trend-følging for 50-100% avkastning
function evaluateMomentumTrend(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  
  // TREND-INDIKATORER (hovedsakelig score-basert, bare ett hard krav)
  
  // 1. Opptrend (SMA50 > SMA200) - gir høy score
  if (input.sma50 > input.sma200) {
    reasoning.push('✅ Golden Cross: SMA50 over SMA200');
    score += 25;
  } else {
    reasoning.push('⚠️ Ikke i opptrend (SMA50 under SMA200)');
    score += 5;
  }
  
  // 2. Pris over SMA50 (bekreftet trend) - nå mer fleksibelt
  if (input.price > input.sma50) {
    reasoning.push('✅ Pris over SMA50 - i trenden');
    score += 20;
  } else if (input.price > input.sma50 * 0.95) {
    reasoning.push('⚠️ Pris nær SMA50 - potensielt bounce');
    score += 10;
  } else {
    reasoning.push(`⚠️ Pris under SMA50 (${((input.price/input.sma50 - 1) * 100).toFixed(1)}%)`);
    score += 5;
    // IKKE sett passed = false lenger - la det være score-basert
  }
  
  // 3. RSI mellom 35-70 (utvidet range for flere muligheter)
  if (input.rsi >= 35 && input.rsi <= 70) {
    reasoning.push(`✅ RSI ${input.rsi.toFixed(0)} - akseptabelt momentum`);
    score += 15;
  } else if (input.rsi > 70) {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - overkjøpt`);
    score += 5;
  } else {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - svakt momentum`);
    score += 5; // Ikke hard fail lenger
  }
  
  // 4. Likviditet (ikke hard krav lenger, men gir bonus)
  if (input.dailyVolume >= 5_000_000) {
    reasoning.push('✅ Utmerket likviditet');
    score += 15;
  } else if (input.dailyVolume >= 1_000_000) {
    reasoning.push('✅ God likviditet');
    score += 10;
  } else {
    reasoning.push('⚠️ Moderat likviditet');
    score += 5;
  }
  
  // BONUS POENG
  
  // Relativt volum > 1.0 (normal eller over)
  if (input.relativeVolume >= 1.2) {
    reasoning.push(`✅ Økt interesse (RelVol: ${input.relativeVolume.toFixed(1)}x)`);
    score += 15;
  } else if (input.relativeVolume >= 1.0) {
    score += 5;
  }
  
  // Nær 20-dagers høy (breakout-potensial)
  if (input.distanceFrom20High >= -3) {
    reasoning.push('✅ Nær 20d høy - breakout-kandidat');
    score += 15;
  }
  
  // Rom til 52-ukers høy
  if (input.distanceFrom52High <= -10) {
    reasoning.push(`✅ ${Math.abs(input.distanceFrom52High).toFixed(0)}% til 52-ukers høy`);
    score += 10;
  }
  
  // Beregn entry/stop/target
  const stopLoss = input.price - (input.atr * 2);
  const riskAmount = input.price - stopLoss;
  const target = input.price + (riskAmount * 2.5); // 2.5R for trend
  
  return {
    strategyId: 'MOMENTUM_TREND',
    passed: true, // Alle vises, score bestemmer rangering
    score: Math.min(100, score),
    confidence: Math.min(90, score + 10),
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 2.5,
  };
}

// ---- MOMENTUM ASYM ----
// Høy risiko/høy belønning for 100-300% avkastning
function evaluateMomentumAsym(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  
  // TREND-INDIKATORER (score-basert, mer fleksibelt)
  
  // 1. Opptrend - gir bonus men ikke krav
  if (input.sma50 > input.sma200) {
    reasoning.push('✅ Opptrend bekreftet');
    score += 20;
  } else {
    reasoning.push('⚠️ Ikke i etablert opptrend');
    score += 5;
  }
  
  // 2. Pris vs SMA50
  if (input.price > input.sma50) {
    reasoning.push('✅ Pris over SMA50');
    score += 15;
  } else if (input.price > input.sma50 * 0.95) {
    reasoning.push('⚠️ Pris nær SMA50');
    score += 8;
  } else {
    reasoning.push('⚠️ Pris under SMA50');
    score += 3;
  }
  
  // 3. ATR (volatilitet) - gir bonus, ikke hard krav
  const atrPercent = (input.atr / input.price) * 100;
  if (atrPercent >= 3) {
    reasoning.push(`✅ Høy volatilitet (ATR: ${atrPercent.toFixed(1)}%) - ideelt for asym`);
    score += 20;
  } else if (atrPercent >= 2) {
    reasoning.push(`✅ Moderat volatilitet (ATR: ${atrPercent.toFixed(1)}%)`);
    score += 15;
  } else if (atrPercent >= 1.5) {
    reasoning.push(`⚠️ Lav volatilitet (ATR: ${atrPercent.toFixed(1)}%)`);
    score += 5;
  } else {
    reasoning.push(`⚠️ Veldig lav volatilitet (ATR: ${atrPercent.toFixed(1)}%)`);
  }
  
  // 4. RSI under 60 (rom for oppgang)
  if (input.rsi < 60) {
    reasoning.push(`✅ RSI ${input.rsi.toFixed(0)} - rom for oppgang`);
    score += 10;
  } else {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - begrenset oppside`);
  }
  
  // ASYMMETRI-FAKTORER (det viktigste)
  
  // Stor avstand til 52-ukers høy = stor oppside
  if (input.distanceFrom52High <= -20) {
    reasoning.push(`🚀 ${Math.abs(input.distanceFrom52High).toFixed(0)}% til 52-ukers høy - STOR oppside!`);
    score += 25;
  } else if (input.distanceFrom52High <= -10) {
    reasoning.push(`✅ ${Math.abs(input.distanceFrom52High).toFixed(0)}% til 52-ukers høy`);
    score += 15;
  }
  
  // Breakout-kandidat
  if (input.distanceFrom20High >= -2) {
    reasoning.push('🔥 Breakout imminent - nær 20d høy');
    score += 15;
  }
  
  // Økt volum = institusjonell interesse
  if (input.relativeVolume >= 1.5) {
    reasoning.push(`🔥 Høyt relativt volum (${input.relativeVolume.toFixed(1)}x) - institusjonell interesse`);
    score += 15;
  } else if (input.relativeVolume >= 1.2) {
    score += 5;
  }
  
  // Beregn entry/stop/target - ASYMMETRISK
  const stopLoss = input.price - (input.atr * 1.5); // Tettere stop
  const riskAmount = input.price - stopLoss;
  const target = input.price + (riskAmount * 4); // 4R target for asym!
  
  return {
    strategyId: 'MOMENTUM_ASYM',
    passed: true, // Alle vises, score bestemmer rangering
    score: Math.min(100, score),
    confidence: score >= 70 ? 75 : 50,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 4,
  };
}

// ---- BUFFETT (Kvalitet) ----
function evaluateBuffett(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  let passed = true;
  
  // Stabil trend
  if (input.price > input.sma50 && input.sma50 > input.sma200) {
    reasoning.push('✅ Stabil opptrend');
    score += 25;
  } else if (input.price > input.sma200) {
    reasoning.push('⚠️ Over langsiktig trend');
    score += 10;
  } else {
    reasoning.push('❌ Under langsiktig trend');
    passed = false;
  }
  
  // RSI i balansert sone (35-60)
  if (input.rsi >= 35 && input.rsi <= 60) {
    reasoning.push(`✅ RSI ${input.rsi.toFixed(0)} - balansert`);
    score += 20;
  } else if (input.rsi < 35) {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - mulig verdi, men risikabelt`);
    score += 5;
  } else {
    reasoning.push(`❌ RSI ${input.rsi.toFixed(0)} - for høyt for kvalitetsstrategi`);
    passed = false;
  }
  
  // Høy likviditet
  if (input.dailyVolume >= 10_000_000) {
    reasoning.push('✅ Meget høy likviditet - kvalitetsaksje');
    score += 25;
  } else if (input.dailyVolume >= 5_000_000) {
    reasoning.push('✅ God likviditet');
    score += 15;
  } else {
    passed = false;
  }
  
  // Lav volatilitet (stabil)
  const atrPercent = (input.atr / input.price) * 100;
  if (atrPercent <= 3) {
    reasoning.push(`✅ Lav volatilitet (${atrPercent.toFixed(1)}%) - stabil`);
    score += 20;
  } else if (atrPercent <= 5) {
    score += 10;
  }
  
  const stopLoss = input.price - (input.atr * 2.5);
  const target = input.price * 1.25; // 25% mål
  
  return {
    strategyId: 'BUFFETT',
    passed,
    score: Math.min(100, score),
    confidence: passed ? 70 : 30,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 1.5,
  };
}

// ---- TVEITEREID (Likviditet) ----
function evaluateTveitereid(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  let passed = true;
  
  // HOVEDKRAV: Høy likviditet
  if (input.dailyVolume >= 20_000_000) {
    reasoning.push('✅ Ekstremt høy likviditet - topp-aksje');
    score += 40;
  } else if (input.dailyVolume >= 10_000_000) {
    reasoning.push('✅ Meget høy likviditet');
    score += 30;
  } else if (input.dailyVolume >= 8_000_000) {
    reasoning.push('✅ God likviditet');
    score += 20;
  } else {
    reasoning.push('❌ For lav likviditet for denne strategien');
    passed = false;
  }
  
  // Positiv trend
  if (input.price > input.sma50) {
    reasoning.push('✅ Over SMA50');
    score += 20;
  }
  
  // RSI ok
  if (input.rsi < 70) {
    score += 15;
  }
  
  // Relativt volum
  if (input.relativeVolume >= 1.0) {
    score += 15;
  }
  
  const stopLoss = input.price - (input.atr * 2);
  const target = input.price * 1.20;
  
  return {
    strategyId: 'TVEITEREID',
    passed,
    score: Math.min(100, score),
    confidence: passed ? 65 : 30,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 1.5,
  };
}

// ---- INSIDER ----
function evaluateInsider(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  let passed = false;
  
  // HOVEDKRAV: Innsidekjøp
  if (input.insiderScore >= 60) {
    reasoning.push(`🔥 Høy insider-score (${input.insiderScore}) - sterkt signal`);
    score += 50;
    passed = true;
  } else if (input.insiderScore >= 40) {
    reasoning.push(`✅ God insider-aktivitet (${input.insiderScore})`);
    score += 30;
    passed = true;
  } else if (input.insiderBuys > 0) {
    reasoning.push(`⚠️ Noen innsidekjøp (${input.insiderBuys})`);
    score += 15;
  } else {
    reasoning.push('❌ Ingen innsidekjøp');
  }
  
  // Bonus for trend
  if (input.price > input.sma50) {
    reasoning.push('✅ Positiv trend støtter insider-signal');
    score += 20;
  }
  
  // Bonus for flere kjøp
  if (input.insiderBuys >= 3) {
    reasoning.push(`✅ ${input.insiderBuys} innsidekjøp - konsensus!`);
    score += 20;
  }
  
  const stopLoss = input.price - (input.atr * 2);
  const target = input.price * 1.40;
  
  return {
    strategyId: 'INSIDER',
    passed,
    score: Math.min(100, score),
    confidence: input.insiderBuys >= 2 ? 70 : 50,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 2,
  };
}

// ---- REBOUND ----
function evaluateRebound(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  let passed = false;
  
  // HOVEDKRAV: Oversolgt RSI
  if (input.rsi <= 30) {
    reasoning.push(`🔥 RSI ${input.rsi.toFixed(0)} - sterkt oversolgt!`);
    score += 40;
    passed = true;
  } else if (input.rsi <= 40) {
    reasoning.push(`✅ RSI ${input.rsi.toFixed(0)} - oversolgt`);
    score += 25;
    passed = true;
  } else {
    reasoning.push(`❌ RSI ${input.rsi.toFixed(0)} - ikke oversolgt`);
  }
  
  // Bør være over SMA200 (langsiktig støtte)
  if (input.price > input.sma200) {
    reasoning.push('✅ Over SMA200 - langsiktig trend intakt');
    score += 25;
  } else {
    reasoning.push('⚠️ Under SMA200 - høyere risiko');
    score += 5;
  }
  
  // Volum-spike kan indikere kapitulasjon
  if (input.relativeVolume >= 2) {
    reasoning.push('🔥 Volum-spike - mulig kapitulasjon');
    score += 20;
  }
  
  const stopLoss = input.price - (input.atr * 1.5);
  const target = input.sma50; // Target er tilbake til SMA50
  
  return {
    strategyId: 'REBOUND',
    passed,
    score: Math.min(100, score),
    confidence: passed ? 55 : 30,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 2,
  };
}

// ---- DAYTRADER ----
// Forbedret DayTrade-score med mer sofistikerte intraday-kriterier
function evaluateDaytrader(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  let passed = true;
  
  // ============================================
  // 1. VOLUM - Kritisk for daytrading (0-30 poeng)
  // ============================================
  const volumeInMillions = input.dailyVolume / 1_000_000;
  if (volumeInMillions >= 50) {
    reasoning.push(`🔥 Ekstremt høyt volum (${volumeInMillions.toFixed(0)}M) - ideelt for scalping`);
    score += 30;
  } else if (volumeInMillions >= 20) {
    reasoning.push(`✅ Meget høyt volum (${volumeInMillions.toFixed(0)}M)`);
    score += 22;
  } else if (volumeInMillions >= 10) {
    reasoning.push(`✅ Godt volum for daytrading (${volumeInMillions.toFixed(0)}M)`);
    score += 15;
  } else if (volumeInMillions >= 5) {
    reasoning.push(`⚠️ Akseptabelt volum (${volumeInMillions.toFixed(1)}M)`);
    score += 8;
  } else {
    reasoning.push(`❌ For lavt volum (${volumeInMillions.toFixed(1)}M) - høy spread-risiko`);
    passed = false;
  }
  
  // ============================================
  // 2. VOLATILITET - Daglige muligheter (0-25 poeng)
  // ============================================
  const atrPercent = (input.atr / input.price) * 100;
  if (atrPercent >= 4) {
    reasoning.push(`🔥 Høy volatilitet (${atrPercent.toFixed(1)}%) - STORE daglige swings`);
    score += 25;
  } else if (atrPercent >= 3) {
    reasoning.push(`✅ God volatilitet (${atrPercent.toFixed(1)}%) - 2-3% daglig range`);
    score += 20;
  } else if (atrPercent >= 2) {
    reasoning.push(`⚠️ Moderat volatilitet (${atrPercent.toFixed(1)}%)`);
    score += 12;
  } else if (atrPercent >= 1.5) {
    reasoning.push(`⚠️ Lav volatilitet (${atrPercent.toFixed(1)}%) - begrenset intraday-potensial`);
    score += 5;
  } else {
    reasoning.push(`❌ For lav volatilitet (${atrPercent.toFixed(1)}%) for daytrading`);
    passed = false;
  }
  
  // ============================================
  // 3. INTRADAY MOMENTUM - Dagens aktivitet (0-25 poeng)
  // ============================================
  if (input.relativeVolume >= 2.0) {
    reasoning.push(`🔥 Ekstrem volumøkning i dag (${input.relativeVolume.toFixed(1)}x) - HOT!`);
    score += 25;
  } else if (input.relativeVolume >= 1.5) {
    reasoning.push(`✅ Økt aktivitet i dag (${input.relativeVolume.toFixed(1)}x snitt)`);
    score += 18;
  } else if (input.relativeVolume >= 1.2) {
    reasoning.push(`✅ Over snitt volum (${input.relativeVolume.toFixed(1)}x)`);
    score += 12;
  } else if (input.relativeVolume >= 1.0) {
    reasoning.push(`⚠️ Normal aktivitet (${input.relativeVolume.toFixed(1)}x)`);
    score += 6;
  } else {
    reasoning.push(`⚠️ Under snitt volum (${input.relativeVolume.toFixed(1)}x) - lite interesse`);
  }
  
  // ============================================
  // 4. RSI-MOMENTUM - Intraday retning (0-15 poeng)
  // ============================================
  // For daytrading: Vi vil ha momentum, men ikke ekstrem overkjøpt
  if (input.rsi >= 55 && input.rsi <= 70) {
    reasoning.push(`✅ RSI ${input.rsi.toFixed(0)} - positivt momentum uten overkjøpt`);
    score += 15;
  } else if (input.rsi >= 50 && input.rsi < 55) {
    reasoning.push(`✅ RSI ${input.rsi.toFixed(0)} - nøytralt-positivt`);
    score += 10;
  } else if (input.rsi >= 40 && input.rsi < 50) {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - svakt, vurder pullback-kjøp`);
    score += 5;
  } else if (input.rsi > 70) {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - overkjøpt, risiko for pullback`);
    score += 3;
  } else if (input.rsi < 40 && input.rsi > 30) {
    reasoning.push(`⚠️ RSI ${input.rsi.toFixed(0)} - oversolgt, mulig bounce-kandidat`);
    score += 5;
  } else {
    reasoning.push(`❌ RSI ${input.rsi.toFixed(0)} - ekstrem, høy risiko`);
  }
  
  // ============================================
  // 5. BONUS-FAKTORER (0-5 poeng)
  // ============================================
  // Breakout-nærhet
  if (input.distanceFrom20High >= -1) {
    reasoning.push(`🔥 Nær 20d høy - intraday breakout-kandidat!`);
    score += 5;
  }
  
  // ============================================
  // DAYTRADE ENTRY/EXIT LEVELS
  // ============================================
  // Tett stop = krever presis timing
  const stopLoss = input.price - (input.atr * 0.5);  // ~0.5 ATR stop
  const target = input.price + (input.atr * 1.0);   // 2:1 R/R
  const scalpTarget = input.price + (input.atr * 0.5); // 1:1 for scalp
  
  // ============================================
  // FINAL DAYTRADE SCORE
  // ============================================
  // Maks 100 poeng:
  // - Volum: 30
  // - Volatilitet: 25
  // - Intraday momentum: 25
  // - RSI: 15
  // - Bonus: 5
  
  const finalScore = Math.min(100, score);
  const daytradePassed = passed && finalScore >= 50;
  
  // Confidence basert på hvor mange kriterier som er oppfylt
  const confidence = daytradePassed 
    ? Math.min(75, 40 + (finalScore - 50)) // 40-75%
    : Math.max(20, 40 - (50 - finalScore)); // 20-40%
  
  return {
    strategyId: 'DAYTRADER',
    passed: daytradePassed,
    score: finalScore,
    confidence,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 2,
  };
}

// ---- SWING SHORT ----
function evaluateSwingShort(input: StockAnalysisInput): StrategyEvaluation {
  const reasoning: string[] = [];
  let score = 0;
  let passed = true;
  
  // Må ha nok volum
  if (input.dailyVolume >= 5_000_000) {
    score += 15;
  } else {
    passed = false;
  }
  
  // Volatilitet
  const atrPercent = (input.atr / input.price) * 100;
  if (atrPercent >= 2.5) {
    reasoning.push(`✅ God volatilitet for swing (${atrPercent.toFixed(1)}%)`);
    score += 20;
  } else {
    passed = false;
  }
  
  // Momentum-retning
  if (input.rsi >= 45 && input.rsi <= 65) {
    reasoning.push('✅ RSI i swing-sone');
    score += 20;
  }
  
  // Nær breakout
  if (input.distanceFrom20High >= -3) {
    reasoning.push('✅ Nær 20d høy - breakout-setup');
    score += 25;
  }
  
  // Relativt volum
  if (input.relativeVolume >= 1.2) {
    score += 15;
  }
  
  const stopLoss = input.price - (input.atr * 1.5);
  const target = input.price + (input.atr * 3);
  
  return {
    strategyId: 'SWING_SHORT',
    passed,
    score: Math.min(100, score),
    confidence: 55,
    reasoning,
    suggestedEntry: input.price,
    suggestedStop: stopLoss,
    suggestedTarget: target,
    riskRewardRatio: 2,
  };
}

// ============================================
// HELPERS
// ============================================

/**
 * Hent alle aktiverte strategier
 */
export function getEnabledStrategies(): StrategyDefinition[] {
  return Object.values(STRATEGIES).filter(s => s.enabled);
}

/**
 * Hent ALLE strategier (inkludert deaktiverte) - for portefølje-valg
 */
export function getAllStrategies(): StrategyDefinition[] {
  return Object.values(STRATEGIES);
}

/**
 * Hent strategier som kan brukes manuelt (for trade registrering)
 */
export function getManualStrategies(): StrategyDefinition[] {
  // Alle aktiverte + de som krever manuell input
  return Object.values(STRATEGIES).filter(s => s.enabled || s.requiresManualInput);
}

/**
 * Hent strategier etter kategori
 */
export function getStrategiesByCategory(category: StrategyCategory): StrategyDefinition[] {
  return Object.values(STRATEGIES).filter(s => s.category === category && s.enabled);
}

/**
 * Hent strategier etter risiko-nivå
 */
export function getStrategiesByRisk(riskLevel: RiskLevel): StrategyDefinition[] {
  return Object.values(STRATEGIES).filter(s => s.riskLevel === riskLevel && s.enabled);
}

/**
 * Hent anbefalt fordeling basert på risikoprofil
 */
export function getRecommendedAllocation(riskTolerance: 'conservative' | 'moderate' | 'aggressive'): Record<StrategyId, number> {
  switch (riskTolerance) {
    case 'conservative':
      return {
        MOMENTUM_TREND: 30,
        BUFFETT: 40,
        TVEITEREID: 20,
        INSIDER: 10,
      } as Record<StrategyId, number>;
      
    case 'moderate':
      return {
        MOMENTUM_TREND: 25,
        MOMENTUM_ASYM: 20,
        BUFFETT: 20,
        INSIDER: 15,
        SWING_SHORT: 10,
        DAYTRADER: 10,
      } as Record<StrategyId, number>;
      
    case 'aggressive':
      return {
        MOMENTUM_ASYM: 35,
        MOMENTUM_TREND: 20,
        DAYTRADER: 20,
        SWING_SHORT: 15,
        INSIDER: 10,
      } as Record<StrategyId, number>;
  }
}
