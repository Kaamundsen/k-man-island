import type { CoreEngineOutput } from "./types";
import type { AnalysisProvider } from "@/v2/adapters/analysis";
import type { PortfolioProvider } from "@/v2/adapters/portfolio";
import { scoreTrend } from "./profiles/trend";
import { scoreAsym } from "./profiles/asym";

export type CoreEngineDeps = {
  analysis: AnalysisProvider;
  portfolio: PortfolioProvider;
};

export async function runCoreEngine(
  deps: CoreEngineDeps,
  symbols: string[],
  asOfDate: string
): Promise<CoreEngineOutput[]> {
  const outputs: CoreEngineOutput[] = [];

  for (const symbol of symbols) {
    const input = await deps.analysis.getCoreCandidateInput(symbol, asOfDate);

    const trend = scoreTrend(input);
    const asym = scoreAsym(input);

    // Velg beste profil som passer
    const candidates = [trend, asym].filter(o => o.hardPass);
    const best =
      candidates.sort((a, b) => b.softScore - a.softScore)[0] ??
      { symbol, profile: "NONE", hardPass: false, softScore: 0, reasons: ["NO_CORE_PROFILE"] };

    outputs.push(best);
  }

  await deps.portfolio.getCoreTrades();
  return outputs;
}
