/**
 * Analyst Recommendations Store
 * 
 * Lagrer og tracker anbefalinger fra:
 * - DNB Markets
 * - Delphi Fondene
 * - Investtech
 * - Andre analysthus
 */

export type AnalystSource = 'DNB Markets' | 'Delphi Fondene' | 'Investtech' | 'Arctic' | 'Carnegie' | 'Pareto' | 'ABG' | 'Annet';
export type RecommendationType = 'KJØP' | 'HOLD' | 'SELG' | 'BEHOLDES';

export interface AnalystRecommendation {
  id: string;
  source: AnalystSource;
  ticker: string;
  stockName: string;
  action: RecommendationType;
  priceAtRecommendation: number;
  targetPrice?: number;
  dateRecommended: string; // ISO date
  dateAdded: string; // When added to our system
  notes?: string;
  // For tracking performance
  closed?: boolean;
  closedDate?: string;
  closedPrice?: number;
  closedReason?: 'target_hit' | 'stop_hit' | 'changed_recommendation' | 'manual';
}

export interface AnalystPerformance {
  source: AnalystSource;
  totalRecommendations: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgReturn: number;
  bestPick: { ticker: string; return: number } | null;
  worstPick: { ticker: string; return: number } | null;
  avgHoldingDays: number;
}

export interface InvesttechScore {
  ticker: string;
  totalScore: number; // 0-100
  trend: 'stigende' | 'fallende' | 'sidelengs';
  support?: number;
  resistance?: number;
  dateUpdated: string;
}

const STORAGE_KEYS = {
  RECOMMENDATIONS: 'k-man-analyst-recommendations',
  INVESTTECH_SCORES: 'k-man-investtech-scores',
};

// ============ RECOMMENDATIONS CRUD ============

export function getAnalystRecommendations(): AnalystRecommendation[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.RECOMMENDATIONS);
  return stored ? JSON.parse(stored) : [];
}

export function saveAnalystRecommendation(recommendation: Omit<AnalystRecommendation, 'id' | 'dateAdded'>): AnalystRecommendation {
  const recommendations = getAnalystRecommendations();
  const newRec: AnalystRecommendation = {
    ...recommendation,
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    dateAdded: new Date().toISOString(),
  };
  recommendations.push(newRec);
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(recommendations));
  return newRec;
}

export function updateAnalystRecommendation(id: string, updates: Partial<AnalystRecommendation>): void {
  const recommendations = getAnalystRecommendations();
  const index = recommendations.findIndex(r => r.id === id);
  if (index !== -1) {
    recommendations[index] = { ...recommendations[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(recommendations));
  }
}

export function deleteAnalystRecommendation(id: string): void {
  const recommendations = getAnalystRecommendations().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(recommendations));
}

export function closeRecommendation(id: string, closedPrice: number, reason: AnalystRecommendation['closedReason']): void {
  updateAnalystRecommendation(id, {
    closed: true,
    closedDate: new Date().toISOString(),
    closedPrice,
    closedReason: reason,
  });
}

// ============ BULK IMPORT ============

export interface BulkImportData {
  source: AnalystSource;
  date: string;
  recommendations: Array<{
    ticker: string;
    stockName: string;
    action: RecommendationType;
    price: number;
    targetPrice?: number;
  }>;
}

export function bulkImportRecommendations(data: BulkImportData): number {
  const recommendations = getAnalystRecommendations();
  let imported = 0;

  for (const rec of data.recommendations) {
    // Check for duplicate (same source, ticker, date)
    const existing = recommendations.find(
      r => r.source === data.source && 
           r.ticker === rec.ticker && 
           r.dateRecommended === data.date
    );

    if (!existing) {
      const newRec: AnalystRecommendation = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: data.source,
        ticker: rec.ticker,
        stockName: rec.stockName,
        action: rec.action,
        priceAtRecommendation: rec.price,
        targetPrice: rec.targetPrice,
        dateRecommended: data.date,
        dateAdded: new Date().toISOString(),
      };
      recommendations.push(newRec);
      imported++;
    }
  }

  localStorage.setItem(STORAGE_KEYS.RECOMMENDATIONS, JSON.stringify(recommendations));
  return imported;
}

// ============ INVESTTECH SCORES ============

export function getInvesttechScores(): InvesttechScore[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEYS.INVESTTECH_SCORES);
  return stored ? JSON.parse(stored) : [];
}

export function updateInvesttechScore(score: Omit<InvesttechScore, 'dateUpdated'>): void {
  const scores = getInvesttechScores();
  const index = scores.findIndex(s => s.ticker === score.ticker);
  
  const updatedScore: InvesttechScore = {
    ...score,
    dateUpdated: new Date().toISOString(),
  };

  if (index !== -1) {
    scores[index] = updatedScore;
  } else {
    scores.push(updatedScore);
  }

  localStorage.setItem(STORAGE_KEYS.INVESTTECH_SCORES, JSON.stringify(scores));
}

export function bulkUpdateInvesttechScores(scores: Array<Omit<InvesttechScore, 'dateUpdated'>>): void {
  const existing = getInvesttechScores();
  const now = new Date().toISOString();

  for (const score of scores) {
    const index = existing.findIndex(s => s.ticker === score.ticker);
    const updatedScore: InvesttechScore = { ...score, dateUpdated: now };
    
    if (index !== -1) {
      existing[index] = updatedScore;
    } else {
      existing.push(updatedScore);
    }
  }

  localStorage.setItem(STORAGE_KEYS.INVESTTECH_SCORES, JSON.stringify(existing));
}

// ============ ANALYTICS & PERFORMANCE ============

export function calculateAnalystPerformance(source?: AnalystSource): AnalystPerformance[] {
  const recommendations = getAnalystRecommendations();
  const closedRecs = recommendations.filter(r => r.closed && r.closedPrice);

  // Group by source
  const sourceMap = new Map<AnalystSource, AnalystRecommendation[]>();
  
  for (const rec of closedRecs) {
    if (source && rec.source !== source) continue;
    
    const existing = sourceMap.get(rec.source) || [];
    existing.push(rec);
    sourceMap.set(rec.source, existing);
  }

  const results: AnalystPerformance[] = [];

  for (const [src, recs] of sourceMap) {
    let winCount = 0;
    let totalReturn = 0;
    let totalHoldingDays = 0;
    let bestPick: { ticker: string; return: number } | null = null;
    let worstPick: { ticker: string; return: number } | null = null;

    for (const rec of recs) {
      const returnPct = ((rec.closedPrice! - rec.priceAtRecommendation) / rec.priceAtRecommendation) * 100;
      
      // Adjust for SELG recommendations (profit is when price goes down)
      const adjustedReturn = rec.action === 'SELG' ? -returnPct : returnPct;
      
      if (adjustedReturn > 0) winCount++;
      totalReturn += adjustedReturn;

      // Calculate holding days
      const startDate = new Date(rec.dateRecommended);
      const endDate = new Date(rec.closedDate!);
      const holdingDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      totalHoldingDays += holdingDays;

      // Track best/worst
      if (!bestPick || adjustedReturn > bestPick.return) {
        bestPick = { ticker: rec.ticker, return: adjustedReturn };
      }
      if (!worstPick || adjustedReturn < worstPick.return) {
        worstPick = { ticker: rec.ticker, return: adjustedReturn };
      }
    }

    results.push({
      source: src,
      totalRecommendations: recs.length,
      winCount,
      lossCount: recs.length - winCount,
      winRate: recs.length > 0 ? (winCount / recs.length) * 100 : 0,
      avgReturn: recs.length > 0 ? totalReturn / recs.length : 0,
      bestPick,
      worstPick,
      avgHoldingDays: recs.length > 0 ? totalHoldingDays / recs.length : 0,
    });
  }

  return results.sort((a, b) => b.winRate - a.winRate);
}

// ============ CONSENSUS ANALYSIS ============

export interface ConsensusResult {
  ticker: string;
  stockName: string;
  recommendations: Array<{
    source: AnalystSource;
    action: RecommendationType;
    targetPrice?: number;
    date: string;
  }>;
  consensus: 'STERK_KJØP' | 'KJØP' | 'HOLD' | 'SELG' | 'STERK_SELG' | 'BLANDET';
  agreementLevel: number; // 0-100
  avgTargetPrice?: number;
}

export function getConsensusForStock(ticker: string): ConsensusResult | null {
  const recommendations = getAnalystRecommendations()
    .filter(r => r.ticker === ticker && !r.closed)
    .sort((a, b) => new Date(b.dateRecommended).getTime() - new Date(a.dateRecommended).getTime());

  if (recommendations.length === 0) return null;

  // Get latest recommendation from each source
  const latestBySource = new Map<AnalystSource, AnalystRecommendation>();
  for (const rec of recommendations) {
    if (!latestBySource.has(rec.source)) {
      latestBySource.set(rec.source, rec);
    }
  }

  const latest = Array.from(latestBySource.values());
  
  // Calculate consensus
  let buyCount = 0;
  let holdCount = 0;
  let sellCount = 0;
  let totalTargetPrice = 0;
  let targetPriceCount = 0;

  for (const rec of latest) {
    if (rec.action === 'KJØP') buyCount++;
    else if (rec.action === 'HOLD' || rec.action === 'BEHOLDES') holdCount++;
    else if (rec.action === 'SELG') sellCount++;

    if (rec.targetPrice) {
      totalTargetPrice += rec.targetPrice;
      targetPriceCount++;
    }
  }

  const total = latest.length;
  let consensus: ConsensusResult['consensus'] = 'BLANDET';
  let agreementLevel = 0;

  if (buyCount === total) {
    consensus = 'STERK_KJØP';
    agreementLevel = 100;
  } else if (buyCount > total * 0.7) {
    consensus = 'KJØP';
    agreementLevel = (buyCount / total) * 100;
  } else if (sellCount === total) {
    consensus = 'STERK_SELG';
    agreementLevel = 100;
  } else if (sellCount > total * 0.7) {
    consensus = 'SELG';
    agreementLevel = (sellCount / total) * 100;
  } else if (holdCount > total * 0.5) {
    consensus = 'HOLD';
    agreementLevel = (holdCount / total) * 100;
  } else {
    consensus = 'BLANDET';
    agreementLevel = Math.max(buyCount, holdCount, sellCount) / total * 100;
  }

  return {
    ticker,
    stockName: latest[0].stockName,
    recommendations: latest.map(r => ({
      source: r.source,
      action: r.action,
      targetPrice: r.targetPrice,
      date: r.dateRecommended,
    })),
    consensus,
    agreementLevel,
    avgTargetPrice: targetPriceCount > 0 ? totalTargetPrice / targetPriceCount : undefined,
  };
}

export function getAllConsensus(): ConsensusResult[] {
  const recommendations = getAnalystRecommendations().filter(r => !r.closed);
  const tickers = Array.from(new Set(recommendations.map(r => r.ticker)));
  
  return tickers
    .map(ticker => getConsensusForStock(ticker))
    .filter((c): c is ConsensusResult => c !== null)
    .sort((a, b) => {
      // Sort by consensus strength
      const order = { 'STERK_KJØP': 0, 'KJØP': 1, 'HOLD': 2, 'BLANDET': 3, 'SELG': 4, 'STERK_SELG': 5 };
      return order[a.consensus] - order[b.consensus];
    });
}
