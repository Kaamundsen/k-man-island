/**
 * Backtest API
 *
 * GET /api/backtest                  → aggregate stats for all signal types
 * GET /api/backtest?type=POWER_BREAKOUT  → filter by signal type
 * GET /api/backtest?minScore=65      → filter by minimum score
 * GET /api/backtest?from=2025-01-01  → from date
 * GET /api/backtest?detail=true      → include all individual signal rows
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

const HEADERS = { 'Cache-Control': 'no-store' };

function scoreGroup(score: number): string {
  if (score >= 85) return '85+';
  if (score >= 70) return '70-84';
  if (score >= 55) return '55-69';
  return '45-54';
}

function computeStats(rows: any[]) {
  const completed = rows.filter(r => r.outcome !== 'OPEN');
  if (completed.length === 0) return null;

  const wins = completed.filter(r => ['TARGET_1','TARGET_2','TARGET_3'].includes(r.outcome));
  const losses = completed.filter(r => r.outcome === 'STOP');
  const timeExits = completed.filter(r => r.outcome === 'TIME_EXIT');

  const winRate = (wins.length / completed.length) * 100;
  const avgR = completed.reduce((s, r) => s + (r.r_multiple || 0), 0) / completed.length;
  const avgWinR = wins.length > 0 ? wins.reduce((s, r) => s + (r.r_multiple || 0), 0) / wins.length : 0;
  const avgLossR = losses.length > 0 ? losses.reduce((s, r) => s + (r.r_multiple || 0), 0) / losses.length : -1;

  // Expected value per trade
  const ev = (wins.length / completed.length) * avgWinR + (losses.length / completed.length) * avgLossR;

  // Average hold time
  const avgDays = completed.reduce((s, r) => s + (r.days_held || 0), 0) / completed.length;

  // Target distribution
  const target3hits = completed.filter(r => r.outcome === 'TARGET_3').length;
  const target2hits = completed.filter(r => r.outcome === 'TARGET_2').length;
  const target1hits = completed.filter(r => r.outcome === 'TARGET_1').length;

  // Score group breakdown
  const scoreGroups: Record<string, { total: number; wins: number; avgR: number }> = {};
  for (const r of completed) {
    const g = scoreGroup(r.score);
    if (!scoreGroups[g]) scoreGroups[g] = { total: 0, wins: 0, avgR: 0 };
    scoreGroups[g].total++;
    if (['TARGET_1','TARGET_2','TARGET_3'].includes(r.outcome)) scoreGroups[g].wins++;
    scoreGroups[g].avgR += (r.r_multiple || 0);
  }
  for (const g of Object.values(scoreGroups)) {
    g.avgR = Math.round((g.avgR / g.total) * 100) / 100;
  }

  return {
    total: rows.length,
    completed: completed.length,
    open: rows.filter(r => r.outcome === 'OPEN').length,
    win_rate: Math.round(winRate * 10) / 10,
    avg_r: Math.round(avgR * 100) / 100,
    avg_win_r: Math.round(avgWinR * 100) / 100,
    avg_loss_r: Math.round(avgLossR * 100) / 100,
    expected_value: Math.round(ev * 100) / 100,
    avg_days_held: Math.round(avgDays * 10) / 10,
    wins: wins.length,
    losses: losses.length,
    time_exits: timeExits.length,
    target_1_hits: target1hits,
    target_2_hits: target2hits,
    target_3_hits: target3hits,
    score_groups: scoreGroups,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeFilter = url.searchParams.get('type');
  const minScore = parseInt(url.searchParams.get('minScore') || '45');
  const fromDate = url.searchParams.get('from') || '2024-01-01';
  const detail = url.searchParams.get('detail') === 'true';

  const sb = getSupabase();

  let query = sb
    .from('signal_results')
    .select(detail
      ? '*'
      : 'id,symbol,signal_date,signal_type,score,bucket,entry_signal,entry_actual,stop_price,r_target_1,r_target_2,r_target_3,outcome,outcome_date,r_multiple,max_r_achieved,days_held,pct_t1,pct_t5,pct_t10,pct_t20'
    )
    .gte('signal_date', fromDate)
    .gte('score', minScore)
    .order('signal_date', { ascending: false });

  if (typeFilter) query = query.eq('signal_type', typeFilter);

  const { data: rows, error } = await query.limit(2000);
  if (error) {
    // Table may not exist yet
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return NextResponse.json({
        error: 'signal_results table not found',
        setup_required: true,
        setup_message: 'Run: npx tsx scripts/setup-db.ts — then npx tsx scripts/compute-signal-results.ts --init',
      }, { status: 404, headers: HEADERS });
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: HEADERS });
  }

  // Aggregate by signal type
  const types = ['POWER_BREAKOUT', 'HIGH_52W', 'CONTINUATION'];
  const byType: Record<string, any> = {};
  for (const t of types) {
    const subset = (rows || []).filter((r: any) => r.signal_type === t);
    byType[t] = computeStats(subset);
  }

  // Overall stats (exclude FAILED_BREAKOUT — it's a warning, not a trade)
  const tradeable = (rows || []).filter((r: any) => r.signal_type !== 'FAILED_BREAKOUT');
  const overall = computeStats(tradeable);

  return NextResponse.json({
    overall,
    by_type: byType,
    rows: detail ? rows : undefined,
    filters: { type: typeFilter, minScore, fromDate },
    generated_at: new Date().toISOString(),
  }, { headers: HEADERS });
}
