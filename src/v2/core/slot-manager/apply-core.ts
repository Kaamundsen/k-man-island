import type { CoreEngineOutput } from "@/v2/core/core-engine/types";
import type { SlotManagerState, CoreSlot } from "./types";
import { getOpenSlots, addSlot } from "./index";

export function applyCoreOutputsToSlots(
  state: SlotManagerState,
  outputs: CoreEngineOutput[]
): SlotManagerState {
  let next = { ...state };

  for (const o of outputs) {
    if (o.profile === "NONE") continue;
    if (!o.hardPass) continue;
    if (getOpenSlots(next) <= 0) break;

    const slot: CoreSlot = {
      tradeId: `CORE-${o.symbol}`,
      symbol: o.symbol,
      openedAt: new Date().toISOString().slice(0, 10),
    };

    next = addSlot(next, slot);
  }

  return next;
}
