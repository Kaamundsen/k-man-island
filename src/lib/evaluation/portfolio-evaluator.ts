/**
 * Portfolio Evaluator
 * 
 * Daglig evaluering av alle posisjoner med anbefalinger
 */

import { Trade } from '../types';
import { getTrades, getPortfolios } from '../store';
import { STRATEGIES } from '../strategies';

export interface TradeEvaluation {
  trade: Trade;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  progressToTarget: number;
  progressToStop: number;
  daysHeld: number;
  daysRemaining: number;
  
  // Anbefalinger
  recommendation: 'HOLD' | 'TAKE_PROFIT' | 'ADD' | 'REDUCE' | 'CLOSE' | 'STOP_LOSS';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  
  // Varsler
  alerts: string[];
}

export interface PortfolioEvaluation {
  portfolioId: string;
  portfolioName: string;
  evaluations: TradeEvaluation[];
  
  // Aggregerte stats
  totalInvested: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  
  // Anbefalinger
  buyRecommendations: number;
  sellRecommendations: number;
  criticalAlerts: number;
}

export interface DailyReport {
  date: string;
  portfolios: PortfolioEvaluation[];
  
  // Totalt
  totalInvested: number;
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  
  // Viktige varsler
  criticalAlerts: {
    trade: Trade;
    alert: string;
  }[];
  
  // Top performers
  topGainers: TradeEvaluation[];
  topLosers: TradeEvaluation[];
  
  // Anbefalinger
  immediateActions: {
    action: string;
    trade: Trade;
    reason: string;
  }[];
}

export function evaluateTrade(
  trade: Trade, 
  currentPrice: number
): TradeEvaluation {
  const pnl = (currentPrice - trade.entryPrice) * trade.quantity;
  const pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
  
  // Progress calculations
  const targetRange = trade.target - trade.entryPrice;
  const currentGain = currentPrice - trade.entryPrice;
  const progressToTarget = targetRange > 0 ? (currentGain / targetRange) * 100 : 0;
  
  const stopRange = trade.entryPrice - trade.stopLoss;
  const currentLoss = trade.entryPrice - currentPrice;
  const progressToStop = stopRange > 0 && currentLoss > 0 ? (currentLoss / stopRange) * 100 : 0;
  
  // Time calculations
  const daysHeld = Math.floor(
    (Date.now() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.floor(
    (new Date(trade.timeHorizonEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  
  // Analyze and recommend
  const reasons: string[] = [];
  const alerts: string[] = [];
  let recommendation: TradeEvaluation['recommendation'] = 'HOLD';
  let urgency: TradeEvaluation['urgency'] = 'low';
  
  // === STOP LOSS CHECKS ===
  if (currentPrice <= trade.stopLoss) {
    recommendation = 'STOP_LOSS';
    urgency = 'critical';
    alerts.push('🚨 STOP LOSS UTLØST!');
    reasons.push(`Pris (${currentPrice.toFixed(2)}) har brutt under stop loss (${trade.stopLoss.toFixed(2)})`);
  } else if (progressToStop >= 90) {
    recommendation = 'CLOSE';
    urgency = 'critical';
    alerts.push('⚠️ Svært nær stop loss!');
    reasons.push(`Kun ${(100 - progressToStop).toFixed(0)}% igjen til stop loss`);
  } else if (progressToStop >= 70) {
    if (recommendation === 'HOLD') recommendation = 'REDUCE';
    urgency = 'high';
    reasons.push(`${progressToStop.toFixed(0)}% på vei mot stop loss`);
  }
  
  // === TARGET CHECKS ===
  if (currentPrice >= trade.target) {
    recommendation = 'TAKE_PROFIT';
    urgency = 'high';
    alerts.push('🎯 TARGET NÅDD!');
    reasons.push(`Pris (${currentPrice.toFixed(2)}) har nådd target (${trade.target.toFixed(2)})`);
  } else if (progressToTarget >= 90) {
    recommendation = 'TAKE_PROFIT';
    urgency = 'medium';
    reasons.push(`${progressToTarget.toFixed(0)}% mot target - vurder å sikre gevinst`);
  } else if (progressToTarget >= 70) {
    reasons.push(`Godt på vei (${progressToTarget.toFixed(0)}% mot target)`);
  }
  
  // === TIME CHECKS ===
  if (daysRemaining <= 0) {
    alerts.push('⏰ Tidshorisont utløpt!');
    if (urgency === 'low') urgency = 'medium';
    reasons.push(`Tidshorisont passert for ${Math.abs(daysRemaining)} dager siden`);
  } else if (daysRemaining <= 3) {
    if (urgency === 'low') urgency = 'medium';
    reasons.push(`Kun ${daysRemaining} dager igjen til tidsgrense`);
  }
  
  // === DEAD MONEY CHECK ===
  if (daysHeld >= 20 && Math.abs(pnlPercent) < 3) {
    alerts.push('💀 Dead money varsel');
    reasons.push(`${daysHeld} dager med minimal bevegelse (${pnlPercent.toFixed(1)}%)`);
    if (recommendation === 'HOLD' && daysRemaining <= 10) {
      recommendation = 'CLOSE';
      reasons.push('Vurder å frigjøre kapital');
    }
  }
  
  // === STRATEGY-SPECIFIC ===
  const strategy = STRATEGIES[trade.strategyId];
  if (strategy) {
    // Check if we're within expected holding period
    if (daysHeld > strategy.typicalHoldingDays.max) {
      reasons.push(`Over typisk holdetid for ${strategy.shortName} (${strategy.typicalHoldingDays.max} dager)`);
    }
    
    // Check if gain is within expected range
    if (pnlPercent > strategy.targetReturn.max) {
      alerts.push(`📈 Over forventet mål for ${strategy.shortName}!`);
    }
  }
  
  // Default if no issues
  if (reasons.length === 0) {
    if (pnlPercent > 0) {
      reasons.push('I pluss, fortsett å holde mot target');
    } else {
      reasons.push('Under entry, overvåk stop loss');
    }
  }
  
  return {
    trade,
    currentPrice,
    pnl,
    pnlPercent,
    progressToTarget: Math.max(0, progressToTarget),
    progressToStop: Math.max(0, progressToStop),
    daysHeld,
    daysRemaining,
    recommendation,
    urgency,
    reasons,
    alerts,
  };
}

export async function generateDailyReport(
  priceMap: Record<string, number>
): Promise<DailyReport> {
  const portfolios = getPortfolios();
  const allEvaluations: TradeEvaluation[] = [];
  const portfolioEvaluations: PortfolioEvaluation[] = [];
  
  for (const portfolio of portfolios) {
    const activeTrades = portfolio.trades.filter(t => t.status === 'ACTIVE');
    const evaluations: TradeEvaluation[] = [];
    
    for (const trade of activeTrades) {
      const price = priceMap[trade.ticker] || priceMap[trade.ticker.replace('.OL', '')] || trade.entryPrice;
      const evaluation = evaluateTrade(trade, price);
      evaluations.push(evaluation);
      allEvaluations.push(evaluation);
    }
    
    // Aggregate portfolio stats
    const totalInvested = activeTrades.reduce((sum, t) => sum + t.entryPrice * t.quantity, 0);
    const totalValue = evaluations.reduce((sum, e) => sum + e.currentPrice * e.trade.quantity, 0);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    
    portfolioEvaluations.push({
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      evaluations,
      totalInvested,
      totalValue,
      totalPnL,
      totalPnLPercent,
      buyRecommendations: evaluations.filter(e => e.recommendation === 'ADD').length,
      sellRecommendations: evaluations.filter(e => 
        ['TAKE_PROFIT', 'REDUCE', 'CLOSE', 'STOP_LOSS'].includes(e.recommendation)
      ).length,
      criticalAlerts: evaluations.filter(e => e.urgency === 'critical').length,
    });
  }
  
  // Total stats
  const totalInvested = portfolioEvaluations.reduce((sum, p) => sum + p.totalInvested, 0);
  const totalValue = portfolioEvaluations.reduce((sum, p) => sum + p.totalValue, 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  // Critical alerts
  const criticalAlerts = allEvaluations
    .filter(e => e.alerts.length > 0)
    .flatMap(e => e.alerts.map(alert => ({ trade: e.trade, alert })));
  
  // Top gainers/losers
  const sorted = [...allEvaluations].sort((a, b) => b.pnlPercent - a.pnlPercent);
  const topGainers = sorted.slice(0, 3).filter(e => e.pnlPercent > 0);
  const topLosers = sorted.slice(-3).reverse().filter(e => e.pnlPercent < 0);
  
  // Immediate actions needed
  const immediateActions = allEvaluations
    .filter(e => e.urgency === 'critical' || e.urgency === 'high')
    .map(e => ({
      action: e.recommendation,
      trade: e.trade,
      reason: e.reasons[0] || 'Handling anbefalt',
    }));
  
  return {
    date: new Date().toISOString(),
    portfolios: portfolioEvaluations,
    totalInvested,
    totalValue,
    totalPnL,
    totalPnLPercent,
    criticalAlerts,
    topGainers,
    topLosers,
    immediateActions,
  };
}

export function formatReportAsText(report: DailyReport): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push(`   K-MAN ISLAND - DAGLIG RAPPORT - ${new Date(report.date).toLocaleDateString('nb-NO')}`);
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  
  // Totalt
  lines.push('📊 TOTALT');
  lines.push(`   Investert: ${report.totalInvested.toFixed(0)} kr`);
  lines.push(`   Verdi nå:  ${report.totalValue.toFixed(0)} kr`);
  lines.push(`   P/L:       ${report.totalPnL >= 0 ? '+' : ''}${report.totalPnL.toFixed(0)} kr (${report.totalPnLPercent >= 0 ? '+' : ''}${report.totalPnLPercent.toFixed(1)}%)`);
  lines.push('');
  
  // Kritiske varsler
  if (report.criticalAlerts.length > 0) {
    lines.push('🚨 KRITISKE VARSLER');
    for (const { trade, alert } of report.criticalAlerts) {
      lines.push(`   ${trade.ticker}: ${alert}`);
    }
    lines.push('');
  }
  
  // Umiddelbare handlinger
  if (report.immediateActions.length > 0) {
    lines.push('⚡ UMIDDELBARE HANDLINGER');
    for (const action of report.immediateActions) {
      lines.push(`   ${action.action}: ${action.trade.ticker} - ${action.reason}`);
    }
    lines.push('');
  }
  
  // Top performers
  if (report.topGainers.length > 0) {
    lines.push('📈 BESTE POSISJONER');
    for (const e of report.topGainers) {
      lines.push(`   ${e.trade.ticker}: +${e.pnlPercent.toFixed(1)}% (+${e.pnl.toFixed(0)} kr)`);
    }
    lines.push('');
  }
  
  if (report.topLosers.length > 0) {
    lines.push('📉 SVAKESTE POSISJONER');
    for (const e of report.topLosers) {
      lines.push(`   ${e.trade.ticker}: ${e.pnlPercent.toFixed(1)}% (${e.pnl.toFixed(0)} kr)`);
    }
    lines.push('');
  }
  
  // Per portfolio
  for (const portfolio of report.portfolios) {
    if (portfolio.evaluations.length === 0) continue;
    
    lines.push(`───────────────────────────────────────────────────────────────`);
    lines.push(`📁 ${portfolio.portfolioName.toUpperCase()}`);
    lines.push(`   P/L: ${portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL.toFixed(0)} kr (${portfolio.totalPnLPercent >= 0 ? '+' : ''}${portfolio.totalPnLPercent.toFixed(1)}%)`);
    lines.push('');
    
    for (const e of portfolio.evaluations) {
      const arrow = e.pnlPercent >= 0 ? '↑' : '↓';
      lines.push(`   ${e.trade.ticker} ${arrow} ${e.pnlPercent >= 0 ? '+' : ''}${e.pnlPercent.toFixed(1)}% | ${e.recommendation}`);
      for (const reason of e.reasons.slice(0, 2)) {
        lines.push(`      └─ ${reason}`);
      }
    }
    lines.push('');
  }
  
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}
