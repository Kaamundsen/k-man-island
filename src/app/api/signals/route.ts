/**
 * Signals API — returns scanner results for the dashboard
 *
 * GET /api/signals              → today's signals
 * GET /api/signals?date=2026-04-12  → specific date
 * GET /api/signals?days=7       → last 7 days
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date');
  const days = parseInt(url.searchParams.get('days') || '14');

  let query = getSupabase()
    .from('signals')
    .select('*')
    .order('score', { ascending: false });

  if (date) {
    query = query.eq('date', date);
  } else {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    query = query.gte('date', startDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with company names from universe table
  const symbols = [...new Set((data || []).map((s: any) => s.symbol))];
  const { data: names } = symbols.length > 0
    ? await getSupabase().from('universe').select('symbol, name').in('symbol', symbols)
    : { data: [] };

  const nameMap: Record<string, string> = {};
  (names || []).forEach((r: any) => { nameMap[r.symbol] = r.name; });

  const enriched = (data || []).map((s: any) => ({
    ...s,
    company_name: nameMap[s.symbol] || s.symbol.replace('.OL', ''),
  }));

  return NextResponse.json({
    count: enriched.length,
    signals: enriched,
  });
}
