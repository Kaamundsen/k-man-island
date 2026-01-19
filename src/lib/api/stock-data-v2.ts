/**
 * stock-data-v2.ts - Single ticker quote fetching
 * 
 * For fetching individual stock quotes (used by analyse/[ticker] pages).
 * For list fetching, use fetchLiveStockData from stock-data.ts
 */

export * from "@/strategy-packs/legacy/api/stock-data-v2";

/**
 * Fetch a single stock quote (for detail pages)
 * Different from fetchLiveStockData which fetches the full watchlist
 */
export async function fetchSingleStockQuote(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn(`Yahoo Finance error for ${ticker}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const quote = data.chart?.result?.[0];
    
    if (!quote || !quote.meta) {
      return null;
    }

    const meta = quote.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = previousClose ? (change / previousClose) * 100 : 0;

    return {
      ticker,
      price: currentPrice,
      change,
      changePercent,
      volume: meta.regularMarketVolume || 0,
      high52: meta.fiftyTwoWeekHigh,
      low52: meta.fiftyTwoWeekLow,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error);
    return null;
  }
}
