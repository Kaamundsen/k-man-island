import { StrategyId, StrategyEvaluation } from './strategies';

export type StockStrategy = 'MOMENTUM' | 'MOMENTUM_TREND' | 'MOMENTUM_ASYM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND' | 'INSIDER';

export interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  kScore: number;
  rsi: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
  target: number;
  stopLoss: number;
  gainKr: number;
  gainPercent: number;
  riskKr: number;
  riskPercent: number;
  timeHorizon: string;
  market: 'OSLO' | 'USA';
  strategies: StockStrategy[];
  insiderScore?: number;
  insiderBuys?: number;
  insiderNetShares?: number;
  sector?: string;
  marketCap?: number;
  dividendYield?: number;
  // Data quality flags
  dataSource?: 'yahoo' | 'finnhub' | 'fallback';
  historyDays?: number;
  insufficientHistory?: boolean;
  // Strategy evaluations (V2)
  strategyEvaluations?: StrategyEvaluation[];
  // Recent purchase flag for prioritization boost
  recentPurchase?: boolean | Date;
}

export interface Trade {
  id: string;
  ticker: string;
  name?: string;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  portfolioId: string;
  strategyId: StrategyId;
  stopLoss: number;
  target: number;
  timeHorizonEnd: Date;
  status: 'ACTIVE' | 'CLOSED' | 'STOPPED';
  deadMoneyWarning: boolean;
  daysHeld?: number;
  notes?: string;
  exitPrice?: number;
  exitDate?: Date;
  exitReason?: string;
  realizedPnL?: number;
  realizedPnLPercent?: number;
  currentPrice?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TradeInput {
  ticker: string;
  name?: string;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  portfolioId: string;
  strategyId: StrategyId;
  stopLoss: number;
  target: number;
  timeHorizonEnd: Date;
  notes?: string;
}

export interface TradeUpdate {
  id: string;
  ticker?: string;
  name?: string;
  entryPrice?: number;
  quantity?: number;
  entryDate?: Date;
  portfolioId?: string;
  strategyId?: StrategyId;
  stopLoss?: number;
  target?: number;
  timeHorizonEnd?: Date;
  status?: 'ACTIVE' | 'CLOSED' | 'STOPPED';
  exitPrice?: number;
  exitDate?: Date;
  exitReason?: string;
  notes?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  strategyId?: StrategyId;
  allowedStrategies?: StrategyId[];
  trades: Trade[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Dividend {
  id: string;
  ticker: string;
  name?: string;
  date: Date;
  quantity: number;
  dividendPerShare: number;
  totalAmount: number;
  currency: string;
  source?: 'NORDNET' | 'MANUAL';
  createdAt?: Date;
}

export interface DividendInput {
  ticker: string;
  name?: string;
  date: Date | string;
  quantity: number;
  dividendPerShare: number;
  totalAmount: number;
  currency?: string;
}

export interface DividendSummary {
  ticker: string;
  name?: string;
  totalDividends: number;
  dividendCount: number;
  avgDividendPerShare: number;
  lastDividendDate?: Date;
}
