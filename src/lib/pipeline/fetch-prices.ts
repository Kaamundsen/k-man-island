/**
 * Price Fetcher — daily OHLCV from Yahoo Finance → Supabase
 *
 * Uses 2 simple DB queries to find what needs updating.
 * Processes one small batch per call. Frontend auto-loops.
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

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo ${response.status} for ${symbol}`);
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
  } catch (err) {
    console.error(`Yahoo fetch error for ${symbol}:`, err);
    return [];
  }
}

function getLastTradingDay(): string {
  const now = new Date();
  const day = now.getDay();
  if (day === 0) now.setDate(now.getDate() - 2);
  else if (day === 6) now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

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

  // Query 1: all active symbols for this market
  const { data: allSymbols, error: symError } = await getSupabase()
    .from('universe')
    .select('symbol')
    .eq('market', market)
    .eq('is_active', true);

  if (symError || !allSymbols || allSymbols.length === 0) {
    console.error('No symbols found:', symError);
    return { success: 0, failed: 0, skipped: 0, total: 0, remaining: 0, failedSymbols: [], symbols: [] };
  }

  const totalActive = allSymbols.length;

  // Query 2: distinct symbols that already have data from last trading day
  // No .in() filter — just get all recent symbols and intersect in JS
  const { data: recentRows } = await getSupabase()
    .from('prices_daily')
    .select('symbol')
    .gte('date', lastTradingDay);

  const upToDateSet = new Set<string>();
  if (recentRows) {
    for (const row of recentRows) {
      upToDateSet.add(row.symbol);
    }
  }

  // Find symbols that need updating
  const allSymbolSet = new Set(allSymbols.map(s => s.symbol));
  const needsUpdate = allSymbols
    .filter(s => !upToDateSet.has(s.symbol) || fullHistory)
    .map(s => s.symbol);

  const skipped = totalActive - needsUpdate.length;
  const batch = needsUpdate.slice(0, batchSize);
  const remaining = Math.max(0, needsUpdate.length - batch.length);

  let success = 0;
  let failed = 0;
  const processedSymbols: string[] = [];
  const failedSymbols: string[] = [];

  // Fetch prices for this batch
  await Promise.allSettled(
    batch.map(async (symbol) => {
      // Check if symbol has ANY existing data (to decide incremental vs full)
      const { data: lastRow } = await getSupabase()
        .from('prices_daily')
        .select('date')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const lastDate = lastRow?.date || null;

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
        return;
      }

      const newCandles = lastDate
        ? candles.filter(c => c.date > lastDate)
        : candles;

      if (newCandles.length === 0) {
        return; // Already up to date
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

  return { success, failed, skipped, total: totalActive, remaining, failedSymbols, symbols: processedSymbols };
}
