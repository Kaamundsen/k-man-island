import type { AnalysisProvider, CoreCandidateInput } from "./index";
import { fetchLiveStockData } from "@/strategy-packs/legacy/api/stock-data";

export const legacyIndicatorsProvider: AnalysisProvider = {
  async getCoreCandidateInput(symbol: string, asOfDate: string): Promise<CoreCandidateInput> {
    const rows: any[] = await fetchLiveStockData();
    const quote = rows.find(r => r.symbol === symbol) ?? {};

    return {
      symbol,
      asOfDate,
      close: quote?.price ?? quote?.close ?? quote?.regularMarketPrice ?? 0,
      rsi: quote?.rsi,
      avgDailyMove: quote?.avgDailyMove,
      range52w: quote?.range52w,
      sma: quote?.sma,
    };
  },
};
