export * from "@/strategy-packs/legacy/api/stock-data-v2";

export async function fetchLiveStockData(ticker: string) {
  // Minimal kompatibilitets-wrapper for app/analyse/[ticker]
  // Bytt gjerne til ekte impl senere
  return {
    ticker,
    price: null,
    change: null,
    changePercent: null,
    updatedAt: new Date().toISOString(),
  };
}
