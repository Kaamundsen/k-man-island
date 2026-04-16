/**
 * Signals API — returns scanner results for the dashboard
 *
 * GET /api/signals              → latest available signals (auto-fallback)
 * GET /api/signals?date=2026-04-12  → specific date
 * GET /api/signals?days=7       → last 7 days
 * GET /api/signals?latest=true  → most recent date that has data
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

const HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const days = parseInt(url.searchParams.get('days') || '1');
  const latest = url.searchParams.get('latest') === 'true';

  const sb = getSupabase();

  // Helper: enrich signals with company names
  async function enrich(rows: any[]) {
    const symbols = [...new Set(rows.map((s: any) => s.symbol))];
    const { data: names } = symbols.length > 0
      ? await sb.from('universe').select('symbol, name').in('symbol', symbols)
      : { data: [] };
    const nameMap: Record<string, string> = {};
    (names || []).forEach((r: any) => { nameMap[r.symbol] = r.name; });
    return rows.map((s: any) => ({
      ...s,
      company_name: nameMap[s.symbol] || s.symbol.replace('.OL', ''),
    }));
  }

  // ── Mode 1: specific date ──
  if (date) {
    const { data, error } = await sb.from('signals').select('*')
      .eq('date', date).order('score', { ascending: false }).limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const enriched = await enrich(data || []);
    return NextResponse.json({ count: enriched.length, signals: enriched, data_date: date }, { headers: HEADERS });
  }

  // ── Mode 2: latest=true OR days=1 → find most recent date with data ──
  if (latest || days <= 1) {
    // Find the most recent date that has signals
    const { data: latestRow } = await sb.from('signals')
      .select('date').order('date', { ascending: false }).limit(1).single();

    if (!latestRow) {
      return NextResponse.json({ count: 0, signals: [], data_date: null }, { headers: HEADERS });
    }

    const dataDate = latestRow.date;
    const { data, error } = await sb.from('signals').select('*')
      .eq('date', dataDate).order('score', { ascending: false }).limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const enriched = await enrich(data || []);
    return NextResponse.json({ count: enriched.length, signals: enriched, data_date: dataDate }, { headers: HEADERS });
  }

  // ── Mode 3: days range ──
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data, error } = await sb.from('signals').select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('score', { ascending: false }).limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const enriched = await enrich(data || []);

  // Find the most recent date in results
  const dataDate = enriched.length > 0
    ? enriched.reduce((max: string, s: any) => s.date > max ? s.date : max, enriched[0].date)
    : null;

  return NextResponse.json({ count: enriched.length, signals: enriched, data_date: dataDate }, { headers: HEADERS });
}
