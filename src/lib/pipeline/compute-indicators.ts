/**
 * Indicator Engine — compute technical indicators from stored prices
 *
 * Smart batching: only processes symbols with new price data.
 * Uses bulk queries to find what needs computing.
 */

import { getSupabase } from '@/lib/supabase/client';

interface PriceRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================
// PURE INDICATOR FUNCTIONS
// ============================================================

function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function rsi(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;

  const changes = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  for (const change of changes) {
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function atr(highs: number[], lows: number[], closes: number[], period: number = 14): number | null {
  if (highs.length < period + 1) return null;

  const trueRanges: number[] = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
  }

  return trueRanges.reduce((a, b) => a + b, 0) / period;
}

function detectConsolidation(
  highs: number[],
  lows: number[],
  closes: number[],
  minDays: number = 8
): { isConsolidating: boolean; days: number } {
  if (closes.length < 30) return { isConsolidating: false, days: 0 };

  const atrs: number[] = [];
  for (let end = closes.length - 30; end <= closes.length; end++) {
    if (end < 15) continue;
    const sliceH = highs.slice(0, end);
    const sliceL = lows.slice(0, end);
    const sliceC = closes.slice(0, end);
    const a = atr(sliceH, sliceL, sliceC, 14);
    if (a !== null) atrs.push(a);
  }

  let consecutiveDecline = 0;
  for (let i = atrs.length - 1; i > 0; i--) {
    if (atrs[i] <= atrs[i - 1]) {
      consecutiveDecline++;
    } else {
      break;
    }
  }

  return {
    isConsolidating: consecutiveDecline >= minDays,
    days: consecutiveDecline,
  };
}

// ============================================================
// MAIN COMPUTE FUNCTION
// ============================================================

/**
 * Compute indicators for symbols that have new price data.
 * Batched: max 30 symbols per call to fit in Vercel 10s.
 */
export async function computeIndicators(
  symbols?: string[]
): Promise<{ computed: number; failed: number }> {
  let targetSymbols: string[];

  if (symbols && symbols.length > 0) {
    targetSymbols = symbols;
  } else {
    // Smart: find symbols that have prices but missing/stale indicators
    // Query 1: symbols with price data (distinct)
    const { data: priceSymbols } = await getSupabase()
      .from('prices_daily')
      .select('symbol')
      .order('symbol');

    if (!priceSymbols || priceSymbols.length === 0) {
      return { computed: 0, failed: 0 };
    }

    // Deduplicate
    const uniquePriceSymbols = [...new Set(priceSymbols.map(r => r.symbol))];

    // Query 2: symbols with recent indicators (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const sinceDate = threeDaysAgo.toISOString().split('T')[0];

    const { data: recentIndicators } = await getSupabase()
      .from('indicators_daily')
      .select('symbol')
      .gte('date', sinceDate);

    const hasRecentIndicators = new Set((recentIndicators || []).map(r => r.symbol));

    // Only compute for symbols missing recent indicators
    targetSymbols = uniquePriceSymbols.filter(s => !hasRecentIndicators.has(s));
  }

  // Batch limit: max 30 symbols per call
  const batch = targetSymbols.slice(0, 30);
  console.log(`Computing indicators for ${batch.length} of ${targetSymbols.length} symbols`);

  let computed = 0;
  let failed = 0;

  for (const symbol of batch) {
    try {
      const { data: prices, error } = await getSupabase()
        .from('prices_daily')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: true });

      if (error || !prices || prices.length < 30) continue;

      // Only compute for the LAST date (most recent) to be fast
      // Full history computation happens on first load
      const { data: lastIndicator } = await getSupabase()
        .from('indicators_daily')
        .select('date')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const lastComputedDate = lastIndicator?.date || '2000-01-01';
      const newDates = prices.filter(p => p.date > lastComputedDate);
      if (newDates.length === 0) continue;

      const closes = prices.map((p: PriceRow) => Number(p.close));
      const highs = prices.map((p: PriceRow) => Number(p.high));
      const lows = prices.map((p: PriceRow) => Number(p.low));
      const volumes = prices.map((p: PriceRow) => Number(p.volume));

      const indicators = [];

      for (const priceRow of newDates) {
        const idx = prices.findIndex((p: PriceRow) => p.date === priceRow.date);
        if (idx < 14) continue;

        const closesUpTo = closes.slice(0, idx + 1);
        const highsUpTo = highs.slice(0, idx + 1);
        const lowsUpTo = lows.slice(0, idx + 1);
        const volumesUpTo = volumes.slice(0, idx + 1);

        const currentClose = closesUpTo[closesUpTo.length - 1];

        const sma10 = sma(closesUpTo, 10);
        const sma20 = sma(closesUpTo, 20);
        const sma50 = sma(closesUpTo, 50);
        const sma200 = sma(closesUpTo, 200);
        const rsi14 = rsi(closesUpTo, 14);
        const atr14 = atr(highsUpTo, lowsUpTo, closesUpTo, 14);
        const atrPct = atr14 && currentClose > 0 ? (atr14 / currentClose) * 100 : null;

        const volSma50 = volumesUpTo.length >= 50
          ? Math.round(volumesUpTo.slice(-50).reduce((a, b) => a + b, 0) / 50)
          : null;
        const todayVol = volumesUpTo[volumesUpTo.length - 1];
        const relVolume = volSma50 && volSma50 > 0 ? todayVol / volSma50 : null;

        const lookback252 = Math.min(252, closesUpTo.length);
        const high252 = highsUpTo.slice(-lookback252);
        const low252 = lowsUpTo.slice(-lookback252);
        const high52w = Math.max(...high252);
        const low52w = Math.min(...low252);
        const pctFromHigh = ((currentClose - high52w) / high52w) * 100;
        const pctFromLow = ((currentClose - low52w) / low52w) * 100;

        const { isConsolidating, days: consolidationDays } = detectConsolidation(
          highsUpTo, lowsUpTo, closesUpTo
        );

        indicators.push({
          symbol,
          date: priceRow.date,
          sma_10: sma10 ? Math.round(sma10 * 10000) / 10000 : null,
          sma_20: sma20 ? Math.round(sma20 * 10000) / 10000 : null,
          sma_50: sma50 ? Math.round(sma50 * 10000) / 10000 : null,
          sma_200: sma200 ? Math.round(sma200 * 10000) / 10000 : null,
          rsi_14: rsi14 ? Math.round(rsi14 * 100) / 100 : null,
          atr_14: atr14 ? Math.round(atr14 * 10000) / 10000 : null,
          atr_pct: atrPct ? Math.round(atrPct * 100) / 100 : null,
          vol_sma_50: volSma50,
          rel_volume: relVolume ? Math.round(relVolume * 100) / 100 : null,
          high_52w: high52w ? Math.round(high52w * 10000) / 10000 : null,
          low_52w: low52w ? Math.round(low52w * 10000) / 10000 : null,
          pct_from_52w_high: Math.round(pctFromHigh * 100) / 100,
          pct_from_52w_low: Math.round(pctFromLow * 100) / 100,
          is_consolidating: isConsolidating,
          consolidation_days: consolidationDays,
        });
      }

      if (indicators.length > 0) {
        const { error: upsertError } = await getSupabase()
          .from('indicators_daily')
          .upsert(indicators, { onConflict: 'symbol,date' });

        if (upsertError) {
          console.error(`Indicator error for ${symbol}:`, upsertError);
          failed++;
        } else {
          computed += indicators.length;
        }
      }
    } catch (err) {
      console.error(`Error for ${symbol}:`, err);
      failed++;
    }
  }

  return { computed, failed };
}
