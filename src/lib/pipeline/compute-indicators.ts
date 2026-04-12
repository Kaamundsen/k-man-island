/**
 * Indicator Engine — compute technical indicators from stored prices
 *
 * Pure math, no side effects. Reads prices_daily, writes indicators_daily.
 * Designed to run after fetch-prices in the daily pipeline.
 */

import { supabase } from '@/lib/supabase/client';

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

/**
 * Detect consolidation: ATR declining for N consecutive days
 */
function detectConsolidation(
  highs: number[],
  lows: number[],
  closes: number[],
  minDays: number = 8
): { isConsolidating: boolean; days: number } {
  if (closes.length < 30) return { isConsolidating: false, days: 0 };

  // Compute rolling 14-day ATR for last 30 days
  const atrs: number[] = [];
  for (let end = closes.length - 30; end <= closes.length; end++) {
    if (end < 15) continue;
    const sliceH = highs.slice(0, end);
    const sliceL = lows.slice(0, end);
    const sliceC = closes.slice(0, end);
    const a = atr(sliceH, sliceL, sliceC, 14);
    if (a !== null) atrs.push(a);
  }

  // Count consecutive declining ATR days from the end
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
 * Compute indicators for all symbols that have new price data.
 * Only computes for dates that don't have indicators yet.
 */
export async function computeIndicators(
  symbols?: string[]
): Promise<{ computed: number; failed: number }> {
  // Get symbols to process
  let targetSymbols: string[];

  if (symbols && symbols.length > 0) {
    targetSymbols = symbols;
  } else {
    const { data } = await supabase
      .from('universe')
      .select('symbol')
      .eq('is_active', true);
    targetSymbols = data?.map(d => d.symbol) || [];
  }

  let computed = 0;
  let failed = 0;

  for (const symbol of targetSymbols) {
    try {
      // Fetch all prices for this symbol (need ~252 days for 52w high/low)
      const { data: prices, error } = await supabase
        .from('prices_daily')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: true });

      if (error || !prices || prices.length < 30) {
        console.warn(`Skipping ${symbol}: ${prices?.length || 0} price rows`);
        continue;
      }

      // Get last computed indicator date
      const { data: lastIndicator } = await supabase
        .from('indicators_daily')
        .select('date')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const lastComputedDate = lastIndicator?.date || '2000-01-01';

      // Only compute for new dates
      const newDates = prices.filter(p => p.date > lastComputedDate);
      if (newDates.length === 0) continue;

      const closes = prices.map((p: PriceRow) => Number(p.close));
      const highs = prices.map((p: PriceRow) => Number(p.high));
      const lows = prices.map((p: PriceRow) => Number(p.low));
      const volumes = prices.map((p: PriceRow) => Number(p.volume));

      const indicators = [];

      for (const priceRow of newDates) {
        // Find index in full price array
        const idx = prices.findIndex((p: PriceRow) => p.date === priceRow.date);
        if (idx < 14) continue; // Need at least 14 days of history

        const closesUpTo = closes.slice(0, idx + 1);
        const highsUpTo = highs.slice(0, idx + 1);
        const lowsUpTo = lows.slice(0, idx + 1);
        const volumesUpTo = volumes.slice(0, idx + 1);

        const currentClose = closesUpTo[closesUpTo.length - 1];

        // Moving averages
        const sma10 = sma(closesUpTo, 10);
        const sma20 = sma(closesUpTo, 20);
        const sma50 = sma(closesUpTo, 50);
        const sma200 = sma(closesUpTo, 200);

        // RSI
        const rsi14 = rsi(closesUpTo, 14);

        // ATR
        const atr14 = atr(highsUpTo, lowsUpTo, closesUpTo, 14);
        const atrPct = atr14 && currentClose > 0 ? (atr14 / currentClose) * 100 : null;

        // Volume
        const volSma50 = volumesUpTo.length >= 50
          ? Math.round(volumesUpTo.slice(-50).reduce((a, b) => a + b, 0) / 50)
          : null;
        const todayVol = volumesUpTo[volumesUpTo.length - 1];
        const relVolume = volSma50 && volSma50 > 0 ? todayVol / volSma50 : null;

        // 52-week high/low
        const lookback252 = Math.min(252, closesUpTo.length);
        const high252 = highsUpTo.slice(-lookback252);
        const low252 = lowsUpTo.slice(-lookback252);
        const high52w = Math.max(...high252);
        const low52w = Math.min(...low252);
        const pctFromHigh = ((currentClose - high52w) / high52w) * 100;
        const pctFromLow = ((currentClose - low52w) / low52w) * 100;

        // Consolidation
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
        const { error: upsertError } = await supabase
          .from('indicators_daily')
          .upsert(indicators, { onConflict: 'symbol,date' });

        if (upsertError) {
          console.error(`Indicator upsert error for ${symbol}:`, upsertError);
          failed++;
        } else {
          computed += indicators.length;
          console.log(`✓ ${symbol}: ${indicators.length} indicator rows computed`);
        }
      }
    } catch (err) {
      console.error(`Error computing indicators for ${symbol}:`, err);
      failed++;
    }
  }

  return { computed, failed };
}
