/**
 * Local scanner — 4 signal types: Power Breakout, 52W High, Continuation, Failed Breakout
 *
 * Usage:
 *   npx tsx scripts/run-scanner.ts
 *   npx tsx scripts/run-scanner.ts 2026-04-14
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getLastTradingDay(): string {
  const now = new Date();
  if (now.getUTCHours() < 22) now.setDate(now.getDate() - 1);
  const day = now.getDay();
  if (day === 0) now.setDate(now.getDate() - 2);
  else if (day === 6) now.setDate(now.getDate() - 1);
  return now.toISOString().split('T')[0];
}

function posSize(entry: number, stop: number, capital: number): number {
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

interface Signal {
  symbol: string; bucket: string; signal_type: string; score: number;
  entry_price: number; stop_price: number; stop_pct: number;
  position_size_nok: number; r_target_1: number; r_target_2: number;
  r_target_3: number; reasons: string[]; rel_volume: number; rel_strength: number;
}

function build(symbol: string, bucket: string, type: string, score: number,
  entry: number, atr: number, capital: number, reasons: string[],
  rv: number, relStr: number, atrMult: number = 2): Signal {
  const stop = Math.round((entry - atr * atrMult) * 1e4) / 1e4;
  const rps = entry - stop;
  return {
    symbol, bucket, signal_type: type, score: Math.min(100, Math.round(score)),
    entry_price: entry, stop_price: stop,
    stop_pct: Math.round(((entry - stop) / entry) * 1e4) / 100,
    position_size_nok: posSize(entry, stop, capital),
    r_target_1: Math.round((entry + rps) * 1e4) / 1e4,
    r_target_2: Math.round((entry + rps * 2) * 1e4) / 1e4,
    r_target_3: Math.round((entry + rps * 3) * 1e4) / 1e4,
    reasons, rel_volume: rv, rel_strength: relStr,
  };
}

async function main() {
  let targetDate = process.argv[2] || getLastTradingDay();

  let { data: indicators } = await supabase.from('indicators_daily').select('*').eq('date', targetDate);
  if (!indicators || indicators.length === 0) {
    const { data: latest } = await supabase.from('indicators_daily')
      .select('date').lte('date', targetDate).order('date', { ascending: false }).limit(1).single();
    if (latest) {
      targetDate = latest.date;
      const r = await supabase.from('indicators_daily').select('*').eq('date', targetDate);
      indicators = r.data;
    }
  }
  if (!indicators || indicators.length === 0) { console.log('No indicators'); return; }

  console.log(`📊 Scanning ${indicators.length} symbols for ${targetDate}\n`);
  const capital = 656000;
  const signals: Signal[] = [];

  for (const ind of indicators) {
    const { data: prices } = await supabase.from('prices_daily').select('*')
      .eq('symbol', ind.symbol).lte('date', targetDate)
      .order('date', { ascending: true }).limit(20);
    if (!prices || prices.length < 15) continue;

    const latest = prices[prices.length - 1];
    const prev = prices[prices.length - 2];
    const close = Number(latest.close);
    const open = Number(latest.open);

    // Quality
    if (close < 1) continue;
    if (ind.vol_sma_50 && ind.vol_sma_50 < 10000) continue;
    if (ind.atr_pct && ind.atr_pct < 0.5) continue;
    if (!ind.sma_50 || !ind.atr_14) continue;
    // Min snitt-omsetning 1M NOK OG siste dag > 500k
    if (ind.vol_sma_50 && ind.vol_sma_50 * close < 1000000) continue;
    if (Number(latest.volume) * close < 500000) continue;

    const rv = ind.rel_volume ?? 0;
    const relStr = rs(ind.high_52w || close, ind.low_52w || close, close);

    // === 1. POWER BREAKOUT ===
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
      const recent10 = prices.slice(-10);
      const h10 = Math.max(...recent10.map(p => Number(p.high)));
      const l10 = Math.min(...recent10.map(p => Number(p.low)));
      if (h10 - l10 > 0 && (close - l10) / (h10 - l10) > 0.85) {
        reasons.push('Topp av 10d range'); score += 10; hasSignal = true;
      }
      if (hasSignal) {
        if (rv >= 2.0) { reasons.push(`Volum ${rv.toFixed(1)}x — sterk`); score += 20; }
        else if (rv >= 1.3) { reasons.push(`Volum ${rv.toFixed(1)}x`); score += 10; }
        if (ind.rsi_14 && ind.rsi_14 >= 80) { reasons.push('Overkjøpt'); score -= 5; }
        if (relStr >= 80) score += 5;
        if (score >= 45) signals.push(build(ind.symbol, 'BREAKOUT', 'POWER_BREAKOUT', score, close, ind.atr_14, capital, reasons, rv, relStr));
      }
    }

    // === 2. 52W HIGH ===
    if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high >= -1 && close > ind.sma_50) {
      let score = 30;
      const reasons = ['Ny 52-ukers høy!'];
      if (ind.sma_200 && ind.sma_50 > ind.sma_200) { reasons.push('Sterk trend'); score += 15; }
      if (ind.consolidation_days >= 5) { reasons.push(`Base: ${ind.consolidation_days}d`); score += 10; }
      if (rv >= 1.5) { reasons.push(`Volum ${rv.toFixed(1)}x`); score += 15; }
      if (close > open) score += 5;
      if (score >= 45) signals.push(build(ind.symbol, 'BREAKOUT', 'HIGH_52W', score, close, ind.atr_14, capital, reasons, rv, relStr));
    }

    // === 3. CONTINUATION ===
    if (ind.sma_10 && ind.sma_20 && ind.sma_200 &&
        ind.sma_10 > ind.sma_20 && ind.sma_20 > ind.sma_50 && ind.sma_50 > ind.sma_200 && prev) {
      const d10 = ((close - ind.sma_10) / ind.sma_10) * 100;
      const d20 = ((close - ind.sma_20) / ind.sma_20) * 100;
      if ((d10 >= -1.5 && d10 <= 2) || (d20 >= -1.5 && d20 <= 2)) {
        let score = 25;
        const reasons = ['Sterk opptrend'];
        if (d10 >= -1.5 && d10 <= 2) { reasons.push(`Pullback SMA10`); score += 15; }
        else { reasons.push(`Pullback SMA20`); score += 10; }
        if (close > Number(prev.close) && close > open) { reasons.push('Bounce-dag'); score += 15; }
        else if (close > Number(prev.close)) { reasons.push('Høyere close'); score += 10; }
        else if (close > open) { reasons.push('Grønn candle'); score += 5; }
        else { score = 0; }
        if (rv < 1.0) { reasons.push('Lavt volum pullback'); score += 10; }
        if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -15) score += 10;
        if (score >= 50) signals.push(build(ind.symbol, 'KJERNE', 'CONTINUATION', score, close, ind.atr_14, capital, reasons, rv, relStr, 1.5));
      }
    }

    // === 4. FAILED BREAKOUT ===
    if (ind.sma_20 && ind.high_52w) {
      let attempt = false;
      for (let i = Math.max(0, prices.length - 6); i < prices.length - 1; i++) {
        if (((Number(prices[i].high) - ind.high_52w) / ind.high_52w) * 100 > -2) { attempt = true; break; }
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

  signals.sort((a, b) => {
    if (a.signal_type === 'FAILED_BREAKOUT' && b.signal_type !== 'FAILED_BREAKOUT') return 1;
    if (b.signal_type === 'FAILED_BREAKOUT' && a.signal_type !== 'FAILED_BREAKOUT') return -1;
    return b.score - a.score;
  });

  console.log(`🎯 ${signals.length} signaler:\n`);
  for (const s of signals) {
    const e = s.signal_type === 'FAILED_BREAKOUT' ? '⚠️' : '✅';
    console.log(`${e} ${s.symbol.padEnd(12)} ${s.signal_type.padEnd(16)} Score:${String(s.score).padStart(3)}  Entry:${s.entry_price}  Size:${s.position_size_nok} NOK`);
    console.log(`   ${s.reasons.join(' | ')}`);
  }

  // Delete old signals for this date, insert new
  if (signals.length > 0) {
    await supabase.from('signals').delete().eq('date', targetDate);
    const rows = signals.map(s => ({
      symbol: s.symbol, date: targetDate, bucket: s.bucket, signal_type: s.signal_type,
      score: s.score, entry_price: s.entry_price, stop_price: s.stop_price, stop_pct: s.stop_pct,
      position_size_nok: s.position_size_nok, r_target_1: s.r_target_1, r_target_2: s.r_target_2,
      r_target_3: s.r_target_3, reasons: s.reasons,
    }));
    const { error } = await supabase.from('signals').upsert(rows, { onConflict: 'symbol,date,signal_type' });
    if (error) console.error('Lagringsfeil:', error.message);
    else console.log(`\n💾 ${rows.length} signaler lagret`);
  } else {
    console.log('\nIngen signaler å lagre');
  }
}

main().catch(console.error);
