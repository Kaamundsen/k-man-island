import type { DailyBar, MarketDataProvider } from "./index";
import { fetchHistoricalData } from "@/lib/api/historical-data"; // juster hvis funksjonsnavn avviker

export const yahooDailyProvider: MarketDataProvider = {
  async getDailyBars(symbol, fromDate, toDate) {
    const rows = await fetchHistoricalData(symbol, fromDate, toDate, "1d");
    return rows.map((r: any) => ({
      date: r.date,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
    })) as DailyBar[];
  },
};
