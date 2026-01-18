import type { CoreEngineOutput } from "@/v2/core/core-engine/types";
import type { SlotManagerState, CoreSlot } from "./types";
import { getOpenSlots, addSlot } from "./index";

export function applyCoreOutputsToSlots(
  state: SlotManagerState,
  outputs: CoreEngineOutput[]
): SlotManagerState {
  let next = { ...state };

  // Prioriter høy score først
  const ranked = [...outputs]
    .filter(o => o.hardPass)
    .sort((a, b) => b.softScore - a.softScore);

  for (const o of ranked) {
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
