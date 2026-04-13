/**
 * Price Fetcher — daily OHLCV from Yahoo Finance → Supabase
 *
 * Frontend auto-loops: calls this repeatedly until remaining === 0.
 * Tracks failed symbols so they don't cause infinite retries.
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

async function getLastStoredDate(symbol: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('prices_daily')
    .select('date')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  return data?.date || null;
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
 * Failed symbols get deactivated so they don't loop forever.
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
  const { fullHistory = false, batchSize = 10 } = options;

  const { data: symbols, error } = await getSupabase()
    .from('universe')
    .select('symbol')
    .eq('market', market)
    .eq('is_active', true);

  if (error || !symbols) {
    console.error('Failed to fetch universe:', error);
    return { success: 0, failed: 0, skipped: 0, total: 0, remaining: 0, failedSymbols: [], symbols: [] };
  }

  const total = symbols.length;
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const processedSymbols: string[] = [];
  const failedSymbols: string[] = [];

  const lastTradingDay = getLastTradingDay();

  // Check ALL symbols to get accurate count
  const needsUpdate: { symbol: string; lastDate: string | null }[] = [];

  for (const { symbol } of symbols) {
    const lastDate = await getLastStoredDate(symbol);
    if (lastDate && lastDate >= lastTradingDay && !fullHistory) {
      skipped++;
    } else {
      needsUpdate.push({ symbol, lastDate });
    }
  }

  // Take one batch
  const batch = needsUpdate.slice(0, batchSize);
  const remaining = needsUpdate.length - batch.length;

  await Promise.allSettled(
    batch.map(async ({ symbol, lastDate }) => {
      let days = 30;
      if (fullHistory || !lastDate) {
        days = 520;
      } else {
        const lastMs = new Date(lastDate).getTime();
        const nowMs = Date.now();
        days = Math.ceil((nowMs - lastMs) / (24 * 60 * 60 * 1000)) + 5;
        days = Math.min(days, 520);
      }

      const candles = await fetchYahooChart(symbol, days);

      if (candles.length === 0) {
        failed++;
        failedSymbols.push(symbol);
        console.error(`✗ ${symbol}: no data from Yahoo — deactivating`);

        // DEACTIVATE this symbol so it doesn't retry forever
        await getSupabase()
          .from('universe')
          .update({ is_active: false })
          .eq('symbol', symbol);

        return;
      }

      const newCandles = lastDate
        ? candles.filter(c => c.date > lastDate)
        : candles;

      if (newCandles.length === 0) {
        skipped++;
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
