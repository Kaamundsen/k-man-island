/**
 * Backfill historical signals
 *
 * Kjører scanner-logikken bakover på all tilgjengelig indicators_daily-data
 * og lagrer signaler for hver dato som ikke allerede har signaler.
 *
 * Usage:
 *   npx tsx scripts/backfill-signals.ts           # all missing dates
 *   npx tsx scripts/backfill-signals.ts 2025-06-01  # from this date
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const capital = 656000;

function posSize(entry: number, stop: number): number {
  const risk = entry - stop;
  if (risk <= 0) return 0;
  const shares = Math.floor((capital * 0.01) / risk);
  const pos = shares * entry;
  return pos > capital * 0.2 ? Math.floor((capital * 0.2) / entry) * entry : Math.round(pos);
}

function rs(h52: number, l52: number, close: number): number {
  const range = h52 - l52;
  return range > 0 ? Math.round(((close - l52) / range) * 100) : 50;
}

function build(symbol: string, bucket: string, type: string, score: number,
  entry: number, atr: number, reasons: string[], rv: number, relStr: number, atrMult = 2) {
  const stop = Math.round((entry - atr * atrMult) * 1e4) / 1e4;
  const rps = entry - stop;
  return {
    symbol, bucket, signal_type: type, score: Math.min(100, Math.round(score)),
    entry_price: entry, stop_price: stop,
    stop_pct: Math.round(((entry - stop) / entry) * 1e4) / 100,
    position_size_nok: posSize(entry, stop),
    r_target_1: Math.round((entry + rps) * 1e4) / 1e4,
    r_target_2: Math.round((entry + rps * 2) * 1e4) / 1e4,
    r_target_3: Math.round((entry + rps * 3) * 1e4) / 1e4,
    reasons, rel_volume: rv, rel_strength: relStr,
  };
}

async function scanDate(targetDate: string, pricesBySymbol: Record<string, any[]>, indicators: any[]) {
  const signals: any[] = [];

  for (const ind of indicators) {
    const allPrices = pricesBySymbol[ind.symbol];
    if (!allPrices) continue;
    const pricesDesc = allPrices.filter(p => p.date <= targetDate).slice(-30);
    const prices = [...pricesDesc].reverse().slice(0, 30);
    const pricesAsc = prices.reverse(); // oldest→newest
    if (pricesAsc.length < 15) continue;

    const latest = pricesAsc[pricesAsc.length - 1];
    if (latest.date !== targetDate) continue;

    const daysDiff = Math.floor((new Date(targetDate).getTime() - new Date(latest.date).getTime()) / 86400000);
    if (daysDiff > 7) continue;

    const prev = pricesAsc[pricesAsc.length - 2];
    const close = Number(latest.close);
    const open = Number(latest.open);

    if (ind.vol_sma_50 && ind.vol_sma_50 < 10000) continue;
    if (ind.atr_pct && ind.atr_pct < 0.5) continue;
    if (!ind.sma_50 || !ind.atr_14) continue;
    if (ind.vol_sma_50 && ind.vol_sma_50 * close < 100000) continue;
    if (Number(latest.volume) * close < 100000) continue;

    const rv = ind.rel_volume ?? 0;
    const relStr = rs(ind.high_52w || close, ind.low_52w || close, close);

    // 1. POWER BREAKOUT
    if (close > ind.sma_50 && close > open) {
      let score = 10;
      const reasons: string[] = ['Over SMA50'];
      if (ind.sma_200 && ind.sma_50 > ind.sma_200) { reasons.push('SMA50 > SMA200'); score += 10; }
      let hasSignal = false;
      if (ind.sma_20 && close > ind.sma_20 && prev && Number(prev.close) <= ind.sma_20) {
        reasons.push('Breakout over SMA20'); score += 20; hasSignal = true;
      }
      if (prev) {
        const gap = ((open - Number(prev.close)) / Number(prev.close)) * 100;
        if (gap >= 2) { reasons.push(`Gap opp ${gap.toFixed(1)}%`); score += 15; if (gap >= 5) score += 10; hasSignal = true; }
      }
      if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -5) {
        reasons.push(`${Math.abs(ind.pct_from_52w_high).toFixed(1)}% fra årstopp`); score += 15; hasSignal = true;
      }
      if (ind.is_consolidating && ind.consolidation_days >= 5) {
        reasons.push(`${ind.consolidation_days}d konsolidering → breakout`); score += 15; hasSignal = true;
      }
      const recent10 = pricesAsc.slice(-10);
      const h10 = Math.max(...recent10.map((p: any) => Number(p.high)));
      const l10 = Math.min(...recent10.map((p: any) => Number(p.low)));
      if (h10 - l10 > 0 && (close - l10) / (h10 - l10) > 0.85) {
        reasons.push('Topp av 10d range'); score += 10; hasSignal = true;
      }
      if (hasSignal) {
        if (rv >= 2.0) { reasons.push(`Volum ${rv.toFixed(1)}x — sterk`); score += 20; }
        else if (rv >= 1.3) { reasons.push(`Volum ${rv.toFixed(1)}x`); score += 10; }
        if (ind.rsi_14 && ind.rsi_14 >= 80) { reasons.push('Overkjøpt'); score -= 5; }
        if (relStr >= 80) score += 5;
        if (score >= 45) signals.push(build(ind.symbol, 'BREAKOUT', 'POWER_BREAKOUT', score, close, ind.atr_14, reasons, rv, relStr));
      }
    }

    // 2. 52W HIGH
    if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high >= -1 && close > ind.sma_50) {
      let score = 30;
      const reasons = ['Ny 52-ukers høy!'];
      if (ind.sma_200 && ind.sma_50 > ind.sma_200) { reasons.push('Sterk trend'); score += 15; }
      if (ind.consolidation_days >= 5) { reasons.push(`Base: ${ind.consolidation_days}d`); score += 10; }
      if (rv >= 1.5) { reasons.push(`Volum ${rv.toFixed(1)}x`); score += 15; }
      if (close > open) score += 5;
      if (score >= 45) signals.push(build(ind.symbol, 'BREAKOUT', 'HIGH_52W', score, close, ind.atr_14, reasons, rv, relStr));
    }

    // 3. CONTINUATION
    if (ind.sma_10 && ind.sma_20 && ind.sma_200 &&
        ind.sma_10 > ind.sma_20 && ind.sma_20 > ind.sma_50 && ind.sma_50 > ind.sma_200 && prev) {
      const d10 = ((close - ind.sma_10) / ind.sma_10) * 100;
      const d20 = ((close - ind.sma_20) / ind.sma_20) * 100;
      if ((d10 >= -1.5 && d10 <= 2) || (d20 >= -1.5 && d20 <= 2)) {
        let score = 25;
        const reasons = ['Sterk opptrend'];
        if (d10 >= -1.5 && d10 <= 2) { reasons.push('Pullback SMA10'); score += 15; }
        else { reasons.push('Pullback SMA20'); score += 10; }
        if (close > Number(prev.close) && close > open) { reasons.push('Bounce-dag'); score += 15; }
        else if (close > Number(prev.close)) { reasons.push('Høyere close'); score += 10; }
        else if (close > open) { reasons.push('Grønn candle'); score += 5; }
        else { score = 0; }
        if (rv < 1.0) { reasons.push('Lavt volum pullback'); score += 10; }
        if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -15) score += 10;
        if (score >= 50) signals.push(build(ind.symbol, 'KJERNE', 'CONTINUATION', score, close, ind.atr_14, reasons, rv, relStr, 1.5));
      }
    }

    // 4. FAILED BREAKOUT
    if (ind.sma_20 && ind.high_52w) {
      let attempt = false;
      for (let i = Math.max(0, pricesAsc.length - 6); i < pricesAsc.length - 1; i++) {
        if (((Number(pricesAsc[i].high) - ind.high_52w) / ind.high_52w) * 100 > -2) { attempt = true; break; }
      }
      if (attempt && close < ind.sma_20) {
        let score = 40;
        const reasons = ['⚠️ Feilet breakout', 'Var nær årstopp, falt under SMA20'];
        if (close < open) { reasons.push('Rød candle'); score += 10; }
        if (rv >= 1.5) { reasons.push(`Salgsvolum ${rv.toFixed(1)}x`); score += 15; }
        if (score >= 45) signals.push({
          symbol: ind.symbol, bucket: 'EVENT', signal_type: 'FAILED_BREAKOUT',
          score: Math.min(100, Math.round(score)), entry_price: close,
          stop_price: ind.high_52w, stop_pct: Math.round(((ind.high_52w - close) / close) * 1e4) / 100,
          position_size_nok: 0, r_target_1: 0, r_target_2: 0, r_target_3: 0,
          reasons, rel_volume: rv, rel_strength: relStr,
        });
      }
    }
  }

  // Sort + dedup
  signals.sort((a, b) => {
    if (a.signal_type === 'FAILED_BREAKOUT' && b.signal_type !== 'FAILED_BREAKOUT') return 1;
    if (b.signal_type === 'FAILED_BREAKOUT' && a.signal_type !== 'FAILED_BREAKOUT') return -1;
    return b.score - a.score;
  });
  const seen = new Set<string>();
  const deduped: any[] = [];
  for (const s of signals) {
    if (s.signal_type === 'FAILED_BREAKOUT') { deduped.push(s); continue; }
    if (!seen.has(s.symbol)) { seen.add(s.symbol); deduped.push(s); }
  }
  return deduped;
}

async function main() {
  const fromDate = process.argv[2] || '2024-01-01';

  console.log(`\n📊 Backfilling historical signals from ${fromDate}...\n`);

  // Get all indicator dates we need to process
  const { data: allDates } = await supabase
    .from('indicators_daily')
    .select('date')
    .gte('date', fromDate)
    .order('date', { ascending: true });

  const uniqueDates = [...new Set((allDates || []).map((r: any) => r.date as string))];
  console.log(`Found ${uniqueDates.length} dates to process`);

  // Get already-processed signal dates
  const { data: existingSignals } = await supabase
    .from('signals')
    .select('date')
    .gte('date', fromDate);
  const existingDates = new Set((existingSignals || []).map((r: any) => r.date as string));
  const missingDates = uniqueDates.filter(d => !existingDates.has(d));
  console.log(`${existingDates.size} dates already have signals, ${missingDates.length} to generate\n`);

  if (missingDates.length === 0) {
    console.log('✅ All dates already covered');
    return;
  }

  // Load ALL prices in bulk (to avoid per-date queries)
  console.log('Loading price data...');
  const { data: allPricesRaw } = await supabase
    .from('prices_daily')
    .select('symbol,date,open,high,low,close,volume')
    .gte('date', '2023-01-01')
    .order('date', { ascending: false });

  const pricesBySymbol: Record<string, any[]> = {};
  for (const p of (allPricesRaw || [])) {
    if (!pricesBySymbol[p.symbol]) pricesBySymbol[p.symbol] = [];
    pricesBySymbol[p.symbol].push(p);
  }
  console.log(`Loaded prices for ${Object.keys(pricesBySymbol).length} symbols\n`);

  let totalSignals = 0;
  let datesProcessed = 0;

  for (const date of missingDates) {
    // Get indicators for this date
    const { data: indicators } = await supabase
      .from('indicators_daily')
      .select('*')
      .eq('date', date);

    if (!indicators || indicators.length === 0) continue;

    const signals = await scanDate(date, pricesBySymbol, indicators);

    if (signals.length > 0) {
      const rows = signals.map(s => ({ ...s, date }));
      const { error } = await supabase.from('signals').upsert(rows, { onConflict: 'symbol,date,signal_type' });
      if (error) { console.error(`Error saving ${date}:`, error.message); continue; }
      totalSignals += signals.length;
    }

    datesProcessed++;
    if (datesProcessed % 20 === 0) {
      process.stdout.write(`  [${datesProcessed}/${missingDates.length}] ${date} — ${totalSignals} signals so far\n`);
    }
  }

  console.log(`\n✅ Done! Generated ${totalSignals} historical signals across ${datesProcessed} dates`);
}

main().catch(console.error);
