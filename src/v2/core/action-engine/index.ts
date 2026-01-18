import type { CoreDecision } from "./types";
import type { CoreEngineOutput } from "@/v2/core/core-engine/types";

export function decide(outputs: CoreEngineOutput[]): CoreDecision[] {
  // Enkelt foreløpig:
  // - hardPass + score >= 70 => ENTER (MED)
  // - hardPass + score < 70  => HOLD (LOW)
  // - ikke hardPass          => HOLD (LOW)

  return outputs.map(o => {
    if (o.hardPass && o.softScore >= 70) {
      return {
        symbol: o.symbol,
        action: "ENTER",
        priority: "MED",
        reasons: [...o.reasons, "SCORE_GE_70"],
        params: { profile: o.profile, score: o.softScore },
      };
    }

    return {
      symbol: o.symbol,
      action: "HOLD",
      priority: "LOW",
      reasons: o.hardPass ? [...o.reasons, "SCORE_LT_70"] : [...o.reasons],
      params: { profile: o.profile, score: o.softScore },
    };
  });
}
