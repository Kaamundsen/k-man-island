import { runCoreEngine } from "./index";
import { legacyIndicatorsProvider } from "@/v2/adapters/analysis/legacyIndicators";
import { legacyPortfolioProvider } from "@/v2/adapters/portfolio/legacyPortfolio";

export async function devRunCoreEngine() {
  const asOfDate = new Date().toISOString().slice(0, 10);
  const symbols = ["AAPL", "MSFT"];

  return runCoreEngine(
    {
      analysis: legacyIndicatorsProvider,
      portfolio: legacyPortfolioProvider,
    },
    symbols,
    asOfDate
  );
}
