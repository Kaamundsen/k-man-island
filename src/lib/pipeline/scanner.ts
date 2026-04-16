/**
 * Scanner — finds breakouts and strong movers
 *
 * Signal types:
 * 1. POWER_BREAKOUT   — Sterk aksje i opptrend bryter ut med volum
 * 2. HIGH_52W         — Ny 52-ukers topp
 * 3. CONTINUATION     — Pullback-kjøp i sterk opptrend
 * 4. FAILED_BREAKOUT  — ⚠️ Advarsel: feilet breakout, unngå
 */

import { getSupabase } from '@/lib/supabase/client';

export interface ScanResult {
  symbol: string;
  bucket: 'BREAKOUT' | 'EVENT' | 'KJERNE' | 'INNTEKT';
  signal_type: string;
  score: number;
  entry_price: number;
  stop_price: number;
  stop_pct: number;
  position_size_nok: number;
  r_target_1: number;
  r_target_2: number;
  r_target_3: number;
  reasons: string[];
  rel_volume: number;
  rel_strength: number;
}

interface IndicatorRow {
  symbol: string;
  date: string;
  sma_10: number | null;
  sma_20: number | null;
  sma_50: number | null;
  sma_200: number | null;
  rsi_14: number | null;
  atr_14: number | null;
  atr_pct: number | null;
  vol_sma_50: number | null;
  rel_volume: number | null;
  high_52w: number | null;
  low_52w: number | null;
  pct_from_52w_high: number | null;
  pct_from_52w_low: number | null;
  is_consolidating: boolean;
  consolidation_days: number;
}

interface PriceRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================================
// HELPERS
// ============================================================

function passesQualityFilter(ind: IndicatorRow, prices: PriceRow[]): boolean {
  if (prices.length < 15) return false;
  const latest = prices[prices.length - 1];
  if (!latest) return false;
  if (ind.vol_sma_50 && ind.vol_sma_50 < 10000) return false;
  if (ind.atr_pct && ind.atr_pct < 0.5) return false;
  if (!ind.sma_50) return false;

  // Minimum likviditet:
  // 1) Snitt daglig omsetning > 1M NOK (50d snittvolum × pris)
  // 2) Siste dags omsetning > 100k NOK
  if (ind.vol_sma_50) {
    const avgTurnover = ind.vol_sma_50 * latest.close;
    if (avgTurnover < 100000) return false;
  }
  const todayTurnover = latest.volume * latest.close;
  if (todayTurnover < 100000) return false;

  return true;
}

function calcRelativeStrength(ind: IndicatorRow, close: number): number {
  if (!ind.high_52w || !ind.low_52w) return 50;
  const range = ind.high_52w - ind.low_52w;
  if (range <= 0) return 50;
  return Math.round(((close - ind.low_52w) / range) * 100);
}

function calculatePositionSize(entry: number, stop: number, capital: number): number {
  const risk = entry - stop;
  if (risk <= 0) return 0;
  const riskAmount = capital * 0.01;
  const shares = Math.floor(riskAmount / risk);
  const pos = shares * entry;
  const max = capital * 0.20;
  return pos > max ? Math.floor(max / entry) * entry : Math.round(pos);
}

function buildResult(
  symbol: string, bucket: 'BREAKOUT' | 'EVENT' | 'KJERNE' | 'INNTEKT',
  signalType: string, score: number, entryPrice: number,
  atr: number, capital: number, reasons: string[],
  relVolume: number, relStrength: number, atrMultiplier: number = 2,
): ScanResult {
  const stopDist = atr * atrMultiplier;
  const stopPrice = Math.round((entryPrice - stopDist) * 1e4) / 1e4;
  const stopPct = ((entryPrice - stopPrice) / entryPrice) * 100;
  const rps = entryPrice - stopPrice;
  return {
    symbol, bucket, signal_type: signalType,
    score: Math.min(100, Math.round(score)),
    entry_price: entryPrice, stop_price: stopPrice,
    stop_pct: Math.round(stopPct * 100) / 100,
    position_size_nok: calculatePositionSize(entryPrice, stopPrice, capital),
    r_target_1: Math.round((entryPrice + rps) * 1e4) / 1e4,
    r_target_2: Math.round((entryPrice + rps * 2) * 1e4) / 1e4,
    r_target_3: Math.round((entryPrice + rps * 3) * 1e4) / 1e4,
    reasons, rel_volume: relVolume, rel_strength: relStrength,
  };
}

// ============================================================
// 1. POWER BREAKOUT
// Aksje i opptrend (close > SMA50 > SMA200) som bryter ut.
// Kombinerer: breakout over motstand, volum, nærhet til 52u-topp.
// Erstatter VCP + Episodic + Volume Surge.
// ============================================================

function scanPowerBreakout(
  ind: IndicatorRow, prices: PriceRow[], capital: number
): ScanResult | null {
  if (!ind.sma_50 || !ind.atr_14) return null;
  const latest = prices[prices.length - 1];
  const prev = prices.length >= 2 ? prices[prices.length - 2] : null;
  if (!latest) return null;

  const rv = ind.rel_volume ?? 0;
  const rs = calcRelativeStrength(ind, latest.close);
  const reasons: string[] = [];
  let score = 0;

  // --- MUST: Opptrend (close > SMA50) ---
  if (latest.close <= ind.sma_50) return null;
  reasons.push('Over SMA50');
  score += 10;

  // Sterkere opptrend: SMA50 > SMA200
  if (ind.sma_200 && ind.sma_50 > ind.sma_200) {
    reasons.push('SMA50 > SMA200');
    score += 10;
  }

  // --- MUST: Opp-dag (close > open) ---
  if (latest.close <= latest.open) return null;

  // --- Breakout-signaler (trenger minst ett) ---
  let hasBreakoutSignal = false;

  // A) Bryter over SMA20 fra under (klassisk breakout)
  if (ind.sma_20 && latest.close > ind.sma_20 && prev && prev.close <= ind.sma_20) {
    reasons.push('Breakout over SMA20');
    score += 20;
    hasBreakoutSignal = true;
  }

  // B) Gap opp > 2% (nyhetsdrevet/katalysator)
  if (prev) {
    const gapPct = ((latest.open - prev.close) / prev.close) * 100;
    if (gapPct >= 2) {
      reasons.push(`Gap opp ${gapPct.toFixed(1)}%`);
      score += 15;
      if (gapPct >= 5) score += 10;
      hasBreakoutSignal = true;
    }
  }

  // C) Nær 52-ukers topp (innenfor 5%) og bryter høyere
  if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -5) {
    reasons.push(`${Math.abs(ind.pct_from_52w_high).toFixed(1)}% fra 52u-topp`);
    score += 15;
    hasBreakoutSignal = true;
  }

  // D) Konsolidering → breakout
  if (ind.is_consolidating && ind.consolidation_days >= 5) {
    reasons.push(`${ind.consolidation_days}d konsolidering → breakout`);
    score += 15;
    hasBreakoutSignal = true;
  }

  // E) Sterk dagens bevegelse (close i øvre 25% av 20d range)
  if (prices.length >= 10) {
    const recent10 = prices.slice(-10);
    const high10 = Math.max(...recent10.map(p => p.high));
    const low10 = Math.min(...recent10.map(p => p.low));
    const range10 = high10 - low10;
    if (range10 > 0 && (latest.close - low10) / range10 > 0.85) {
      reasons.push('Topp av 10d range');
      score += 10;
      hasBreakoutSignal = true;
    }
  }

  if (!hasBreakoutSignal) return null;

  // --- Volum-bekreftelse (bonus, ikke krav) ---
  if (rv >= 2.0) {
    reasons.push(`Volum ${rv.toFixed(1)}x — sterk`);
    score += 20;
  } else if (rv >= 1.3) {
    reasons.push(`Volum ${rv.toFixed(1)}x`);
    score += 10;
  }

  // --- RSI sweet spot ---
  if (ind.rsi_14 && ind.rsi_14 >= 50 && ind.rsi_14 <= 70) {
    score += 5;
  } else if (ind.rsi_14 && ind.rsi_14 >= 80) {
    reasons.push('Overkjøpt — forsiktig');
    score -= 5;
  }

  // --- Relative Strength bonus ---
  if (rs >= 80) score += 5;

  if (score < 45) return null;

  return buildResult(ind.symbol, 'BREAKOUT', 'POWER_BREAKOUT', score, latest.close,
    ind.atr_14, capital, reasons, rv, rs);
}

// ============================================================
// 2. 52-WEEK HIGH
// Aksjen lager ny 52-ukers topp. De sterkeste aksjene.
// ============================================================

function scan52WeekHigh(
  ind: IndicatorRow, prices: PriceRow[], capital: number
): ScanResult | null {
  if (!ind.high_52w || !ind.atr_14 || !ind.sma_50) return null;
  const latest = prices[prices.length - 1];
  if (!latest) return null;

  // Must be AT 52w high (within 1%)
  if (ind.pct_from_52w_high === null || ind.pct_from_52w_high < -1) return null;
  // Must be in uptrend
  if (latest.close <= ind.sma_50) return null;

  const rv = ind.rel_volume ?? 0;
  const rs = calcRelativeStrength(ind, latest.close);
  const reasons: string[] = [];
  let score = 30; // Base score for 52w high

  reasons.push('Ny 52-ukers høy!');

  if (ind.sma_200 && ind.sma_50 > ind.sma_200) {
    reasons.push('Sterk trend (SMA50 > SMA200)');
    score += 15;
  }

  if (ind.consolidation_days >= 5) {
    reasons.push(`Base: ${ind.consolidation_days}d`);
    score += 10;
  }

  if (rv >= 1.5) {
    reasons.push(`Volum ${rv.toFixed(1)}x`);
    score += 15;
  }

  // Green candle bonus
  if (latest.close > latest.open) score += 5;

  if (ind.rsi_14 && ind.rsi_14 >= 80) {
    reasons.push('Overkjøpt — kan være spent');
    score -= 5;
  }

  if (score < 45) return null;

  return buildResult(ind.symbol, 'BREAKOUT', 'HIGH_52W', score, latest.close,
    ind.atr_14, capital, reasons, rv, rs);
}

// ============================================================
// 3. CONTINUATION (Pullback-kjøp)
// Sterk opptrend, pullback til støtte, bouncer opp.
// ============================================================

function scanContinuation(
  ind: IndicatorRow, prices: PriceRow[], capital: number
): ScanResult | null {
  if (!ind.sma_10 || !ind.sma_20 || !ind.sma_50 || !ind.sma_200 || !ind.atr_14) return null;
  if (prices.length < 10) return null;
  const latest = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  if (!latest || !prev) return null;

  // Must: all SMAs aligned = strong uptrend
  if (!(ind.sma_10 > ind.sma_20 && ind.sma_20 > ind.sma_50 && ind.sma_50 > ind.sma_200)) return null;

  const rv = ind.rel_volume ?? 1;
  const rs = calcRelativeStrength(ind, latest.close);
  const reasons: string[] = [];
  let score = 25; // Base for being in strong uptrend

  reasons.push('Sterk opptrend');

  // Price near SMA10 or SMA20
  const dist10 = ((latest.close - ind.sma_10) / ind.sma_10) * 100;
  const dist20 = ((latest.close - ind.sma_20) / ind.sma_20) * 100;
  const near10 = dist10 >= -1.5 && dist10 <= 2;
  const near20 = dist20 >= -1.5 && dist20 <= 2;

  if (!near10 && !near20) return null;

  if (near10) {
    reasons.push(`Pullback til SMA10 (${dist10.toFixed(1)}%)`);
    score += 15;
  } else {
    reasons.push(`Pullback til SMA20 (${dist20.toFixed(1)}%)`);
    score += 10;
  }

  // Must show bounce
  if (latest.close > prev.close && latest.close > latest.open) {
    reasons.push('Bounce-dag');
    score += 15;
  } else if (latest.close > prev.close) {
    reasons.push('Høyere close');
    score += 10;
  } else if (latest.close > latest.open) {
    reasons.push('Grønn candle');
    score += 5;
  } else {
    return null;
  }

  // Low volume on pullback = healthy
  if (rv < 1.0) {
    reasons.push('Lavt volum på pullback');
    score += 10;
  }

  // Near 52w high = extra strong
  if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -15) {
    score += 10;
  }

  if (score < 50) return null;

  // Tighter stop: 1.5x ATR
  return buildResult(ind.symbol, 'KJERNE', 'CONTINUATION', score, latest.close,
    ind.atr_14, capital, reasons, rv, rs, 1.5);
}

// ============================================================
// 4. FAILED BREAKOUT (Advarsel)
// Forsøkte å bryte ut men falt tilbake. Unngå.
// ============================================================

function scanFailedBreakout(
  ind: IndicatorRow, prices: PriceRow[], capital: number
): ScanResult | null {
  if (!ind.sma_20 || !ind.atr_14 || !ind.high_52w) return null;
  if (prices.length < 10) return null;
  const latest = prices[prices.length - 1];
  if (!latest) return null;

  // Recent breakout attempt (near 52w high in last 5 days)
  let recentAttempt = false;
  for (let i = Math.max(0, prices.length - 6); i < prices.length - 1; i++) {
    if (((prices[i].high - ind.high_52w) / ind.high_52w) * 100 > -2) {
      recentAttempt = true;
      break;
    }
  }
  if (!recentAttempt) return null;

  // Now below SMA20 = failed
  if (latest.close >= ind.sma_20) return null;

  const rv = ind.rel_volume ?? 0;
  const rs = calcRelativeStrength(ind, latest.close);
  const reasons: string[] = ['⚠️ ADVARSEL: Feilet breakout'];
  let score = 40;

  reasons.push('Var nær 52u-topp, falt under SMA20');

  if (latest.close < latest.open) {
    reasons.push('Rød candle');
    score += 10;
  }
  if (rv >= 1.5) {
    reasons.push(`Salgsvolum ${rv.toFixed(1)}x`);
    score += 15;
  }
  if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high < -3) {
    score += 10;
  }

  if (score < 45) return null;

  return {
    symbol: ind.symbol, bucket: 'EVENT', signal_type: 'FAILED_BREAKOUT',
    score: Math.min(100, Math.round(score)),
    entry_price: latest.close, stop_price: ind.high_52w,
    stop_pct: Math.round(((ind.high_52w - latest.close) / latest.close) * 1e4) / 100,
    position_size_nok: 0,
    r_target_1: 0, r_target_2: 0, r_target_3: 0,
    reasons, rel_volume: rv, rel_strength: rs,
  };
}

// ============================================================
// MAIN SCANNER
// ============================================================

export async function runScanner(date?: string): Promise<ScanResult[]> {
  let targetDate = date;
  if (!targetDate) {
    const now = new Date();
    // Oslo closes 16:30 CEST = 14:30 UTC. Only use previous day before 15 UTC.
    const utcHour = now.getUTCHours();
    if (utcHour < 15) now.setDate(now.getDate() - 1);
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() - 2);
    else if (day === 6) now.setDate(now.getDate() - 1);
    targetDate = now.toISOString().split('T')[0];
  }

  const { data: configRows } = await getSupabase()
    .from('portfolio_config')
    .select('key, value')
    .in('key', ['total_capital', 'risk_per_trade_pct']);

  const config: Record<string, number> = {};
  configRows?.forEach(row => {
    config[row.key] = typeof row.value === 'string' ? parseFloat(row.value) : Number(row.value);
  });
  const totalCapital = config.total_capital || 656000;

  let { data: indicators } = await getSupabase()
    .from('indicators_daily').select('*').eq('date', targetDate);

  if (!indicators || indicators.length === 0) {
    const { data: latestRow } = await getSupabase()
      .from('indicators_daily').select('date')
      .lte('date', targetDate).order('date', { ascending: false })
      .limit(1).single();
    if (latestRow) {
      targetDate = latestRow.date;
      const result = await getSupabase()
        .from('indicators_daily').select('*').eq('date', targetDate);
      indicators = result.data;
    }
  }

  if (!indicators || indicators.length === 0) {
    console.log(`No indicators found for ${targetDate}`);
    return [];
  }

  console.log(`Scanning ${indicators.length} symbols for ${targetDate}`);
  const allSignals: ScanResult[] = [];

  for (const ind of indicators) {
    const { data: pricesDesc } = await getSupabase()
      .from('prices_daily').select('*').eq('symbol', ind.symbol)
      .lte('date', targetDate).order('date', { ascending: false }).limit(30);
    const prices = pricesDesc ? [...pricesDesc].reverse() : null;

    if (!prices || prices.length < 10) continue;

    const typed = prices.map((p: any) => ({
      date: p.date, open: Number(p.open), high: Number(p.high),
      low: Number(p.low), close: Number(p.close), volume: Number(p.volume),
    }));

    // Skip stale data: latest price must be within 5 trading days of target
    const latestPriceDate = new Date(typed[typed.length - 1].date);
    const target = new Date(targetDate as string);
    const daysDiff = Math.floor((target.getTime() - latestPriceDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 7) continue; // More than 7 calendar days = stale data

    if (!passesQualityFilter(ind, typed)) continue;

    // Run all 4 scanners — pick best if multiple match
    const power = scanPowerBreakout(ind, typed, totalCapital);
    if (power) allSignals.push(power);

    const high52 = scan52WeekHigh(ind, typed, totalCapital);
    if (high52) allSignals.push(high52);

    const cont = scanContinuation(ind, typed, totalCapital);
    if (cont) allSignals.push(cont);

    const failed = scanFailedBreakout(ind, typed, totalCapital);
    if (failed) allSignals.push(failed);
  }

  // Sort: failed last, then by score
  allSignals.sort((a, b) => {
    if (a.signal_type === 'FAILED_BREAKOUT' && b.signal_type !== 'FAILED_BREAKOUT') return 1;
    if (b.signal_type === 'FAILED_BREAKOUT' && a.signal_type !== 'FAILED_BREAKOUT') return -1;
    return b.score - a.score;
  });

  // Deduplicate: keep best signal per symbol (except FAILED_BREAKOUT which can coexist)
  const seen = new Set<string>();
  const deduped: ScanResult[] = [];
  for (const sig of allSignals) {
    if (sig.signal_type === 'FAILED_BREAKOUT') {
      deduped.push(sig);
      continue;
    }
    if (!seen.has(sig.symbol)) {
      seen.add(sig.symbol);
      deduped.push(sig);
    }
  }

  return deduped;
}

export async function runAndStoreSignals(date?: string): Promise<{
  signals: ScanResult[]; stored: number;
}> {
  const signals = await runScanner(date);
  if (signals.length === 0) return { signals: [], stored: 0 };

  const targetDate = date || (() => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (utcHour < 15) now.setDate(now.getDate() - 1);
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() - 2);
    else if (day === 6) now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
  })();

  const rows = signals.map(s => ({
    symbol: s.symbol, date: targetDate, bucket: s.bucket,
    signal_type: s.signal_type, score: s.score,
    entry_price: s.entry_price, stop_price: s.stop_price,
    stop_pct: s.stop_pct, position_size_nok: s.position_size_nok,
    r_target_1: s.r_target_1, r_target_2: s.r_target_2,
    r_target_3: s.r_target_3, reasons: s.reasons,
  }));

  const { error } = await getSupabase()
    .from('signals').upsert(rows, { onConflict: 'symbol,date,signal_type' });

  if (error) {
    console.error('Signal store error:', error);
    return { signals, stored: 0 };
  }

  return { signals, stored: rows.length };
}
