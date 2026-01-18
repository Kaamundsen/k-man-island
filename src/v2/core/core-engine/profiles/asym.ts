import type { CoreEngineOutput } from "../types";
import type { CoreCandidateInput } from "@/v2/adapters/analysis";

export function scoreAsym(input: CoreCandidateInput): CoreEngineOutput {
  const reasons: string[] = [];

  if (!input.close) {
    return { symbol: input.symbol, profile: "NONE", hardPass: false, softScore: 0, reasons: ["MISSING_CLOSE"] };
  }

  // Hard filters (enkle)
  if (!input.range52w) {
    return { symbol: input.symbol, profile: "NONE", hardPass: false, softScore: 0, reasons: ["MISSING_52W"] };
  }

  const { low, high } = input.range52w;
  if (!low || !high || high <= low) {
    return { symbol: input.symbol, profile: "NONE", hardPass: false, softScore: 0, reasons: ["BAD_52W"] };
  }

  // ASYM idea: nær lows (kontrollert downside) + tegn til momentum
  const pos = (input.close - low) / (high - low); // 0..1
  const nearLow = pos <= 0.35;

  if (!nearLow) {
    return { symbol: input.symbol, profile: "NONE", hardPass: flse, softScore: 0, reasons: ["NOT_ASYM_ZONE"] };
  }

  reasons.push("NEAR_52W_LOW");

  // Soft score
  let score = 50;
  if (input.rsi && input.rsi > 45) score += 10; // ikke for svak
  if (input.rsi && input.rsi < 65) score += 10; // ikke overstrekt
  if (input.avgDailyMove && input.avgDailyMove > 1.5) score += 10;

  return {
    symbol: input.symbol,
    profile: "ASYM",
    hardPass: true,
    softScore: Math.min(100, score),
    reasons,
  };
}
