import type { PortfolioProvider, CoreTradeSnapshot } from "./index";
import { getTrades } from "@/lib/store";

export const legacyPortfolioProvider: PortfolioProvider = {
  async getCoreTrades(): Promise<CoreTradeSnapshot[]> {
    const trades: any[] = getTrades();

    return trades
      .filter(t => t.strategyId === "CORE" || t.portfolioType === "CORE")
      .map(t => ({
        id: t.id,
        symbol: t.symbol,
        entryPrice: t.entryPrice,
        stop: t.stop,
        openedAt: t.openedAt ?? t.createdAt,
      }));
  },
};
