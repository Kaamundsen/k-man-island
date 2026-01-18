/**
 * Risk Metrics & Portfolio Analysis
 * 
 * Beregner:
 * - Portfolio Beta
 * - Value at Risk (VaR)
 * - Max Drawdown
 * - Sharpe Ratio
 * - Sector Concentration
 * - Correlation Analysis
 */

import { Trade, Stock } from '@/lib/types';
import { getSectorName } from '@/lib/data/sectors';

export interface PortfolioRiskMetrics {
  // Overall metrics
  totalValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  
  // Risk metrics
  portfolioBeta: number;
  valueAtRisk1Day: number;
  valueAtRisk1DayPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  
  // Concentration
  sectorConcentration: Array<{
    sector: string;
    weight: number;
    value: number;
    risk: 'low' | 'medium' | 'high';
  }>;
  topHoldings: Array<{
    ticker: string;
    name: string;
    weight: number;
    value: number;
  }>;
  
  // Correlation
  highCorrelationPairs: Array<{
    ticker1: string;
    ticker2: string;
    correlation: number;
  }>;
  
  // Risk level
  overallRiskLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskWarnings: string[];
  suggestions: string[];
}

export interface PositionSizing {
  ticker: string;
  currentPrice: number;
  stopLoss: number;
  target: number;
  riskPercent: number;
  portfolioValue: number;
  
  // Calculated
  recommendedShares: number;
  recommendedValue: number;
  maxLoss: number;
  potentialGain: number;
  riskRewardRatio: number;
  positionSizePercent: number;
}

// ============ Risk Calculations ============

export function calculatePortfolioRisk(
  trades: Trade[],
  stocks: Stock[],
  portfolioValue: number
): PortfolioRiskMetrics {
  const activeTrades = trades.filter(t => !t.exitPrice);
  const riskWarnings: string[] = [];
  const suggestions: string[] = [];

  // Calculate total value and P/L
  let totalInvested = 0;
  let totalCurrentValue = 0;
  const holdings: Array<{ trade: Trade; stock: Stock | undefined; value: number }> = [];

  for (const trade of activeTrades) {
    const stock = stocks.find(s => s.ticker === trade.ticker);
    const currentPrice = stock?.price || trade.entryPrice;
    const value = currentPrice * trade.quantity;
    
    totalInvested += trade.entryPrice * trade.quantity;
    totalCurrentValue += value;
    
    holdings.push({ trade, stock, value });
  }

  const unrealizedPnL = totalCurrentValue - totalInvested;
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  // Calculate sector concentration using our sector mapping
  const sectorMap = new Map<string, number>();
  for (const { trade, value } of holdings) {
    const sector = getSectorName(trade.ticker);
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
  }

  const sectorConcentration = Array.from(sectorMap.entries())
    .map(([sector, value]) => {
      const weight = totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0;
      let risk: 'low' | 'medium' | 'high' = 'low';
      if (weight > 40) risk = 'high';
      else if (weight > 25) risk = 'medium';
      return { sector, weight, value, risk };
    })
    .sort((a, b) => b.weight - a.weight);

  // Check for concentration warnings
  const highConcentration = sectorConcentration.filter(s => s.risk === 'high');
  if (highConcentration.length > 0) {
    riskWarnings.push(`Høy konsentrasjon i ${highConcentration.map(s => s.sector).join(', ')}`);
    suggestions.push('Vurder å diversifisere til andre sektorer');
  }

  // Top holdings
  const topHoldings = holdings
    .map(({ trade, stock, value }) => ({
      ticker: trade.ticker,
      name: stock?.name || trade.ticker,
      weight: totalCurrentValue > 0 ? (value / totalCurrentValue) * 100 : 0,
      value,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);

  // Single position concentration warning
  const largePositions = topHoldings.filter(h => h.weight > 20);
  if (largePositions.length > 0) {
    riskWarnings.push(`Store enkeltposisjoner: ${largePositions.map(p => `${p.ticker.replace('.OL', '')} (${p.weight.toFixed(1)}%)`).join(', ')}`);
  }

  // Portfolio Beta (simplified - based on average stock volatility)
  let totalBeta = 0;
  let betaCount = 0;
  for (const { stock, value } of holdings) {
    if (stock) {
      // Simplified beta calculation based on volatility proxy
      const volatilityProxy = Math.abs(stock.changePercent) * 0.1 + 1;
      const weight = totalCurrentValue > 0 ? value / totalCurrentValue : 0;
      totalBeta += volatilityProxy * weight;
      betaCount++;
    }
  }
  const portfolioBeta = betaCount > 0 ? totalBeta : 1;

  if (portfolioBeta > 1.3) {
    riskWarnings.push(`Høy portfolio beta (${portfolioBeta.toFixed(2)}) - mer volatil enn markedet`);
  }

  // Value at Risk (simplified 95% confidence, 1-day)
  // Using a simplified approach: 1.65 * daily volatility * portfolio value
  const avgDailyVolatility = 0.015; // 1.5% average daily vol for Oslo Børs
  const adjustedVolatility = avgDailyVolatility * portfolioBeta;
  const valueAtRisk1Day = 1.65 * adjustedVolatility * totalCurrentValue;
  const valueAtRisk1DayPercent = totalCurrentValue > 0 ? (valueAtRisk1Day / totalCurrentValue) * 100 : 0;

  // Max Drawdown (simplified - based on worst current P/L)
  let worstPnLPercent = 0;
  for (const { trade, stock } of holdings) {
    const currentPrice = stock?.price || trade.entryPrice;
    const pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
    if (pnlPercent < worstPnLPercent) {
      worstPnLPercent = pnlPercent;
    }
  }
  const maxDrawdown = Math.abs(worstPnLPercent);

  // Sharpe Ratio (simplified)
  // (Portfolio return - Risk-free rate) / Portfolio volatility
  const riskFreeRate = 0.04; // 4% annual
  const annualizedReturn = unrealizedPnLPercent * 4; // Assume quarterly data, annualize
  const portfolioVolatility = adjustedVolatility * Math.sqrt(252); // Annualized
  const sharpeRatio = portfolioVolatility > 0 
    ? (annualizedReturn / 100 - riskFreeRate) / portfolioVolatility 
    : 0;

  // Correlation analysis (simplified - based on sector)
  const highCorrelationPairs: PortfolioRiskMetrics['highCorrelationPairs'] = [];
  const tickersBySector = new Map<string, string[]>();
  
  for (const { trade } of holdings) {
    const sector = getSectorName(trade.ticker);
    const tickers = tickersBySector.get(sector) || [];
    tickers.push(trade.ticker);
    tickersBySector.set(sector, tickers);
  }

  for (const [sector, tickers] of tickersBySector) {
    if (tickers.length >= 2) {
      for (let i = 0; i < tickers.length - 1; i++) {
        for (let j = i + 1; j < tickers.length; j++) {
          highCorrelationPairs.push({
            ticker1: tickers[i],
            ticker2: tickers[j],
            correlation: 0.7 + Math.random() * 0.25, // Simulated high correlation for same sector
          });
        }
      }
    }
  }

  if (highCorrelationPairs.length > 3) {
    riskWarnings.push(`${highCorrelationPairs.length} aksjepar med høy korrelasjon`);
    suggestions.push('Diversifiser på tvers av sektorer for å redusere korrelert risiko');
  }

  // Overall risk level
  let overallRiskLevel: PortfolioRiskMetrics['overallRiskLevel'] = 'low';
  const riskScore = 
    (portfolioBeta > 1.3 ? 2 : portfolioBeta > 1.1 ? 1 : 0) +
    (valueAtRisk1DayPercent > 3 ? 2 : valueAtRisk1DayPercent > 2 ? 1 : 0) +
    (highConcentration.length > 0 ? 2 : 0) +
    (largePositions.length > 2 ? 1 : 0);

  if (riskScore >= 5) overallRiskLevel = 'very_high';
  else if (riskScore >= 3) overallRiskLevel = 'high';
  else if (riskScore >= 1) overallRiskLevel = 'medium';

  // General suggestions
  if (activeTrades.length < 5) {
    suggestions.push('Vurder å øke antall posisjoner for bedre diversifisering');
  }
  if (sharpeRatio < 0.5 && unrealizedPnL > 0) {
    suggestions.push('Avkastningen kompenserer ikke fullt for risikoen');
  }

  return {
    totalValue: totalCurrentValue,
    totalInvested,
    unrealizedPnL,
    unrealizedPnLPercent,
    portfolioBeta,
    valueAtRisk1Day,
    valueAtRisk1DayPercent,
    maxDrawdown,
    sharpeRatio,
    sectorConcentration,
    topHoldings,
    highCorrelationPairs: highCorrelationPairs.slice(0, 5),
    overallRiskLevel,
    riskWarnings,
    suggestions,
  };
}

// ============ Position Sizing Calculator ============

export function calculatePositionSize(params: {
  ticker: string;
  currentPrice: number;
  stopLoss: number;
  target: number;
  portfolioValue: number;
  maxRiskPercent?: number; // Default 2%
}): PositionSizing {
  const { ticker, currentPrice, stopLoss, target, portfolioValue, maxRiskPercent = 2 } = params;

  // Risk per share
  const riskPerShare = currentPrice - stopLoss;
  const riskPercent = (riskPerShare / currentPrice) * 100;

  // Maximum loss allowed
  const maxLossAllowed = portfolioValue * (maxRiskPercent / 100);

  // Recommended number of shares
  const recommendedShares = riskPerShare > 0 
    ? Math.floor(maxLossAllowed / riskPerShare)
    : 0;

  // Position value
  const recommendedValue = recommendedShares * currentPrice;
  const positionSizePercent = (recommendedValue / portfolioValue) * 100;

  // Max loss for this position
  const maxLoss = recommendedShares * riskPerShare;

  // Potential gain
  const gainPerShare = target - currentPrice;
  const potentialGain = recommendedShares * gainPerShare;

  // Risk/Reward ratio
  const riskRewardRatio = riskPerShare > 0 ? gainPerShare / riskPerShare : 0;

  return {
    ticker,
    currentPrice,
    stopLoss,
    target,
    riskPercent,
    portfolioValue,
    recommendedShares,
    recommendedValue,
    maxLoss,
    potentialGain,
    riskRewardRatio,
    positionSizePercent,
  };
}

// ============ Export Utilities ============

export function exportToCSV(data: any[], filename: string): void {
  if (typeof window === 'undefined' || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(h => {
        const value = row[h];
        if (typeof value === 'number') return value.toString().replace('.', ',');
        if (typeof value === 'string') return `"${value}"`;
        return value;
      }).join(';')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportPortfolioToCSV(trades: Trade[], stocks: Stock[]): void {
  const data = trades.map(trade => {
    const stock = stocks.find(s => s.ticker === trade.ticker);
    const currentPrice = stock?.price || trade.entryPrice;
    const pnl = (currentPrice - trade.entryPrice) * trade.quantity;
    const pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
    const sector = getSectorName(trade.ticker);

    return {
      Ticker: trade.ticker.replace('.OL', ''),
      Navn: stock?.name || trade.ticker,
      Sektor: sector,
      Antall: trade.quantity,
      Kjøpspris: trade.entryPrice,
      Nåværende: currentPrice,
      'P/L kr': pnl,
      'P/L %': pnlPercent,
      Strategi: trade.strategyId || '',
      Portefølje: trade.portfolioId || '',
      Dato: trade.entryDate,
      StopLoss: trade.stopLoss || '',
      Target: trade.target || '',
    };
  });

  exportToCSV(data, 'portefolje');
}
