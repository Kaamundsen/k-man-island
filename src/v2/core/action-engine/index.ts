import type { CoreDecision } from "./types";
import type { CoreEngineOutput } from "@/v2/core/core-engine/types";

export function decide(outputs: CoreEngineOutput[]): CoreDecision[] {
  // TODO: real rules later (20)
  return outputs.map(o => ({
    symbol: o.symbol,
    action: "HOLD",
    priority: "LOW",
    reasons: ["NOT_IMPLEMENTED"],
  }));
}
