/**
 * Trade Journal Store
 * 
 * Logger trades med notater, følelser, og AI-analyse
 * for å lære av feil og forbedre beslutninger.
 */

import { Trade } from '@/lib/types';

export interface TradeJournalEntry {
  id: string;
  tradeId: string;
  ticker: string;
  stockName: string;
  
  // Trade detaljer
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  
  // Bruker-notater
  entryReason: string;
  exitReason?: string;
  emotionalState: 'confident' | 'nervous' | 'fomo' | 'greedy' | 'fearful' | 'neutral';
  followedPlan: boolean;
  
  // Teknisk ved entry
  kScoreAtEntry: number;
  rsiAtEntry: number;
  signalAtEntry: 'BUY' | 'HOLD' | 'SELL';
  
  // AI Analyse (generert)
  aiAnalysis?: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    strengths: string[];
    mistakes: string[];
    lessons: string[];
    wouldRecommend: boolean;
  };
  
  // Resultater
  returnPercent?: number;
  returnAmount?: number;
  holdingDays?: number;
  
  // Meta
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

const STORAGE_KEY = 'k-man-trade-journal';

// ============ CRUD Operations ============

export function getJournalEntries(): TradeJournalEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getJournalEntry(id: string): TradeJournalEntry | undefined {
  return getJournalEntries().find(e => e.id === id);
}

export function getEntryForTrade(tradeId: string): TradeJournalEntry | undefined {
  return getJournalEntries().find(e => e.tradeId === tradeId);
}

export function saveJournalEntry(entry: Omit<TradeJournalEntry, 'id' | 'createdAt' | 'updatedAt'>): TradeJournalEntry {
  const entries = getJournalEntries();
  const now = new Date().toISOString();
  
  const newEntry: TradeJournalEntry = {
    ...entry,
    id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };

  entries.push(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  
  return newEntry;
}

export function updateJournalEntry(id: string, updates: Partial<TradeJournalEntry>): void {
  const entries = getJournalEntries();
  const index = entries.findIndex(e => e.id === id);
  
  if (index !== -1) {
    entries[index] = {
      ...entries[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }
}

export function deleteJournalEntry(id: string): void {
  const entries = getJournalEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ============ AI Analysis ============

export function generateAIAnalysis(entry: TradeJournalEntry): TradeJournalEntry['aiAnalysis'] {
  const strengths: string[] = [];
  const mistakes: string[] = [];
  const lessons: string[] = [];
  let score = 50;

  // Analyse entry timing
  if (entry.signalAtEntry === 'BUY' && entry.kScoreAtEntry >= 70) {
    strengths.push('Kjøpte på sterkt momentum-signal');
    score += 10;
  } else if (entry.signalAtEntry === 'SELL' && entry.kScoreAtEntry < 40) {
    mistakes.push('Kjøpte mot signal (var SELG)');
    lessons.push('Vent på BUY-signal før kjøp');
    score -= 15;
  } else if (entry.signalAtEntry === 'HOLD') {
    if (entry.kScoreAtEntry >= 60) {
      strengths.push('Kjøpte på nøytralt signal med ok momentum');
    } else {
      mistakes.push('Kjøpte uten klart BUY-signal');
      lessons.push('Vurder å vente på sterkere signal');
      score -= 5;
    }
  }

  // RSI analysis
  if (entry.rsiAtEntry > 70) {
    mistakes.push('Kjøpte på overkjøpt RSI (>70)');
    lessons.push('Unngå kjøp når RSI er over 70');
    score -= 10;
  } else if (entry.rsiAtEntry < 30) {
    if (entry.returnPercent && entry.returnPercent > 0) {
      strengths.push('Godt timing på oversold RSI');
    } else {
      lessons.push('Oversold betyr ikke alltid bunn - vent på reversering');
    }
  } else if (entry.rsiAtEntry >= 40 && entry.rsiAtEntry <= 60) {
    strengths.push('RSI i sunn sone ved kjøp');
    score += 5;
  }

  // Emotional state analysis
  if (entry.emotionalState === 'fomo') {
    mistakes.push('FOMO-kjøp - følte press til å kjøpe');
    lessons.push('FOMO fører ofte til dårlig timing. Ta en pause og analyser objektivt.');
    score -= 15;
  } else if (entry.emotionalState === 'greedy') {
    mistakes.push('Kjøpte drevet av grådighet');
    lessons.push('Grådighet er en advarsel - sjekk om fundamentalet støtter posisjonen');
    score -= 10;
  } else if (entry.emotionalState === 'confident' && entry.followedPlan) {
    strengths.push('Handlet med selvtillit og fulgte planen');
    score += 10;
  } else if (entry.emotionalState === 'fearful' && !entry.exitPrice) {
    lessons.push('Frykt kan være et signal - vurder om posisjonen fortsatt er riktig');
  }

  // Plan following
  if (entry.followedPlan) {
    strengths.push('Fulgte handelsplanen');
    score += 10;
  } else {
    mistakes.push('Avvik fra handelsplan');
    lessons.push('Disiplin er nøkkelen - lag en plan og hold deg til den');
    score -= 10;
  }

  // Result analysis
  if (entry.returnPercent !== undefined) {
    if (entry.returnPercent >= 15) {
      strengths.push(`Utmerket avkastning: +${entry.returnPercent.toFixed(1)}%`);
      score += 15;
    } else if (entry.returnPercent >= 5) {
      strengths.push(`God avkastning: +${entry.returnPercent.toFixed(1)}%`);
      score += 10;
    } else if (entry.returnPercent < -10) {
      mistakes.push(`Betydelig tap: ${entry.returnPercent.toFixed(1)}%`);
      lessons.push('Vurder strengere stop-loss for å begrense tap');
      score -= 10;
    } else if (entry.returnPercent < -5) {
      lessons.push('Moderat tap - analyser hva som gikk galt');
      score -= 5;
    }
  }

  // Holding time analysis
  if (entry.holdingDays !== undefined) {
    if (entry.holdingDays < 3 && entry.returnPercent && entry.returnPercent < 0) {
      mistakes.push('Kort holdetid med tap - mulig panikksalg');
      lessons.push('Gi trades tid til å utvikle seg hvis fundamentalet ikke har endret seg');
    } else if (entry.holdingDays > 60 && entry.returnPercent && entry.returnPercent < 5) {
      lessons.push('Lang holdetid med lav avkastning - vurder kapitalalternativkostnad');
    }
  }

  // Calculate grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
  if (score >= 80) grade = 'A';
  else if (score >= 65) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 35) grade = 'D';
  else grade = 'F';

  // Would recommend similar trade
  const wouldRecommend = score >= 60 && 
    entry.signalAtEntry === 'BUY' && 
    entry.kScoreAtEntry >= 60 &&
    entry.emotionalState !== 'fomo' &&
    entry.emotionalState !== 'greedy';

  return {
    grade,
    strengths,
    mistakes,
    lessons,
    wouldRecommend,
  };
}

// ============ Statistics ============

export interface JournalStats {
  totalTrades: number;
  completedTrades: number;
  avgReturn: number;
  winRate: number;
  avgHoldingDays: number;
  avgGrade: string;
  commonMistakes: Array<{ mistake: string; count: number }>;
  emotionalBreakdown: Record<TradeJournalEntry['emotionalState'], { count: number; avgReturn: number }>;
  planFollowingRate: number;
}

export function calculateJournalStats(): JournalStats {
  const entries = getJournalEntries();
  const completedEntries = entries.filter(e => e.exitPrice !== undefined && e.returnPercent !== undefined);

  if (entries.length === 0) {
    return {
      totalTrades: 0,
      completedTrades: 0,
      avgReturn: 0,
      winRate: 0,
      avgHoldingDays: 0,
      avgGrade: 'N/A',
      commonMistakes: [],
      emotionalBreakdown: {
        confident: { count: 0, avgReturn: 0 },
        nervous: { count: 0, avgReturn: 0 },
        fomo: { count: 0, avgReturn: 0 },
        greedy: { count: 0, avgReturn: 0 },
        fearful: { count: 0, avgReturn: 0 },
        neutral: { count: 0, avgReturn: 0 },
      },
      planFollowingRate: 0,
    };
  }

  // Calculate averages
  const avgReturn = completedEntries.length > 0
    ? completedEntries.reduce((sum, e) => sum + (e.returnPercent || 0), 0) / completedEntries.length
    : 0;

  const wins = completedEntries.filter(e => (e.returnPercent || 0) > 0);
  const winRate = completedEntries.length > 0 ? (wins.length / completedEntries.length) * 100 : 0;

  const avgHoldingDays = completedEntries.length > 0
    ? completedEntries.reduce((sum, e) => sum + (e.holdingDays || 0), 0) / completedEntries.length
    : 0;

  // Grade analysis
  const grades = entries.filter(e => e.aiAnalysis?.grade).map(e => e.aiAnalysis!.grade);
  const gradeValues = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1 };
  const gradeLabels = ['F', 'D', 'C', 'B', 'A'];
  const avgGradeValue = grades.length > 0
    ? grades.reduce((sum, g) => sum + gradeValues[g], 0) / grades.length
    : 3;
  const avgGrade = grades.length > 0 ? gradeLabels[Math.round(avgGradeValue) - 1] : 'N/A';

  // Emotional breakdown
  const emotionalBreakdown: JournalStats['emotionalBreakdown'] = {
    confident: { count: 0, avgReturn: 0 },
    nervous: { count: 0, avgReturn: 0 },
    fomo: { count: 0, avgReturn: 0 },
    greedy: { count: 0, avgReturn: 0 },
    fearful: { count: 0, avgReturn: 0 },
    neutral: { count: 0, avgReturn: 0 },
  };

  for (const entry of completedEntries) {
    const state = entry.emotionalState;
    emotionalBreakdown[state].count++;
    emotionalBreakdown[state].avgReturn += entry.returnPercent || 0;
  }

  for (const state of Object.keys(emotionalBreakdown) as TradeJournalEntry['emotionalState'][]) {
    if (emotionalBreakdown[state].count > 0) {
      emotionalBreakdown[state].avgReturn /= emotionalBreakdown[state].count;
    }
  }

  // Common mistakes
  const mistakeCount: Record<string, number> = {};
  for (const entry of entries) {
    if (entry.aiAnalysis?.mistakes) {
      for (const mistake of entry.aiAnalysis.mistakes) {
        mistakeCount[mistake] = (mistakeCount[mistake] || 0) + 1;
      }
    }
  }
  const commonMistakes = Object.entries(mistakeCount)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Plan following
  const planFollowingRate = entries.length > 0
    ? (entries.filter(e => e.followedPlan).length / entries.length) * 100
    : 0;

  return {
    totalTrades: entries.length,
    completedTrades: completedEntries.length,
    avgReturn,
    winRate,
    avgHoldingDays,
    avgGrade,
    commonMistakes,
    emotionalBreakdown,
    planFollowingRate,
  };
}
