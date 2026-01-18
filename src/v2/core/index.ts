import { runCoreEngine } from "@/v2/core/core-engine";
import { initSlotManager } from "@/v2/core/slot-manager";
import { applyCoreOutputsToSlots } from "@/v2/core/slot-manager/apply-core";
import { decide } from "@/v2/core/action-engine";
import { renderCoreBrief } from "@/v2/core/core-brief";

import { legacyIndicatorsProvider } from "@/v2/adapters/analysis/legacyIndicators";
import { legacyPortfolioProvider } from "@/v2/adapters/portfolio/legacyPortfolio";

import { cacheGet, cacheSet, makeCoreCacheKey } from "@/v2/core/cache";

export async function runV2Core(symbols: string[], asOfDate: string) {
  const version = "v2-stub";
  const universeHash = symbols.join("|");
  const key = makeCoreCacheKey(asOfDate, version, universeHash);

  const cached = cacheGet<any>(key);
  if (cached) return cached;

  const outputs = await runCoreEngine(
    {
      analysis: legacyIndicatorsProvider,
      portfolio: legacyPortfolioProvider,
    },
    symbols,
    asOfDate
  );

  let slots = initSlotManager(5);
  slots = applyCoreOutputsToSlots(slots, outputs);

  const decisions = decide(outputs);
  const brief = renderCoreBrief(asOfDate, decisions);

  const result = { outputs, slots, decisions, brief };
  cacheSet(key, result);
  return result;
}
