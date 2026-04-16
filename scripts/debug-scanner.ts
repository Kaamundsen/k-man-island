import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const targetDate = '2026-04-13'; // Monday

  // Get all indicators for target date
  const { data: indicators } = await supabase.from('indicators_daily').select('*').eq('date', targetDate);
  console.log(`Found ${indicators?.length} indicators for ${targetDate}\n`);

  if (!indicators || indicators.length === 0) return;

  let passedQuality = 0;
  let failReasons: Record<string, number> = {};

  for (const ind of indicators) {
    // Get prices
    const { data: prices } = await supabase.from('prices_daily')
      .select('*').eq('symbol', ind.symbol).lte('date', targetDate)
      .order('date', { ascending: true }).limit(20);

    if (!prices || prices.length < 10) { failReasons['< 10 prices'] = (failReasons['< 10 prices'] || 0) + 1; continue; }

    const latest = prices[prices.length - 1];
    const close = Number(latest.close);
    const volume = Number(latest.volume);

    // Quality checks
    if (close < 1) { failReasons['price < 1'] = (failReasons['price < 1'] || 0) + 1; continue; }
    if (ind.vol_sma_50 && ind.vol_sma_50 < 10000) { failReasons['vol_sma_50 < 10k'] = (failReasons['vol_sma_50 < 10k'] || 0) + 1; continue; }
    if (ind.atr_pct && ind.atr_pct < 0.5) { failReasons['atr_pct < 0.5'] = (failReasons['atr_pct < 0.5'] || 0) + 1; continue; }
    if (!ind.sma_50) { failReasons['no sma_50'] = (failReasons['no sma_50'] || 0) + 1; continue; }

    passedQuality++;

    // Check each scanner condition
    const reasons: string[] = [];

    // VCP: close > SMA50 > SMA200, consolidating 8+d, close > SMA20
    if (ind.sma_50 && ind.sma_200 && close > ind.sma_50 && ind.sma_50 > ind.sma_200) {
      if (ind.is_consolidating && ind.consolidation_days >= 8 && ind.sma_20 && close > ind.sma_20) {
        reasons.push('VCP candidate');
      }
    }

    // 52W High: within 1% of 52w high
    if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high >= -1 && close > ind.sma_50) {
      reasons.push('52W HIGH candidate');
    }

    // Volume Surge: rel_volume >= 2.0
    if (ind.rel_volume && ind.rel_volume >= 2.0) {
      reasons.push(`VOL SURGE candidate (rv=${ind.rel_volume})`);
    }

    // Episodic: gap > 3%
    if (prices.length >= 2) {
      const prev = prices[prices.length - 2];
      const gapPct = ((Number(latest.open) - Number(prev.close)) / Number(prev.close)) * 100;
      if (gapPct >= 3 && ind.rel_volume && ind.rel_volume >= 2.0) {
        reasons.push(`EPISODIC candidate (gap=${gapPct.toFixed(1)}%)`);
      }
    }

    // Continuation: SMA10 > SMA20 > SMA50 > SMA200, price near SMA10/20
    if (ind.sma_10 && ind.sma_20 && ind.sma_50 && ind.sma_200 &&
        ind.sma_10 > ind.sma_20 && ind.sma_20 > ind.sma_50 && ind.sma_50 > ind.sma_200) {
      const dist10 = ((close - ind.sma_10) / ind.sma_10) * 100;
      const dist20 = ((close - ind.sma_20) / ind.sma_20) * 100;
      if ((dist10 >= -1.5 && dist10 <= 2) || (dist20 >= -1.5 && dist20 <= 2)) {
        reasons.push(`CONTINUATION candidate (dist10=${dist10.toFixed(1)}%, dist20=${dist20.toFixed(1)}%)`);
      }
    }

    if (reasons.length > 0) {
      console.log(`✅ ${ind.symbol}: ${reasons.join(', ')} | rv=${ind.rel_volume} vol=${volume} close=${close} consol=${ind.consolidation_days}d`);
    }
  }

  console.log(`\n--- Quality filter results ---`);
  console.log(`Passed quality: ${passedQuality} / ${indicators.length}`);
  console.log(`Fail reasons:`, failReasons);

  // Also show some stats about consolidation
  const consolidating = indicators.filter(i => i.is_consolidating && i.consolidation_days >= 8);
  console.log(`\nConsolidating 8+d: ${consolidating.length}`);

  const nearHigh = indicators.filter(i => i.pct_from_52w_high !== null && i.pct_from_52w_high >= -1);
  console.log(`Near 52w high: ${nearHigh.length}`);

  const highVol = indicators.filter(i => i.rel_volume && i.rel_volume >= 2.0);
  console.log(`High rel volume (2x+): ${highVol.length}`);

  const uptrend = indicators.filter(i => i.sma_10 && i.sma_20 && i.sma_50 && i.sma_200 &&
    i.sma_10 > i.sma_20 && i.sma_20 > i.sma_50 && i.sma_50 > i.sma_200);
  console.log(`Strong uptrend (all SMAs aligned): ${uptrend.length}`);
}

main().catch(console.error);
