/**
 * Compute outcomes for all signals in signal_results table.
 *
 * For each signal:
 *   - Entry = T+1 open (realistic entry price)
 *   - Checks T+1 through T+20 daily candles
 *   - Marks outcome: STOP / TARGET_1 / TARGET_2 / TARGET_3 / TIME_EXIT / OPEN
 *   - Calculates R-multiple achieved
 *
 * Usage:
 *   npx tsx scripts/compute-signal-results.ts        # process all pending
 *   npx tsx scripts/compute-signal-results.ts --init # seed table from signals, then compute
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const HOLD_DAYS = 20; // max trading days to hold

// Get trading days after a given date from our price data
async function getTradingDaysAfter(symbol: string, fromDate: string, n: number): Promise<any[]> {
  const { data } = await supabase
    .from('prices_daily')
    .select('date,open,high,low,close')
    .eq('symbol', symbol)
    .gt('date', fromDate)
    .order('date', { ascending: true })
    .limit(n + 5); // extra buffer for weekends/holidays
  return (data || []).slice(0, n);
}

function computeOutcome(
  entryActual: number,
  stopPrice: number,
  target1: number,
  target2: number,
  target3: number,
  prices: any[]
) {
  const rUnit = entryActual - stopPrice;
  if (rUnit <= 0) return null;

  let maxR = 0;
  let minR = 0;

  for (let i = 0; i < prices.length; i++) {
    const p = prices[i];
    const high = Number(p.high);
    const low = Number(p.low);

    // Check stop first (worst case — stop could be hit before high on same day)
    if (low <= stopPrice) {
      const rMultiple = -1;
      return {
        outcome: 'STOP' as const,
        outcome_date: p.date,
        outcome_price: stopPrice,
        days_held: i + 1,
        r_multiple: rMultiple,
        max_r_achieved: maxR,
        max_drawdown_r: minR,
      };
    }

    // Check targets (best case)
    if (high >= target3) {
      const rMultiple = (target3 - entryActual) / rUnit;
      return {
        outcome: 'TARGET_3' as const,
        outcome_date: p.date,
        outcome_price: target3,
        days_held: i + 1,
        r_multiple: Math.round(rMultiple * 100) / 100,
        max_r_achieved: Math.max(maxR, rMultiple),
        max_drawdown_r: minR,
      };
    }
    if (high >= target2) {
      const rMultiple = (target2 - entryActual) / rUnit;
      return {
        outcome: 'TARGET_2' as const,
        outcome_date: p.date,
        outcome_price: target2,
        days_held: i + 1,
        r_multiple: Math.round(rMultiple * 100) / 100,
        max_r_achieved: Math.max(maxR, rMultiple),
        max_drawdown_r: minR,
      };
    }
    if (high >= target1) {
      const rMultiple = (target1 - entryActual) / rUnit;
      return {
        outcome: 'TARGET_1' as const,
        outcome_date: p.date,
        outcome_price: target1,
        days_held: i + 1,
        r_multiple: Math.round(rMultiple * 100) / 100,
        max_r_achieved: Math.max(maxR, rMultiple),
        max_drawdown_r: minR,
      };
    }

    // Track max/min R during hold
    const currentR = (Number(p.close) - entryActual) / rUnit;
    const highR = (high - entryActual) / rUnit;
    const lowR = (low - entryActual) / rUnit;
    maxR = Math.max(maxR, highR);
    minR = Math.min(minR, lowR);
  }

  // Time exit — use last close
  if (prices.length >= HOLD_DAYS) {
    const lastClose = Number(prices[prices.length - 1].close);
    const rMultiple = (lastClose - entryActual) / rUnit;
    return {
      outcome: 'TIME_EXIT' as const,
      outcome_date: prices[prices.length - 1].date,
      outcome_price: lastClose,
      days_held: prices.length,
      r_multiple: Math.round(rMultiple * 100) / 100,
      max_r_achieved: Math.max(maxR, 0),
      max_drawdown_r: minR,
    };
  }

  // Not enough data yet — still OPEN
  return null;
}

async function seedFromSignals() {
  console.log('🌱 Seeding signal_results from signals table...');

  // Get all signals not yet in signal_results
  const { data: existingResults } = await supabase
    .from('signal_results')
    .select('signal_id');
  const existingIds = new Set((existingResults || []).map((r: any) => r.signal_id));

  const { data: signals } = await supabase
    .from('signals')
    .select('*')
    .order('date', { ascending: true });

  if (!signals) { console.log('No signals found'); return; }

  const toInsert = signals.filter((s: any) => !existingIds.has(s.id) && s.signal_type !== 'FAILED_BREAKOUT');
  console.log(`Found ${toInsert.length} signals to seed`);

  const rows = toInsert.map((s: any) => ({
    signal_id: s.id,
    symbol: s.symbol,
    signal_date: s.date,
    signal_type: s.signal_type,
    score: s.score,
    bucket: s.bucket,
    entry_signal: s.entry_price,
    entry_actual: null, // will be set during compute
    stop_price: s.stop_price,
    r_target_1: s.r_target_1,
    r_target_2: s.r_target_2,
    r_target_3: s.r_target_3,
    outcome: 'OPEN',
  }));

  // Upsert in chunks
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await supabase.from('signal_results').upsert(chunk, { onConflict: 'signal_id' });
    if (error) console.error('Seed error:', error.message);
  }
  console.log(`✅ Seeded ${rows.length} rows\n`);
}

async function computeAll() {
  // Get all OPEN signals that have enough time to have data
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 1); // at least 1 day old
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const { data: openResults } = await supabase
    .from('signal_results')
    .select('*')
    .eq('outcome', 'OPEN')
    .lte('signal_date', cutoffStr)
    .order('signal_date', { ascending: true });

  if (!openResults || openResults.length === 0) {
    console.log('No OPEN signals to compute');
    return;
  }

  console.log(`📊 Computing outcomes for ${openResults.length} OPEN signals...\n`);

  // Load all prices in bulk
  const symbols = [...new Set(openResults.map((r: any) => r.symbol as string))];
  const allDates = openResults.map((r: any) => r.signal_date as string);
  const minDate = allDates.reduce((a, b) => a < b ? a : b);

  const { data: allPrices } = await supabase
    .from('prices_daily')
    .select('symbol,date,open,high,low,close')
    .in('symbol', symbols)
    .gte('date', minDate)
    .order('date', { ascending: true });

  // Index prices by symbol
  const pricesBySymbol: Record<string, any[]> = {};
  for (const p of (allPrices || [])) {
    if (!pricesBySymbol[p.symbol]) pricesBySymbol[p.symbol] = [];
    pricesBySymbol[p.symbol].push(p);
  }

  let computed = 0, stillOpen = 0, updated = 0;

  for (const result of openResults) {
    const prices = pricesBySymbol[result.symbol] || [];
    const afterSignal = prices.filter((p: any) => p.date > result.signal_date);

    if (afterSignal.length === 0) { stillOpen++; continue; }

    // T+1 open = realistic entry
    const entryActual = result.entry_actual ?? Number(afterSignal[0].open);

    // T+N snapshot prices
    const pT1 = afterSignal[0] ? Number(afterSignal[0].close) : null;
    const pT5 = afterSignal[4] ? Number(afterSignal[4].close) : null;
    const pT10 = afterSignal[9] ? Number(afterSignal[9].close) : null;
    const pT20 = afterSignal[19] ? Number(afterSignal[19].close) : null;

    const pctChange = (ref: number | null) =>
      ref ? Math.round(((ref - entryActual) / entryActual) * 10000) / 100 : null;

    const outcome = computeOutcome(
      entryActual,
      Number(result.stop_price),
      Number(result.r_target_1),
      Number(result.r_target_2),
      Number(result.r_target_3),
      afterSignal.slice(0, HOLD_DAYS)
    );

    const update: any = {
      entry_actual: entryActual,
      price_t1: pT1, price_t5: pT5, price_t10: pT10, price_t20: pT20,
      pct_t1: pctChange(pT1), pct_t5: pctChange(pT5),
      pct_t10: pctChange(pT10), pct_t20: pctChange(pT20),
      updated_at: new Date().toISOString(),
    };

    if (outcome) {
      update.outcome = outcome.outcome;
      update.outcome_date = outcome.outcome_date;
      update.outcome_price = outcome.outcome_price;
      update.days_held = outcome.days_held;
      update.r_multiple = outcome.r_multiple;
      update.max_r_achieved = outcome.max_r_achieved;
      update.max_drawdown_r = outcome.max_drawdown_r;
      computed++;
    } else {
      stillOpen++;
    }

    const { error } = await supabase
      .from('signal_results')
      .update(update)
      .eq('id', result.id);
    if (!error) updated++;
    else console.error(`Error updating ${result.symbol} ${result.signal_date}:`, error.message);
  }

  console.log(`✅ Computed: ${computed} outcomes, ${stillOpen} still OPEN, ${updated} rows updated`);
}

async function main() {
  const init = process.argv.includes('--init');
  if (init) await seedFromSignals();
  await computeAll();
}

main().catch(console.error);
