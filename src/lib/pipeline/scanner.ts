/**
 * Scanner — finds actionable setups from computed indicators
 *
 * Patterns detected:
 * 1. VCP_BREAKOUT     — Volatility Contraction Pattern (Minervini)
 * 2. HIGH_52W         — New 52-week high after base
 * 3. VOLUME_SURGE     — Volume Dry-Up followed by explosion
 * 4. EPISODIC_PIVOT   — Gap up on huge volume (earnings/news catalyst)
 * 5. CONTINUATION     — Pullback to rising SMA in strong uptrend
 * 6. FAILED_BREAKOUT  — Breakout that reversed = avoid / short candidate
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
  rel_strength: number; // vs own 52w range: 0-100
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
// QUALITY FILTERS — reject illiquid junk and untradeable names
// ============================================================

function passesQualityFilter(indicator: IndicatorRow, prices: PriceRow[]): boolean {
  if (prices.length < 15) return false;

  const latest = prices[prices.length - 1];
  if (!latest) return false;

  // Minimum price: skip penny stocks (< 1 NOK / $1)
  if (latest.close < 1) return false;

  // Minimum volume: skip illiquid (avg volume must be > 10,000)
  if (indicator.vol_sma_50 && indicator.vol_sma_50 < 10000) return false;

  // Minimum volatility: ATR% must be reasonable (> 0.5% per day)
  if (indicator.atr_pct && indicator.atr_pct < 0.5) return false;

  // Must have enough history for SMA50
  if (!indicator.sma_50) return false;

  return true;
}

// ============================================================
// RELATIVE STRENGTH — where in 52w range
// ============================================================

function calcRelativeStrength(indicator: IndicatorRow, close: number): number {
  if (!indicator.high_52w || !indicator.low_52w) return 50;
  const range = indicator.high_52w - indicator.low_52w;
  if (range <= 0) return 50;
  return Math.round(((close - indicator.low_52w) / range) * 100);
}

// ============================================================
// POSITION SIZING
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

function buildResult(
  symbol: string,
  bucket: 'BREAKOUT' | 'EVENT' | 'KJERNE' | 'INNTEKT',
  signalType: string,
  score: number,
  entryPrice: number,
  atr: number,
  capital: number,
  reasons: string[],
  relVolume: number,
  relStrength: number,
): ScanResult {
  const atr2x = atr * 2;
  const stopPrice = Math.round((entryPrice - atr2x) * 10000) / 10000;
  const stopPct = ((entryPrice - stopPrice) / entryPrice) * 100;
  const riskPerShare = entryPrice - stopPrice;

  return {
    symbol,
    bucket,
    signal_type: signalType,
    score: Math.min(100, Math.round(score)),
    entry_price: entryPrice,
    stop_price: stopPrice,
    stop_pct: Math.round(stopPct * 100) / 100,
    position_size_nok: calculatePositionSize(entryPrice, stopPrice, capital),
    r_target_1: Math.round((entryPrice + riskPerShare) * 10000) / 10000,
    r_target_2: Math.round((entryPrice + riskPerShare * 2) * 10000) / 10000,
    r_target_3: Math.round((entryPrice + riskPerShare * 3) * 10000) / 10000,
    reasons,
    rel_volume: relVolume,
    rel_strength: relStrength,
  };
}

// ============================================================
// SCAN FUNCTIONS
// ============================================================

/**
 * 1. VCP Breakout: Volatility Contraction → Breakout above SMA20 with volume
 */
function scanVCPBreakout(
  ind: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!ind.sma_50 || !ind.sma_200 || !ind.atr_14) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  // Uptrend: close > SMA50 > SMA200
  if (latest.close <= ind.sma_50 || ind.sma_50 <= ind.sma_200) return null;
  reasons.push('Uptrend: close > SMA50 > SMA200');
  score += 20;

  // Consolidating 8+ days
  if (!ind.is_consolidating || ind.consolidation_days < 8) return null;
  reasons.push(`Konsolidert ${ind.consolidation_days} dager`);
  score += 15;

  // Breakout above SMA20
  if (!ind.sma_20 || latest.close <= ind.sma_20) return null;
  if (prices.length >= 2) {
    const yesterday = prices[prices.length - 2];
    if (yesterday.close > (ind.sma_20 ?? 0) * 1.02) return null;
  }
  reasons.push('Breakout over SMA20');
  score += 20;

  // Volume confirmation
  const rv = ind.rel_volume ?? 0;
  if (rv >= 1.5) {
    reasons.push(`Volum ${rv.toFixed(1)}x snitt`);
    score += Math.min(25, rv * 10);
  } else {
    score -= 10;
    reasons.push('Svak volum');
  }

  // RSI sweet spot
  if (ind.rsi_14 && ind.rsi_14 >= 40 && ind.rsi_14 <= 70) {
    reasons.push(`RSI ${ind.rsi_14.toFixed(0)}`);
    score += 10;
  }

  // Near 52w high
  if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -15) {
    score += 10;
  }

  if (score < 50) return null;

  return buildResult(ind.symbol, 'BREAKOUT', 'VCP_BREAKOUT', score, latest.close,
    ind.atr_14, capital, reasons, rv, calcRelativeStrength(ind, latest.close));
}

/**
 * 2. 52-Week High Breakout
 */
function scan52WeekBreakout(
  ind: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!ind.high_52w || !ind.atr_14 || !ind.sma_50) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  // At or above 52w high
  if (ind.pct_from_52w_high === null || ind.pct_from_52w_high < -1) return null;
  reasons.push('Ny 52-ukers hoy!');
  score += 30;

  // Base period
  if (ind.consolidation_days >= 5) {
    reasons.push(`Base: ${ind.consolidation_days}d konsolidering`);
    score += 15;
  }

  // Trend filter
  if (latest.close <= ind.sma_50) return null;
  reasons.push('Over SMA50');
  score += 10;

  if (ind.sma_200 && ind.sma_50 > ind.sma_200) {
    reasons.push('SMA50 > SMA200');
    score += 10;
  }

  // Volume
  const rv = ind.rel_volume ?? 0;
  if (rv >= 2.0) {
    reasons.push(`Volum ${rv.toFixed(1)}x — sterk`);
    score += 20;
  } else if (rv >= 1.5) {
    reasons.push(`Volum ${rv.toFixed(1)}x`);
    score += 10;
  }

  if (ind.rsi_14 && ind.rsi_14 >= 80) {
    reasons.push(`RSI ${ind.rsi_14.toFixed(0)} — overkjopt`);
    score -= 10;
  }

  if (score < 45) return null;

  return buildResult(ind.symbol, 'BREAKOUT', 'HIGH_52W', score, latest.close,
    ind.atr_14, capital, reasons, rv, calcRelativeStrength(ind, latest.close));
}

/**
 * 3. Volume Surge: dry-up then explosion
 */
function scanVolumeSurge(
  ind: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!ind.vol_sma_50 || !ind.atr_14 || !ind.sma_50) return null;
  if (prices.length < 15) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  const rv = ind.rel_volume ?? 0;
  if (rv < 2.0) return null;

  // Dry-up check
  const avgVol = ind.vol_sma_50;
  let dryUpDays = 0;
  for (let i = prices.length - 10; i < prices.length - 1; i++) {
    if (i >= 0 && prices[i].volume < avgVol * 0.5) dryUpDays++;
  }
  if (dryUpDays < 3) return null;

  reasons.push(`${dryUpDays} dager volum-pause → ${rv.toFixed(1)}x eksplosjon`);
  score += 40;

  // Up day
  if (latest.close <= latest.open) return null;
  reasons.push('Opp-dag med volum');
  score += 10;

  if (latest.close > ind.sma_50) {
    reasons.push('Over SMA50');
    score += 10;
  }

  if (ind.sma_200 && ind.sma_50 > ind.sma_200) score += 10;
  if (ind.rsi_14 && ind.rsi_14 >= 40 && ind.rsi_14 <= 75) score += 10;

  if (score < 50) return null;

  return buildResult(ind.symbol, 'BREAKOUT', 'VOLUME_SURGE', score, latest.close,
    ind.atr_14, capital, reasons, rv, calcRelativeStrength(ind, latest.close));
}

/**
 * 4. Episodic Pivot: Gap up > 3% on volume > 2x average.
 * Typically earnings, FDA, contract — the "news catalyst" move.
 * Kristjan Kullamägi / Qullamaggie style.
 */
function scanEpisodicPivot(
  ind: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!ind.atr_14 || !ind.sma_50 || prices.length < 10) return null;

  const latest = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  if (!latest || !prev) return null;

  const reasons: string[] = [];
  let score = 0;

  // Gap up: today's open > yesterday's high
  const gapPct = ((latest.open - prev.close) / prev.close) * 100;
  if (gapPct < 3) return null;
  reasons.push(`Gap opp ${gapPct.toFixed(1)}%`);
  score += 25;

  // Bigger gap = stronger signal
  if (gapPct >= 8) score += 15;
  else if (gapPct >= 5) score += 10;

  // Must close in upper half of day's range (buyers holding)
  const dayRange = latest.high - latest.low;
  if (dayRange > 0) {
    const closePosition = (latest.close - latest.low) / dayRange;
    if (closePosition < 0.5) return null; // Weak close = reversal likely
    reasons.push(`Close i ovre ${Math.round(closePosition * 100)}% av range`);
    score += 10;
  }

  // Volume must be huge
  const rv = ind.rel_volume ?? 0;
  if (rv < 2.0) return null;
  reasons.push(`Volum ${rv.toFixed(1)}x snitt`);
  score += Math.min(25, rv * 8);

  // Close above open (green candle)
  if (latest.close > latest.open) {
    score += 5;
  }

  // Price above SMA50 (trend context)
  if (latest.close > ind.sma_50) {
    reasons.push('Over SMA50');
    score += 10;
  }

  if (score < 50) return null;

  return buildResult(ind.symbol, 'EVENT', 'EPISODIC_PIVOT', score, latest.close,
    ind.atr_14, capital, reasons, rv, calcRelativeStrength(ind, latest.close));
}

/**
 * 5. Continuation / Pullback Buy: Strong uptrend stock pulls back to
 * rising SMA10 or SMA20. Entry on bounce. Mark Minervini "buy the dip."
 */
function scanContinuation(
  ind: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!ind.sma_10 || !ind.sma_20 || !ind.sma_50 || !ind.sma_200 || !ind.atr_14) return null;
  if (prices.length < 10) return null;

  const latest = prices[prices.length - 1];
  const prev = prices[prices.length - 2];
  if (!latest || !prev) return null;

  const reasons: string[] = [];
  let score = 0;

  // Strong uptrend: SMA10 > SMA20 > SMA50 > SMA200
  if (!(ind.sma_10 > ind.sma_20 && ind.sma_20 > ind.sma_50 && ind.sma_50 > ind.sma_200)) return null;
  reasons.push('Sterk opptrend: alle SMA stiger');
  score += 25;

  // Price pulled back to SMA10 or SMA20 (within 1.5% of either)
  const distToSma10 = ((latest.close - ind.sma_10) / ind.sma_10) * 100;
  const distToSma20 = ((latest.close - ind.sma_20) / ind.sma_20) * 100;

  const touchesSma10 = distToSma10 >= -1.5 && distToSma10 <= 2;
  const touchesSma20 = distToSma20 >= -1.5 && distToSma20 <= 2;

  if (!touchesSma10 && !touchesSma20) return null;

  if (touchesSma10) {
    reasons.push(`Pullback til SMA10 (${distToSma10.toFixed(1)}%)`);
    score += 15;
  } else {
    reasons.push(`Pullback til SMA20 (${distToSma20.toFixed(1)}%)`);
    score += 10;
  }

  // Today should show bounce (close > open, or close > yesterday's close)
  if (latest.close > prev.close && latest.close > latest.open) {
    reasons.push('Bounce-dag (gronn candle)');
    score += 15;
  } else if (latest.close > prev.close) {
    reasons.push('Hoyere close enn i gar');
    score += 10;
  } else {
    return null; // Still falling, wait
  }

  // Volume decreasing on pullback is ideal
  const rv = ind.rel_volume ?? 1;
  if (rv < 1.0) {
    reasons.push('Lavt volum pa pullback (bra!)');
    score += 10;
  }

  // RS check
  if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high > -15) {
    reasons.push(`${Math.abs(ind.pct_from_52w_high).toFixed(0)}% fra 52u-topp`);
    score += 10;
  }

  if (ind.rsi_14 && ind.rsi_14 >= 40 && ind.rsi_14 <= 65) {
    score += 5;
  }

  if (score < 50) return null;

  // Tighter stop for continuation: 1.5x ATR instead of 2x
  const tighterAtr = ind.atr_14 * 1.5;
  const stopPrice = Math.round((latest.close - tighterAtr) * 10000) / 10000;
  const stopPct = ((latest.close - stopPrice) / latest.close) * 100;
  const riskPerShare = latest.close - stopPrice;

  return {
    symbol: ind.symbol,
    bucket: 'KJERNE',
    signal_type: 'CONTINUATION',
    score: Math.min(100, Math.round(score)),
    entry_price: latest.close,
    stop_price: stopPrice,
    stop_pct: Math.round(stopPct * 100) / 100,
    position_size_nok: calculatePositionSize(latest.close, stopPrice, capital),
    r_target_1: Math.round((latest.close + riskPerShare) * 10000) / 10000,
    r_target_2: Math.round((latest.close + riskPerShare * 2) * 10000) / 10000,
    r_target_3: Math.round((latest.close + riskPerShare * 3) * 10000) / 10000,
    reasons,
    rel_volume: rv,
    rel_strength: calcRelativeStrength(ind, latest.close),
  };
}

/**
 * 6. Failed Breakout: Stock broke to new high / above SMA20 recently but
 * reversed back below. WARNING signal — avoid or consider short.
 */
function scanFailedBreakout(
  ind: IndicatorRow,
  prices: PriceRow[],
  capital: number
): ScanResult | null {
  if (!ind.sma_20 || !ind.atr_14 || !ind.high_52w) return null;
  if (prices.length < 10) return null;

  const latest = prices[prices.length - 1];
  if (!latest) return null;

  const reasons: string[] = [];
  let score = 0;

  // Check if any of last 5 days was near 52w high (within 2%)
  let recentBreakoutAttempt = false;
  for (let i = Math.max(0, prices.length - 6); i < prices.length - 1; i++) {
    const pctFromHigh = ((prices[i].high - ind.high_52w) / ind.high_52w) * 100;
    if (pctFromHigh > -2) {
      recentBreakoutAttempt = true;
      break;
    }
  }

  if (!recentBreakoutAttempt) return null;
  reasons.push('Nylig breakout-forsok (naer 52u-topp siste 5d)');
  score += 20;

  // Now trading BELOW SMA20 = failed
  if (latest.close >= ind.sma_20) return null;
  reasons.push(`Falt tilbake under SMA20`);
  score += 20;

  // Close below open (red candle)
  if (latest.close < latest.open) {
    reasons.push('Rod candle');
    score += 10;
  }

  // Volume on the reversal
  const rv = ind.rel_volume ?? 0;
  if (rv >= 1.5) {
    reasons.push(`Salgsvolum ${rv.toFixed(1)}x`);
    score += 15;
  }

  // Falling from 52w high territory
  if (ind.pct_from_52w_high !== null && ind.pct_from_52w_high < -3) {
    reasons.push(`${Math.abs(ind.pct_from_52w_high).toFixed(1)}% under topp`);
    score += 10;
  }

  if (score < 45) return null;

  // For failed breakouts: entry = current price, stop = above recent high
  // This is a WARNING signal, not a buy signal
  return {
    symbol: ind.symbol,
    bucket: 'EVENT',
    signal_type: 'FAILED_BREAKOUT',
    score: Math.min(100, Math.round(score)),
    entry_price: latest.close,
    stop_price: ind.high_52w, // "Stop" = level where you'd be wrong about the failure
    stop_pct: Math.round(((ind.high_52w - latest.close) / latest.close) * 100 * 100) / 100,
    position_size_nok: 0, // No position — this is a warning
    r_target_1: 0,
    r_target_2: 0,
    r_target_3: 0,
    reasons: ['⚠️ ADVARSEL: Feilet breakout — unnga denne', ...reasons],
    rel_volume: rv,
    rel_strength: calcRelativeStrength(ind, latest.close),
  };
}

// ============================================================
// MAIN SCANNER
// ============================================================

export async function runScanner(date?: string): Promise<ScanResult[]> {
  // Use last completed trading day if no date given
  let targetDate = date;
  if (!targetDate) {
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (utcHour < 22) now.setDate(now.getDate() - 1);
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() - 2);
    else if (day === 6) now.setDate(now.getDate() - 1);
    targetDate = now.toISOString().split('T')[0];
  }

  // Get portfolio config
  const { data: configRows } = await getSupabase()
    .from('portfolio_config')
    .select('key, value')
    .in('key', ['total_capital', 'risk_per_trade_pct']);

  const config: Record<string, number> = {};
  configRows?.forEach(row => {
    config[row.key] = typeof row.value === 'string' ? parseFloat(row.value) : Number(row.value);
  });
  const totalCapital = config.total_capital || 656000;

  // Get indicators — try target date first, then most recent date
  let { data: indicators } = await getSupabase()
    .from('indicators_daily')
    .select('*')
    .eq('date', targetDate);

  // If no indicators for target date, find the most recent date that has data
  if (!indicators || indicators.length === 0) {
    const { data: latestRow } = await getSupabase()
      .from('indicators_daily')
      .select('date')
      .lte('date', targetDate)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (latestRow) {
      targetDate = latestRow.date;
      const result = await getSupabase()
        .from('indicators_daily')
        .select('*')
        .eq('date', targetDate);
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
    // Fetch last 20 price bars
    const { data: prices } = await getSupabase()
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

    // Quality gate
    if (!passesQualityFilter(ind, typedPrices)) continue;

    // Run ALL scanners
    const vcp = scanVCPBreakout(ind, typedPrices, totalCapital);
    if (vcp) allSignals.push(vcp);

    const high52w = scan52WeekBreakout(ind, typedPrices, totalCapital);
    if (high52w) allSignals.push(high52w);

    const volSurge = scanVolumeSurge(ind, typedPrices, totalCapital);
    if (volSurge) allSignals.push(volSurge);

    const episodic = scanEpisodicPivot(ind, typedPrices, totalCapital);
    if (episodic) allSignals.push(episodic);

    const continuation = scanContinuation(ind, typedPrices, totalCapital);
    if (continuation) allSignals.push(continuation);

    const failedBO = scanFailedBreakout(ind, typedPrices, totalCapital);
    if (failedBO) allSignals.push(failedBO);
  }

  // Sort: failed breakouts last, then by score
  allSignals.sort((a, b) => {
    if (a.signal_type === 'FAILED_BREAKOUT' && b.signal_type !== 'FAILED_BREAKOUT') return 1;
    if (b.signal_type === 'FAILED_BREAKOUT' && a.signal_type !== 'FAILED_BREAKOUT') return -1;
    return b.score - a.score;
  });

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

  if (signals.length === 0) {
    return { signals: [], stored: 0 };
  }

  // Use the date from the first signal (scanner may have adjusted it)
  const targetDate = date || (() => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    if (utcHour < 22) now.setDate(now.getDate() - 1);
    const day = now.getDay();
    if (day === 0) now.setDate(now.getDate() - 2);
    else if (day === 6) now.setDate(now.getDate() - 1);
    return now.toISOString().split('T')[0];
  })();

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

  const { error } = await getSupabase()
    .from('signals')
    .upsert(rows, { onConflict: 'symbol,date,signal_type' });

  if (error) {
    console.error('Signal store error:', error);
    return { signals, stored: 0 };
  }

  return { signals, stored: rows.length };
}
