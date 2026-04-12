/**
 * Price Fetcher — daily OHLCV from Yahoo Finance → Supabase
 *
 * Designed for Vercel serverless (< 10 sec per batch).
 * Called by cron route with market='OSE' or market='US'.
 */

import { supabase } from '@/lib/supabase/client';

interface YahooCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Fetch OHLCV from Yahoo Finance for a single symbol.
 * Returns last N days of data.
 */
async function fetchYahooChart(symbol: string, days: number = 30): Promise<YahooCandle[]> {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (days * 24 * 60 * 60);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    console.error(`Yahoo error for ${symbol}: ${response.status}`);
    return [];
  }

  const data = await response.json();
  const result = data.chart?.result?.[0];

  if (!result?.timestamp) return [];

  const quotes = result.indicators?.quote?.[0];
  if (!quotes) return [];

  const candles: YahooCandle[] = [];

  for (let i = 0; i < result.timestamp.length; i++) {
    const o = quotes.open?.[i];
    const h = quotes.high?.[i];
    const l = quotes.low?.[i];
    const c = quotes.close?.[i];
    const v = quotes.volume?.[i];

    if (o != null && h != null && l != null && c != null) {
      candles.push({
        date: new Date(result.timestamp[i] * 1000).toISOString().split('T')[0],
        open: Math.round(o * 10000) / 10000,
        high: Math.round(h * 10000) / 10000,
        low: Math.round(l * 10000) / 10000,
        close: Math.round(c * 10000) / 10000,
        volume: v || 0,
      });
    }
  }

  return candles;
}

/**
 * Get the last stored date for a symbol (to avoid re-fetching)
 */
async function getLastStoredDate(symbol: string): Promise<string | null> {
  const { data } = await supabase
    .from('prices_daily')
    .select('date')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  return data?.date || null;
}

/**
 * Fetch and store prices for all symbols in a market.
 * Processes in batches to stay under Vercel timeout.
 */
export async function fetchPricesForMarket(
  market: 'OSE' | 'US',
  options: { fullHistory?: boolean; batchSize?: number } = {}
): Promise<{ success: number; failed: number; skipped: number; symbols: string[] }> {
  const { fullHistory = false, batchSize = 10 } = options;

  // Get active symbols for this market
  const { data: symbols, error } = await supabase
    .from('universe')
    .select('symbol')
    .eq('market', market)
    .eq('is_active', true);

  if (error || !symbols) {
    console.error('Failed to fetch universe:', error);
    return { success: 0, failed: 0, skipped: 0, symbols: [] };
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const processedSymbols: string[] = [];

  // Process in batches
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async ({ symbol }) => {
        // Check last stored date
        const lastDate = await getLastStoredDate(symbol);
        const today = new Date().toISOString().split('T')[0];

        if (lastDate === today && !fullHistory) {
          skipped++;
          return;
        }

        // Determine how many days to fetch
        let days = 30; // default: last 30 days (incremental)
        if (fullHistory || !lastDate) {
          days = 520; // ~2 years for full history
        } else {
          // Calculate days since last stored date
          const lastMs = new Date(lastDate).getTime();
          const nowMs = Date.now();
          days = Math.ceil((nowMs - lastMs) / (24 * 60 * 60 * 1000)) + 5; // +5 buffer
          days = Math.min(days, 520);
        }

        const candles = await fetchYahooChart(symbol, days);

        if (candles.length === 0) {
          failed++;
          return;
        }

        // Filter to only new data if we have existing
        const newCandles = lastDate
          ? candles.filter(c => c.date > lastDate)
          : candles;

        if (newCandles.length === 0) {
          skipped++;
          return;
        }

        // Upsert to Supabase
        const rows = newCandles.map(c => ({
          symbol,
          date: c.date,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));

        const { error: upsertError } = await supabase
          .from('prices_daily')
          .upsert(rows, { onConflict: 'symbol,date' });

        if (upsertError) {
          console.error(`Upsert error for ${symbol}:`, upsertError);
          failed++;
        } else {
          success++;
          processedSymbols.push(symbol);
          console.log(`✓ ${symbol}: +${newCandles.length} days`);
        }
      })
    );

    // Small delay between batches to be nice to Yahoo
    if (i + batchSize < symbols.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return { success, failed, skipped, symbols: processedSymbols };
}
