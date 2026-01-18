import type { CoreEngineOutput } from "../types";
import type { CoreCandidateInput } from "@/v2/adapters/analysis";

export function scoreTrend(input: CoreCandidateInput): CoreEngineOutput {
  const reasons: string[] = [];

  if (!input.sma || !input.close) {
    return {
      symbol: input.symbol,
      profile: "NONE",
      hardPass: false,
      softScore: 0,
      reasons,
    };
  }

  const sma50 = input.sma["50"];
  const sma200 = input.sma["200"];

  if (!sma50 || !sma200) {
    return {
      symbol: input.symbol,
      profile: "NONE",
      hardPass: false,
      softScore: 0,
      reasons,
    };
  }

  const above50 = input.close > sma50;
  const above200 = input.close > sma200;

  if (!above50 || !above200) {
    return {
      symbol: input.symbol,
      profile: "NONE",
      hardPass: false,
      softScore: 0,
      reasons,
    };
  }

  reasons.push("ABOVE_SMA50", "ABOVE_SMA200");

  let score = 50;
  if (input.rsi && input.rsi > 55) score += 10;
  if (input.rsi && input.rsi < 70) score += 10;
  if (input.avgDailyMove && input.avgDailyMove > 1.5) score += 10;

  return {
    symbol: input.symbol,
    profile: "TREND",
    hardPass: true,
    softScore: Math.min(100, score),
    reasons,
  };
}
