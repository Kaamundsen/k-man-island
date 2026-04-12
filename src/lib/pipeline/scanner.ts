/**
 * Breakout Scanner — finds actionable setups from computed indicators
 *
 * Signal-as-pure-function: indicators in → signals out.
 * No side effects in the scan functions themselves.
 *
 * Patterns detected:
 * 1. VCP_BREAKOUT  — Volatility Contraction Pattern (Minervini)
 * 2. HIGH_52W      — New 52-week high after base
 * 3. VOLUME_SURGE  — Volume Dry-Up followed by volume explosion
 * 4. POCKET_PIVOT  — Up day on volume > any down day volume in last 10
 * 5. SMART_MONEY   — Insider/Teigland buy detected
 */

import { supabase } from '@/lib/supabase/client';

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
// POSITION SIZING — the core risk management function
// ============================================================

function calculatePositionSize(
  entryPrice: number,
  stopPrice: number,
  totalCapital: number,
  riskPerTradePct: number = 1
): number {
  const riskPerShare = entryPrice - stopPrice;
  if (riskPerShare <= 0) return 0;

  const riskAmount = totalCapital * (riskPerTradePct / 100);
  const shares = Math.floor(riskAmount / riskPerShare);
  const positionValue = shares * entryPrice;

  // Never more than 20% of capital in one position
  const maxPosition = totalCapital * 0.20;
  if (positionValue > maxPosition) {
    return Math.floor(maxPosition / entryPrice) * entryPrice;
  }

  return Math.round(positionValue);
}

// ============================================================
// SCAN FUNCTIONS — pure, testable
// ============================================================

/**
 * VCP Breakout: price consolidating (ATR declining), then breaks above
 * SMA20 with volume surge. Classic Minervini pattern.
 */
function scanVCPBreakout(
  indicator: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!indicator.sma_50 || !indicator.sma_200 || !indicator.atr_14) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  // Must be in uptrend: close > SMA50 > SMA200
  if (latest.close <= indicator.sma_50 || indicator.sma_50 <= indicator.sma_200) return null;
  reasons.push('Uptrend: close > SMA50 > SMA200');
  score += 20;

  // Must have been consolidating (ATR declining)
  if (!indicator.is_consolidating || indicator.consolidation_days < 8) return null;
  reasons.push(`Konsolidert ${indicator.consolidation_days} dager (ATR fallende)`);
  score += 15;

  // Today's close should break above SMA20 (breakout from tight range)
  if (!indicator.sma_20 || latest.close <= indicator.sma_20) return null;

  // Check if yesterday was below or at SMA20 (confirming fresh breakout)
  if (prices.length >= 2) {
    const yesterday = prices[prices.length - 2];
    const prevSma20 = indicator.sma_20; // approximation
    if (yesterday.close > prevSma20 * 1.02) return null; // Already above, not a fresh breakout
  }
  reasons.push('Breakout over SMA20');
  score += 20;

  // Volume confirmation
  if (indicator.rel_volume && indicator.rel_volume >= 1.5) {
    reasons.push(`Volum ${indicator.rel_volume.toFixed(1)}x snitt`);
    score += Math.min(25, indicator.rel_volume * 10);
  } else {
    // No volume confirmation = weaker signal
    score -= 10;
    reasons.push('Svak volum (under 1.5x snitt)');
  }

  // RSI sweet spot (40-70 = healthy momentum, not overbought)
  if (indicator.rsi_14 && indicator.rsi_14 >= 40 && indicator.rsi_14 <= 70) {
    reasons.push(`RSI ${indicator.rsi_14.toFixed(0)} (god sone)`);
    score += 10;
  }

  // Not too far from 52w high (within 15%)
  if (indicator.pct_from_52w_high !== null && indicator.pct_from_52w_high > -15) {
    reasons.push(`${Math.abs(indicator.pct_from_52w_high).toFixed(1)}% fra 52u-topp`);
    score += 10;
  }

  if (score < 50) return null;

  // Calculate trade plan
  const entryPrice = latest.close;
  const atr2x = indicator.atr_14 * 2;
  const stopPrice = Math.round((entryPrice - atr2x) * 10000) / 10000;
  const stopPct = ((entryPrice - stopPrice) / entryPrice) * 100;
  const riskPerShare = entryPrice - stopPrice;

  return {
    symbol: indicator.symbol,
    bucket: 'BREAKOUT',
    signal_type: 'VCP_BREAKOUT',
    score: Math.min(100, Math.round(score)),
    entry_price: entryPrice,
    stop_price: stopPrice,
    stop_pct: Math.round(stopPct * 100) / 100,
    position_size_nok: calculatePositionSize(entryPrice, stopPrice, capital),
    r_target_1: Math.round((entryPrice + riskPerShare) * 10000) / 10000,
    r_target_2: Math.round((entryPrice + riskPerShare * 2) * 10000) / 10000,
    r_target_3: Math.round((entryPrice + riskPerShare * 3) * 10000) / 10000,
    reasons,
  };
}

/**
 * 52-Week High Breakout: new 52w high after period of consolidation.
 * George & Hwang (2004) showed 52w-high momentum predicts returns.
 */
function scan52WeekBreakout(
  indicator: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!indicator.high_52w || !indicator.atr_14 || !indicator.sma_50) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  // Must be at or above 52w high (within 1%)
  if (indicator.pct_from_52w_high === null || indicator.pct_from_52w_high < -1) return null;
  reasons.push('Ny 52-ukers høy!');
  score += 30;

  // Should have a base period (consolidation before breakout)
  if (indicator.consolidation_days >= 5) {
    reasons.push(`Base: ${indicator.consolidation_days} dager konsolidering`);
    score += 15;
  }

  // Trend filter: close > SMA50
  if (latest.close > indicator.sma_50) {
    reasons.push('Over SMA50');
    score += 10;
  } else {
    return null; // Don't buy 52w highs in downtrends
  }

  // SMA50 > SMA200 (golden cross territory)
  if (indicator.sma_200 && indicator.sma_50 > indicator.sma_200) {
    reasons.push('SMA50 > SMA200 (opptrend)');
    score += 10;
  }

  // Volume surge
  if (indicator.rel_volume && indicator.rel_volume >= 2.0) {
    reasons.push(`Volum ${indicator.rel_volume.toFixed(1)}x snitt — sterk bekreftelse`);
    score += 20;
  } else if (indicator.rel_volume && indicator.rel_volume >= 1.5) {
    reasons.push(`Volum ${indicator.rel_volume.toFixed(1)}x snitt`);
    score += 10;
  }

  // RSI not overbought
  if (indicator.rsi_14 && indicator.rsi_14 < 80) {
    score += 5;
  } else if (indicator.rsi_14 && indicator.rsi_14 >= 80) {
    reasons.push(`RSI ${indicator.rsi_14.toFixed(0)} — overkjøpt, forsiktig`);
    score -= 10;
  }

  if (score < 45) return null;

  const entryPrice = latest.close;
  const atr2x = indicator.atr_14 * 2;
  const stopPrice = Math.round((entryPrice - atr2x) * 10000) / 10000;
  const stopPct = ((entryPrice - stopPrice) / entryPrice) * 100;
  const riskPerShare = entryPrice - stopPrice;

  return {
    symbol: indicator.symbol,
    bucket: 'BREAKOUT',
    signal_type: 'HIGH_52W',
    score: Math.min(100, Math.round(score)),
    entry_price: entryPrice,
    stop_price: stopPrice,
    stop_pct: Math.round(stopPct * 100) / 100,
    position_size_nok: calculatePositionSize(entryPrice, stopPrice, capital),
    r_target_1: Math.round((entryPrice + riskPerShare) * 10000) / 10000,
    r_target_2: Math.round((entryPrice + riskPerShare * 2) * 10000) / 10000,
    r_target_3: Math.round((entryPrice + riskPerShare * 3) * 10000) / 10000,
    reasons,
  };
}

/**
 * Volume Surge after Dry-Up: volume drops to <50% of avg for 5+ days,
 * then explodes >2x avg. Classic institutional accumulation pattern.
 */
function scanVolumeSurge(
  indicator: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!indicator.vol_sma_50 || !indicator.atr_14 || !indicator.sma_50) return null;
  if (prices.length < 15) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  // Today: volume must be >2x average
  if (!indicator.rel_volume || indicator.rel_volume < 2.0) return null;

  // Check for dry-up in the 5-10 days before
  const avgVol = indicator.vol_sma_50;
  let dryUpDays = 0;
  for (let i = prices.length - 10; i < prices.length - 1; i++) {
    if (i >= 0 && prices[i].volume < avgVol * 0.5) {
      dryUpDays++;
    }
  }

  if (dryUpDays < 3) return null;
  reasons.push(`Volum dry-up: ${dryUpDays} dager under 50% av snitt`);
  score += 20;

  reasons.push(`Volum-eksplosjon: ${indicator.rel_volume.toFixed(1)}x snitt`);
  score += 20;

  // Must be an up day
  if (latest.close <= latest.open) return null;
  reasons.push('Opp-dag med volum');
  score += 10;

  // Trend filter
  if (latest.close > indicator.sma_50) {
    reasons.push('Over SMA50');
    score += 10;
  }

  if (indicator.sma_200 && indicator.sma_50 > indicator.sma_200) {
    score += 10;
  }

  // RSI
  if (indicator.rsi_14 && indicator.rsi_14 >= 40 && indicator.rsi_14 <= 75) {
    score += 10;
  }

  if (score < 50) return null;

  const entryPrice = latest.close;
  const atr2x = indicator.atr_14 * 2;
  const stopPrice = Math.round((entryPrice - atr2x) * 10000) / 10000;
  const stopPct = ((entryPrice - stopPrice) / entryPrice) * 100;
  const riskPerShare = entryPrice - stopPrice;

  return {
    symbol: indicator.symbol,
    bucket: 'BREAKOUT',
    signal_type: 'VOLUME_SURGE',
    score: Math.min(100, Math.round(score)),
    entry_price: entryPrice,
    stop_price: stopPrice,
    stop_pct: Math.round(stopPct * 100) / 100,
    position_size_nok: calculatePositionSize(entryPrice, stopPrice, capital),
    r_target_1: Math.round((entryPrice + riskPerShare) * 10000) / 10000,
    r_target_2: Math.round((entryPrice + riskPerShare * 2) * 10000) / 10000,
    r_target_3: Math.round((entryPrice + riskPerShare * 3) * 10000) / 10000,
    reasons,
  };
}

// ============================================================
// MAIN SCANNER
// ============================================================

/**
 * Run all scanners for a given date. Returns ranked list of signals.
 */
export async function runScanner(
  date?: string
): Promise<ScanResult[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];

  // Get portfolio config
  const { data: configRows } = await supabase
    .from('portfolio_config')
    .select('key, value')
    .in('key', ['total_capital', 'risk_per_trade_pct']);

  const config: Record<string, number> = {};
  configRows?.forEach(row => {
    config[row.key] = typeof row.value === 'string' ? parseFloat(row.value) : Number(row.value);
  });
  const totalCapital = config.total_capital || 656000;

  // Get all indicators for this date
  const { data: indicators, error } = await supabase
    .from('indicators_daily')
    .select('*')
    .eq('date', targetDate);

  if (error || !indicators || indicators.length === 0) {
    console.log(`No indicators found for ${targetDate}`);
    return [];
  }

  const allSignals: ScanResult[] = [];

  for (const ind of indicators) {
    // Fetch last 20 price bars for pattern context
    const { data: prices } = await supabase
      .from('prices_daily')
      .select('*')
      .eq('symbol', ind.symbol)
      .lte('date', targetDate)
      .order('date', { ascending: true })
      .limit(20);

    if (!prices || prices.length < 10) continue;

    const typedPrices = prices.map((p: any) => ({
      date: p.date,
      open: Number(p.open),
      high: Number(p.high),
      low: Number(p.low),
      close: Number(p.close),
      volume: Number(p.volume),
    }));

    // Run all scanners
    const vcp = scanVCPBreakout(ind, typedPrices, totalCapital);
    if (vcp) allSignals.push(vcp);

    const high52w = scan52WeekBreakout(ind, typedPrices, totalCapital);
    if (high52w) allSignals.push(high52w);

    const volSurge = scanVolumeSurge(ind, typedPrices, totalCapital);
    if (volSurge) allSignals.push(volSurge);
  }

  // Sort by score descending
  allSignals.sort((a, b) => b.score - a.score);

  return allSignals;
}

/**
 * Run scanner and persist results to signals table.
 */
export async function runAndStoreSignals(date?: string): Promise<{
  signals: ScanResult[];
  stored: number;
}> {
  const signals = await runScanner(date);
  const targetDate = date || new Date().toISOString().split('T')[0];

  if (signals.length === 0) {
    return { signals: [], stored: 0 };
  }

  const rows = signals.map(s => ({
    symbol: s.symbol,
    date: targetDate,
    bucket: s.bucket,
    signal_type: s.signal_type,
    score: s.score,
    entry_price: s.entry_price,
    stop_price: s.stop_price,
    stop_pct: s.stop_pct,
    position_size_nok: s.position_size_nok,
    r_target_1: s.r_target_1,
    r_target_2: s.r_target_2,
    r_target_3: s.r_target_3,
    reasons: s.reasons,
  }));

  const { error } = await supabase
    .from('signals')
    .upsert(rows, { onConflict: 'symbol,date,signal_type' });

  if (error) {
    console.error('Signal store error:', error);
    return { signals, stored: 0 };
  }

  return { signals, stored: rows.length };
}
