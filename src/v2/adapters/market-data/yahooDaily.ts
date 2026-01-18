import type { DailyBar, MarketDataProvider } from "./index";
import { fetchHistoricalData } from "@/lib/api/historical-data";

export const yahooDailyProvider: MarketDataProvider = {
  async getDailyBars(symbol, _fromDate, _toDate) {
    // fetchHistoricalData uses years parameter, default to 2 years
    const history = await fetchHistoricalData(symbol, 2);
    if (!history) return [];
    
    return history.candles.map((r) => ({
      date: r.date,
      open: r.open,
      high: r.high,
      low: r.low,
      close: r.close,
      volume: r.volume,
    })) as DailyBar[];
  },
};
