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
  strategies: ('MOMENTUM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND')[];
}

export interface Trade {
  id: string;
  ticker: string;
  entryPrice: number;
  quantity: number;
  entryDate: Date;
  portfolioId: string;
  stopLoss: number;
  target: number;
  timeHorizonEnd: Date;
  status: 'ACTIVE' | 'CLOSED' | 'STOPPED';
  deadMoneyWarning: boolean;
}

export interface Portfolio {
  id: string;
  name: string;
  strategyBucket: 'K-Momentum' | 'Legacy';
  trades: Trade[];
}
