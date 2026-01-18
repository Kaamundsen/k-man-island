import { runCoreEngine } from "@/v2/core/core-engine";
import { initSlotManager, getOpenSlots } from "@/v2/core/slot-manager";
import { applyCoreOutputsToSlots } from "@/v2/core/slot-manager/apply-core";
import { decide } from "@/v2/core/action-engine";
import { renderCoreBrief } from "@/v2/core/core-brief";

import { legacyIndicatorsProvider } from "@/v2/adapters/analysis/legacyIndicators";
import { legacyPortfolioProvider } from "@/v2/adapters/portfolio/legacyPortfolio";

export async function runV2Core(symbols: string[], asOfDate: string) {
  // 1) CORE engine
  const outputs = await runCoreEngine(
    {
      analysis: legacyIndicatorsProvider,
      portfolio: legacyPortfolioProvider,
    },
    symbols,
    asOfDate
  );

  // 2) Slots
  let slots = initSlotManager(5);
  slots = applyCoreOutputsToSlots(slots, outputs);

  // 3) Actions
  const decisions = decide(outputs);

  // 4) Brief
  const brief = renderCoreBrief(asOfDate, decisions);

  return {
    outputs,
    slots,
    decisions,
    brief,
  };
}
