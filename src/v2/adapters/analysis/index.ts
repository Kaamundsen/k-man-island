export type CoreCandidateInput = {
  symbol: string;
  asOfDate: string; // YYYY-MM-DD

  close: number;
  sma?: Record<string, number>;
  rsi?: number;
  avgDailyMove?: number;
  range52w?: { low: number; high: number };
};

export type AnalysisProvider = {
  getCoreCandidateInput: (symbol: string, asOfDate: string) => Promise<CoreCandidateInput>;
};
