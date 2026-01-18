export type DailyBar = {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type MarketDataProvider = {
  getDailyBars: (
    symbol: string,
    fromDate: string,
    toDate: string
  ) => Promise<DailyBar[]>;
};
