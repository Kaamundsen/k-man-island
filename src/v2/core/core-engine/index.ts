import type { CoreEngineOutput } from "./types";
import type { AnalysisProvider } from "@/v2/adapters/analysis";
import type { PortfolioProvider } from "@/v2/adapters/portfolio";

export type CoreEngineDeps = {
  analysis: AnalysisProvider;
  portfolio: PortfolioProvider;
};

export async function runCoreEngine(
  deps: CoreEngineDeps,
  symbols: string[],
  asOfDate: string
): Promise<CoreEngineOutput[]> {
  // TODO: implement TREND + ASYM scoring (next)
  // For now: just return NONE for each symbol (wiring test)
  const outputs: CoreEngineOutput[] = [];

  for (const symbol of symbols) {
    await deps.analysis.getCoreCandidateInput(symbol, asOfDate);
    outputs.push({
      symbol,
      profile: "NONE",
      hardPass: false,
      softScore: 0,
      reasons: ["NOT_IMPLEMENTED"],
    });
  }

  // Ensure we can read portfolio too (wiring test)
  await deps.portfolio.getCoreTrades();

  return outputs;
}
