/**
 * Portfolio Evaluation Module
 * 
 * Analyserer porteføljen og gir daglige anbefalinger.
 */

import { Trade } from '../types';
import { StockAnalysisProfile } from '../api/historical-data';

export type Recommendation = 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';

export interface TradeEvaluation {
  trade: Trade;
  currentPrice: number;
  
  // P/L
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  
  // Progress
  progressToTarget: number;      // 0-100%, kan være over 100
  progressToStop: number;        // 0-100%, 100 = stoppet ut
  daysHeld: number;
  daysToDeadline: number;
  
  // Recommendation
  recommendation: Recommendation;
  reasons: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  
  // Warnings
  warnings: string[];
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  unrealizedPnL: number;
  totalTrades: number;
  winRate: number;
  
  tradesAtTarget: number;
  tradesAtRisk: number;
  tradesOverdue: number;
  
  recommendations: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  
  topPriority: TradeEvaluation | null;
}

/**
 * Evaluer en enkelt trade
 */
export function evaluateTrade(
  trade: Trade,
  currentPrice: number,
  profile?: StockAnalysisProfile
): TradeEvaluation {
  const entryValue = trade.entryPrice * trade.quantity;
  const currentValue = currentPrice * trade.quantity;
  const unrealizedPnL = currentValue - entryValue;
  const unrealizedPnLPercent = (unrealizedPnL / entryValue) * 100;
  
  // Progress calculations
  const targetRange = trade.target - trade.entryPrice;
  const currentProgress = currentPrice - trade.entryPrice;
  const progressToTarget = targetRange > 0 ? (currentProgress / targetRange) * 100 : 0;
  
  const stopRange = trade.entryPrice - trade.stopLoss;
  const stopProgress = trade.entryPrice - currentPrice;
  const progressToStop = stopRange > 0 ? Math.max(0, (stopProgress / stopRange) * 100) : 0;
  
  // Days calculations
  const now = new Date();
  const entryDate = new Date(trade.entryDate);
  const deadlineDate = new Date(trade.timeHorizonEnd);
  const daysHeld = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysToDeadline = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Build recommendation
  const reasons: string[] = [];
  const warnings: string[] = [];
  let recommendation: Recommendation = 'HOLD';
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // --- SELL CONDITIONS ---
  
  // At or above target
  if (progressToTarget >= 100) {
    recommendation = 'STRONG_SELL';
    reasons.push(`✅ Target nådd! Opp ${unrealizedPnLPercent.toFixed(1)}%`);
    urgency = 'high';
  }
  // Near target (>80%)
  else if (progressToTarget >= 80) {
    recommendation = 'SELL';
    reasons.push(`🎯 Nær target (${progressToTarget.toFixed(0)}%), vurder å ta gevinst`);
    urgency = 'medium';
  }
  // At or below stop
  else if (currentPrice <= trade.stopLoss) {
    recommendation = 'STRONG_SELL';
    reasons.push(`🛑 STOP LOSS TRIGGET! Selg umiddelbart`);
    urgency = 'critical';
  }
  // Near stop (>60% of way to stop)
  else if (progressToStop >= 60) {
    recommendation = 'SELL';
    reasons.push(`⚠️ Nær stop loss (${progressToStop.toFixed(0)}% ned mot stop)`);
    warnings.push('Vurder å kutte tap før stop');
    urgency = 'high';
  }
  // Overdue (past deadline)
  else if (daysToDeadline < 0) {
    recommendation = 'SELL';
    reasons.push(`⏰ Over tidsfristen med ${Math.abs(daysToDeadline)} dager`);
    warnings.push('Dead money - kapital bundet opp for lenge');
    urgency = 'medium';
  }
  
  // --- HOLD CONDITIONS ---
  
  // Making progress
  else if (progressToTarget >= 30 && progressToTarget < 80) {
    recommendation = 'HOLD';
    reasons.push(`📈 God progresjon (${progressToTarget.toFixed(0)}% mot target)`);
    
    if (daysToDeadline < 7) {
      warnings.push(`Kun ${daysToDeadline} dager igjen av tidshorisonten`);
      urgency = 'medium';
    }
  }
  // Flat/slightly negative but within bounds
  else if (unrealizedPnLPercent > -5 && progressToStop < 30) {
    recommendation = 'HOLD';
    reasons.push('Posisjon er stabil, avventer signal');
  }
  
  // --- BUY MORE CONDITIONS ---
  
  // Profitable and momentum (if we have profile data)
  else if (profile && unrealizedPnLPercent > 5 && profile.return1m > 0) {
    recommendation = 'BUY';
    reasons.push(`💪 Sterk momentum, vurder å øke posisjon`);
  }
  
  // --- WARNING CONDITIONS ---
  
  // Long hold without progress
  if (daysHeld > 30 && progressToTarget < 20) {
    warnings.push(`Holdt i ${daysHeld} dager uten vesentlig fremgang`);
    if (recommendation === 'HOLD') urgency = 'medium';
  }
  
  // Approaching deadline
  if (daysToDeadline > 0 && daysToDeadline < 5 && progressToTarget < 50) {
    warnings.push(`Tidsfrist nærmer seg, kun ${daysToDeadline} dager igjen`);
    if (urgency === 'low') urgency = 'medium';
  }
  
  // Profile-based warnings
  if (profile) {
    // Seasonal warning
    const currentMonth = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'][new Date().getMonth()];
    const isWorstMonth = profile.worstMonths.some(m => m.month === currentMonth);
    if (isWorstMonth) {
      warnings.push(`${currentMonth.toUpperCase()} er historisk svak måned for denne aksjen`);
    }
    
    // Momentum warning
    if (profile.return1m < -10) {
      warnings.push(`Svak momentum siste måned (${profile.return1m.toFixed(1)}%)`);
    }
  }
  
  return {
    trade,
    currentPrice,
    unrealizedPnL,
    unrealizedPnLPercent,
    progressToTarget,
    progressToStop,
    daysHeld,
    daysToDeadline,
    recommendation,
    reasons,
    urgency,
    warnings,
  };
}

/**
 * Evaluer hele porteføljen
 */
export function evaluatePortfolio(
  trades: Trade[],
  prices: Record<string, number>,
  profiles?: Record<string, StockAnalysisProfile>
): { evaluations: TradeEvaluation[]; summary: PortfolioSummary } {
  
  const activeTrades = trades.filter(t => t.status === 'ACTIVE');
  
  const evaluations = activeTrades.map(trade => {
    const currentPrice = prices[trade.ticker] || trade.entryPrice;
    const profile = profiles?.[trade.ticker];
    return evaluateTrade(trade, currentPrice, profile);
  });
  
  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  evaluations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
  
  // Calculate summary
  let totalInvested = 0;
  let currentValue = 0;
  
  evaluations.forEach(e => {
    totalInvested += e.trade.entryPrice * e.trade.quantity;
    currentValue += e.currentPrice * e.trade.quantity;
  });
  
  const totalPnL = currentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  
  // Calculate win rate from closed trades
  const closedTrades = trades.filter(t => t.status !== 'ACTIVE');
  const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const summary: PortfolioSummary = {
    totalInvested,
    currentValue,
    totalPnL,
    totalPnLPercent,
    unrealizedPnL: totalPnL,
    totalTrades: activeTrades.length,
    winRate,
    tradesAtTarget: evaluations.filter(e => e.progressToTarget >= 80).length,
    tradesAtRisk: evaluations.filter(e => e.progressToStop >= 50).length,
    tradesOverdue: evaluations.filter(e => e.daysToDeadline < 0).length,
    recommendations: {
      strongBuy: evaluations.filter(e => e.recommendation === 'STRONG_BUY').length,
      buy: evaluations.filter(e => e.recommendation === 'BUY').length,
      hold: evaluations.filter(e => e.recommendation === 'HOLD').length,
      sell: evaluations.filter(e => e.recommendation === 'SELL').length,
      strongSell: evaluations.filter(e => e.recommendation === 'STRONG_SELL').length,
    },
    topPriority: evaluations.length > 0 ? evaluations[0] : null,
  };
  
  return { evaluations, summary };
}

/**
 * Generer daglig rapport-tekst
 */
export function generateDailyReport(
  summary: PortfolioSummary,
  evaluations: TradeEvaluation[]
): string {
  const lines: string[] = [];
  const today = new Date().toLocaleDateString('nb-NO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  lines.push(`# Daglig Porteføljerapport`);
  lines.push(`*${today}*`);
  lines.push('');
  
  // Overall status
  const statusEmoji = summary.totalPnLPercent >= 0 ? '📈' : '📉';
  lines.push(`## ${statusEmoji} Totalstatus`);
  lines.push(`- Investert: ${summary.totalInvested.toLocaleString('nb-NO')} kr`);
  lines.push(`- Nåværende verdi: ${summary.currentValue.toLocaleString('nb-NO')} kr`);
  lines.push(`- P/L: ${summary.totalPnL >= 0 ? '+' : ''}${summary.totalPnL.toLocaleString('nb-NO')} kr (${summary.totalPnLPercent >= 0 ? '+' : ''}${summary.totalPnLPercent.toFixed(1)}%)`);
  lines.push('');
  
  // Urgent actions
  const urgent = evaluations.filter(e => e.urgency === 'critical' || e.urgency === 'high');
  if (urgent.length > 0) {
    lines.push(`## 🚨 Krever handling (${urgent.length})`);
    urgent.forEach(e => {
      lines.push(`### ${e.trade.ticker}`);
      lines.push(`- Anbefaling: **${e.recommendation}**`);
      e.reasons.forEach(r => lines.push(`- ${r}`));
      e.warnings.forEach(w => lines.push(`- ⚠️ ${w}`));
      lines.push('');
    });
  }
  
  // Warnings
  const warnings = evaluations.filter(e => e.warnings.length > 0 && e.urgency === 'medium');
  if (warnings.length > 0) {
    lines.push(`## ⚠️ Advarsler (${warnings.length})`);
    warnings.forEach(e => {
      lines.push(`- **${e.trade.ticker}**: ${e.warnings.join(', ')}`);
    });
    lines.push('');
  }
  
  // Summary stats
  lines.push(`## 📊 Oppsummering`);
  lines.push(`- Trades ved target: ${summary.tradesAtTarget}`);
  lines.push(`- Trades i risikosonen: ${summary.tradesAtRisk}`);
  lines.push(`- Trades over tidsfrist: ${summary.tradesOverdue}`);
  lines.push('');
  
  // Recommendation breakdown
  lines.push(`## 📋 Anbefalinger`);
  if (summary.recommendations.strongSell > 0) lines.push(`- 🔴 SELG NÅ: ${summary.recommendations.strongSell}`);
  if (summary.recommendations.sell > 0) lines.push(`- 🟠 Selg: ${summary.recommendations.sell}`);
  if (summary.recommendations.hold > 0) lines.push(`- 🟡 Hold: ${summary.recommendations.hold}`);
  if (summary.recommendations.buy > 0) lines.push(`- 🟢 Kjøp mer: ${summary.recommendations.buy}`);
  
  return lines.join('\n');
}
