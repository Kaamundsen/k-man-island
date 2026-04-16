/**
 * Signals API — returns scanner results for the dashboard
 *
 * GET /api/signals              → latest available signals (auto-fallback)
 * GET /api/signals?date=2026-04-12  → specific date
 * GET /api/signals?days=7       → last 7 days
 * GET /api/signals?latest=true  → most recent date that has data
 *
 * Each signal is enriched with:
 *   current_price  — latest close from prices_daily
 *   prev_close     — close from the signal date (= entry_price context)
 *   day_change_pct — % change from signal date to latest price
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

const HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

async function enrichSignals(rows: any[], sb: ReturnType<typeof import('@/lib/supabase/client').getSupabase>) {
  if (rows.length === 0) return [];

  const symbols = [...new Set(rows.map((s: any) => s.symbol as string))];

  // Company names
  const { data: names } = await sb.from('universe').select('symbol, name').in('symbol', symbols);
  const nameMap: Record<string, string> = {};
  (names || []).forEach((r: any) => { nameMap[r.symbol] = r.name; });

  // Latest price for each symbol (last 2 rows to get today + prev)
  const priceMap: Record<string, { current: number; prev: number; date: string }> = {};
  await Promise.all(symbols.map(async (sym) => {
    const { data: prices } = await sb
      .from('prices_daily')
      .select('close, date')
      .eq('symbol', sym)
      .order('date', { ascending: false })
      .limit(2);
    if (prices && prices.length >= 1) {
      priceMap[sym] = {
        current: Number(prices[0].close),
        date: prices[0].date,
        prev: prices.length >= 2 ? Number(prices[1].close) : Number(prices[0].close),
      };
    }
  }));

  return rows.map((s: any) => {
    const price = priceMap[s.symbol];
    const currentPrice = price?.current ?? null;
    const prevClose = price?.prev ?? null;
    const dayChangePct = currentPrice && prevClose
      ? ((currentPrice - prevClose) / prevClose) * 100
      : null;
    // How much has price moved since signal entry
    const driftPct = currentPrice
      ? ((currentPrice - Number(s.entry_price)) / Number(s.entry_price)) * 100
      : null;

    return {
      ...s,
      company_name: nameMap[s.symbol] || s.symbol.replace('.OL', ''),
      current_price: currentPrice,
      day_change_pct: dayChangePct,
      drift_pct: driftPct,       // how much moved since signal
      price_date: price?.date ?? null,
    };
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const days = parseInt(url.searchParams.get('days') || '1');
  const latest = url.searchParams.get('latest') === 'true';

  const sb = getSupabase();

  // ── Mode 1: specific date ──
  if (date) {
    const { data, error } = await sb.from('signals').select('*')
      .eq('date', date).order('score', { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const enriched = await enrichSignals(data || [], sb);
    return NextResponse.json({ count: enriched.length, signals: enriched, data_date: date }, { headers: HEADERS });
  }

  // ── Mode 2: latest=true OR days=1 → find most recent date with data ──
  if (latest || days <= 1) {
    const { data: latestRow } = await sb.from('signals')
      .select('date').order('date', { ascending: false }).limit(1).single();

    if (!latestRow) {
      return NextResponse.json({ count: 0, signals: [], data_date: null }, { headers: HEADERS });
    }

    const dataDate = latestRow.date;
    const { data, error } = await sb.from('signals').select('*')
      .eq('date', dataDate).order('score', { ascending: false }).limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const enriched = await enrichSignals(data || [], sb);
    return NextResponse.json({ count: enriched.length, signals: enriched, data_date: dataDate }, { headers: HEADERS });
  }

  // ── Mode 3: days range ──
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await sb.from('signals').select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('score', { ascending: false }).limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const enriched = await enrichSignals(data || [], sb);

  const dataDate = enriched.length > 0
    ? enriched.reduce((max: string, s: any) => s.date > max ? s.date : max, enriched[0].date)
    : null;

  return NextResponse.json({ count: enriched.length, signals: enriched, data_date: dataDate }, { headers: HEADERS });
}
