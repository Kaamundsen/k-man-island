export const DEFAULT_CONFIG = {};

export interface KMomentumResult {
  passed: boolean;
  score: number;
  reasons: string[];
  rsi?: number;
  atr?: number;
  entry?: number;
  stop?: number;
  target?: number;
  signal?: 'BUY' | 'HOLD' | 'SELL';
}

export function analyzeKMomentum(
  _candles: unknown[],
  _currentPrice?: number,
  _config = DEFAULT_CONFIG
): KMomentumResult {
  return {
    passed: false,
    score: 0,
    reasons: [],
  };
}
