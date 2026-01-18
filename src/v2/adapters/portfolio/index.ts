export type CoreTradeSnapshot = {
  id: string;
  symbol: string;
  entryPrice: number;
  stop?: number;
  openedAt: string; // YYYY-MM-DD
};

export type PortfolioProvider = {
  getCoreTrades: () => Promise<CoreTradeSnapshot[]>;
};
