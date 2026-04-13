/**
 * Price Fetcher — daily OHLCV from Yahoo Finance → Supabase
 *
 * Designed for Vercel serverless (< 10 sec per batch).
 * Uses single DB query to find which symbols need updating (fast).
 */

import { getSupabase } from '@/lib/supabase/client';

interface YahooCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

function getLastTradingDay(): string {
  const now = new Date();
  const day = now.getDay();
  if (day === 0) now.setDate(now.getDate() - 2);
  else if (day === 6) now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

/**
 * Fetch and store prices for one batch of symbols.
 * Uses ONE SQL query to find symbols needing updates (instead of 287 individual queries).
 */
export async function fetchPricesForMarket(
  market: 'OSE' | 'US',
  options: { fullHistory?: boolean; batchSize?: number } = {}
): Promise<{
  success: number;
  failed: number;
  skipped: number;
  total: number;
  remaining: number;
  failedSymbols: string[];
  symbols: string[];
}> {
  const { fullHistory = false, batchSize = 5 } = options;
  const lastTradingDay = getLastTradingDay();

  // ONE query: get all active symbols + their latest price date
  const { data: symbolsWithDates, error } = await getSupabase()
    .rpc('get_symbols_needing_update', { p_market: market, p_since: lastTradingDay });

  // Fallback if RPC doesn't exist yet: use raw query
  let needsUpdate: { symbol: string; last_date: string | null }[] = [];
  let totalActive = 0;

  if (error || !symbolsWithDates) {
    // Fallback: two simple queries instead of 287
    const { data: allSymbols } = await getSupabase()
      .from('universe')
      .select('symbol')
      .eq('market', market)
      .eq('is_active', true);

    if (!allSymbols) {
      return { success: 0, failed: 0, skipped: 0, total: 0, remaining: 0, failedSymbols: [], symbols: [] };
    }

    totalActive = allSymbols.length;

    // Get symbols that already have recent data (one query)
    const { data: upToDate } = await getSupabase()
      .from('prices_daily')
      .select('symbol')
      .gte('date', lastTradingDay)
      .in('symbol', allSymbols.map(s => s.symbol));

    const upToDateSet = new Set((upToDate || []).map(r => r.symbol));

    needsUpdate = allSymbols
      .filter(s => !upToDateSet.has(s.symbol) || fullHistory)
      .map(s => ({ symbol: s.symbol, last_date: null }));
  } else {
    needsUpdate = symbolsWithDates;
    // Count total from universe
    const { count } = await getSupabase()
      .from('universe')
      .select('symbol', { count: 'exact', head: true })
      .eq('market', market)
      .eq('is_active', true);
    totalActive = count || 0;
  }

  const total = totalActive;
  const skipped = total - needsUpdate.length;
  let success = 0;
  let failed = 0;
  const processedSymbols: string[] = [];
  const failedSymbols: string[] = [];

  // Take one batch
  const batch = needsUpdate.slice(0, batchSize);
  const remaining = Math.max(0, needsUpdate.length - batch.length);

  // Fetch prices for this batch
  await Promise.allSettled(
    batch.map(async ({ symbol, last_date }) => {
      let days = 30;
      if (fullHistory || !last_date) {
        days = 520;
      } else {
        const lastMs = new Date(last_date).getTime();
        const nowMs = Date.now();
        days = Math.ceil((nowMs - lastMs) / (24 * 60 * 60 * 1000)) + 5;
        days = Math.min(days, 520);
      }

      const candles = await fetchYahooChart(symbol, days);

      if (candles.length === 0) {
        failed++;
        failedSymbols.push(symbol);
        console.error(`✗ ${symbol}: no data from Yahoo`);
        return;
      }

      const newCandles = last_date
        ? candles.filter(c => c.date > last_date)
        : candles;

      if (newCandles.length === 0) {
        // Has data but nothing new — that's fine
        return;
      }

      const rows = newCandles.map(c => ({
        symbol,
        date: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
      }));

      const { error: upsertError } = await getSupabase()
        .from('prices_daily')
        .upsert(rows, { onConflict: 'symbol,date' });

      if (upsertError) {
        console.error(`Upsert error for ${symbol}:`, upsertError);
        failed++;
        failedSymbols.push(symbol);
      } else {
        success++;
        processedSymbols.push(symbol);
        console.log(`✓ ${symbol}: +${newCandles.length} days`);
      }
    })
  );

  return { success, failed, skipped, total, remaining, failedSymbols, symbols: processedSymbols };
}
