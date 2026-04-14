/**
 * Local pipeline runner — compute indicators + scan for signals.
 * Run after load-prices.ts
 *
 * Usage:
 *   npx tsx scripts/run-pipeline.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  return closes.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function rsi(closes: number[], period: number = 14): number | null {
  if (closes.length < period + 1) return null;
  const changes = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  let avgGain = 0, avgLoss = 0;
  for (const c of changes) {
    if (c > 0) avgGain += c; else avgLoss += Math.abs(c);
  }
  avgGain /= period; avgLoss /= period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function atr(highs: number[], lows: number[], closes: number[], period: number = 14): number | null {
  if (highs.length < period + 1) return null;
  const trs: number[] = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    trs.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }
  return trs.reduce((a, b) => a + b, 0) / period;
}

function detectConsolidation(highs: number[], lows: number[], closes: number[]): { isConsolidating: boolean; days: number } {
  if (closes.length < 30) return { isConsolidating: false, days: 0 };
  const atrs: number[] = [];
  for (let end = closes.length - 30; end <= closes.length; end++) {
    if (end < 15) continue;
    const a = atr(highs.slice(0, end), lows.slice(0, end), closes.slice(0, end), 14);
    if (a !== null) atrs.push(a);
  }
  let decline = 0;
  for (let i = atrs.length - 1; i > 0; i--) {
    if (atrs[i] <= atrs[i - 1]) decline++; else break;
  }
  return { isConsolidating: decline >= 8, days: decline };
}

async function computeIndicators() {
  // Get all unique symbols from universe (active ones with prices)
  const { data: allSymbols } = await supabase
    .from('universe')
    .select('symbol')
    .eq('is_active', true)
    .order('symbol');

  const uniqueSymbols = (allSymbols || []).map(r => r.symbol);
  console.log(`\n📈 Computing indicators for ${uniqueSymbols.length} symbols...\n`);

  let computed = 0, failed = 0, skipped = 0;

  for (let i = 0; i < uniqueSymbols.length; i++) {
    const symbol = uniqueSymbols[i];

    try {
      const { data: prices } = await supabase
        .from('prices_daily')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: true });

      if (!prices || prices.length < 30) { skipped++; continue; }

      // Check last indicator date
      const { data: lastInd } = await supabase
        .from('indicators_daily')
        .select('date')
        .eq('symbol', symbol)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const lastDate = lastInd?.date || '2000-01-01';
      const newDates = prices.filter(p => p.date > lastDate);
      if (newDates.length === 0) { skipped++; continue; }

      const closes = prices.map(p => Number(p.close));
      const highs = prices.map(p => Number(p.high));
      const lows = prices.map(p => Number(p.low));
      const volumes = prices.map(p => Number(p.volume));

      const indicators = [];

      for (const row of newDates) {
        const idx = prices.findIndex(p => p.date === row.date);
        if (idx < 14) continue;

        const c = closes.slice(0, idx + 1);
        const h = highs.slice(0, idx + 1);
        const l = lows.slice(0, idx + 1);
        const v = volumes.slice(0, idx + 1);
        const close = c[c.length - 1];

        const sma10 = sma(c, 10), sma20 = sma(c, 20), sma50 = sma(c, 50), sma200 = sma(c, 200);
        const rsi14 = rsi(c, 14);
        const atr14 = atr(h, l, c, 14);
        const atrPct = atr14 && close > 0 ? (atr14 / close) * 100 : null;
        const volSma50 = v.length >= 50 ? Math.round(v.slice(-50).reduce((a, b) => a + b, 0) / 50) : null;
        const relVol = volSma50 && volSma50 > 0 ? v[v.length - 1] / volSma50 : null;
        const lb = Math.min(252, c.length);
        const high52w = Math.max(...h.slice(-lb));
        const low52w = Math.min(...l.slice(-lb));
        const { isConsolidating, days } = detectConsolidation(h, l, c);

        indicators.push({
          symbol, date: row.date,
          sma_10: sma10 ? Math.round(sma10 * 1e4) / 1e4 : null,
          sma_20: sma20 ? Math.round(sma20 * 1e4) / 1e4 : null,
          sma_50: sma50 ? Math.round(sma50 * 1e4) / 1e4 : null,
          sma_200: sma200 ? Math.round(sma200 * 1e4) / 1e4 : null,
          rsi_14: rsi14 ? Math.round(rsi14 * 100) / 100 : null,
          atr_14: atr14 ? Math.round(atr14 * 1e4) / 1e4 : null,
          atr_pct: atrPct ? Math.round(atrPct * 100) / 100 : null,
          vol_sma_50: volSma50,
          rel_volume: relVol ? Math.round(relVol * 100) / 100 : null,
          high_52w: Math.round(high52w * 1e4) / 1e4,
          low_52w: Math.round(low52w * 1e4) / 1e4,
          pct_from_52w_high: Math.round(((close - high52w) / high52w) * 1e4) / 100,
          pct_from_52w_low: Math.round(((close - low52w) / low52w) * 1e4) / 100,
          is_consolidating: isConsolidating,
          consolidation_days: days,
        });
      }

      if (indicators.length > 0) {
        // Upsert in chunks of 500 to avoid payload limits
        for (let j = 0; j < indicators.length; j += 500) {
          const chunk = indicators.slice(j, j + 500);
          const { error } = await supabase.from('indicators_daily').upsert(chunk, { onConflict: 'symbol,date' });
          if (error) { console.error(`Error ${symbol}:`, error.message); failed++; break; }
        }
        computed += indicators.length;
        if ((i + 1) % 20 === 0) {
          process.stdout.write(`  [${i + 1}/${uniqueSymbols.length}] ${computed} indicators computed\n`);
        }
      } else {
        skipped++;
      }
    } catch (err: any) {
      console.error(`Error ${symbol}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n✅ Indicators done: ${computed} computed, ${skipped} skipped, ${failed} failed`);
}

async function main() {
  await computeIndicators();

  // Final count
  const { count: indCount } = await supabase.from('indicators_daily').select('*', { count: 'exact', head: true });
  const { count: sigCount } = await supabase.from('signals').select('*', { count: 'exact', head: true });
  console.log(`\n📊 Final: ${indCount} indicator rows, ${sigCount} signals`);
  console.log(`\nNå kan du gå til /scanner og trykke "Scanner" for å finne signaler!`);
}

main().catch(console.error);
