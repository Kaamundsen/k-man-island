import type { CoreEngineOutput } from "./types";
import type { AnalysisProvider } from "@/v2/adapters/analysis";
import type { PortfolioProvider } from "@/v2/adapters/portfolio";
import { scoreTrend } from "./profiles/trend";

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

    outputs.push(trend);
  }

  await deps.portfolio.getCoreTrades();
  return outputs;
}
