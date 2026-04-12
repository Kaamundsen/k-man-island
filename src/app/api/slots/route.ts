/**
 * Slots API — active position management
 *
 * GET  /api/slots       → all active slots with current status
 * POST /api/slots       → create new slot from a signal
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase/client';

export async function GET() {
  const { data, error } = await getSupabase()
    .from('slots')
    .select('*, trades(*)')
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with latest price
  const enriched = await Promise.all(
    (data || []).map(async (slot) => {
      const { data: price } = await getSupabase()
        .from('prices_daily')
        .select('close, date')
        .eq('symbol', slot.symbol)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      const currentPrice = price ? Number(price.close) : null;
      const entryPrice = Number(slot.entry_price);
      const currentStop = Number(slot.current_stop);

      return {
        ...slot,
        current_price: currentPrice,
        pnl_pct: currentPrice ? ((currentPrice - entryPrice) / entryPrice * 100) : null,
        stop_distance_pct: currentPrice ? ((currentPrice - currentStop) / currentPrice * 100) : null,
        price_date: price?.date,
      };
    })
  );

  return NextResponse.json({
    count: enriched.length,
    slots: enriched,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { signal_id, quantity, trailing_method = 'SMA10' } = body;

  if (!signal_id || !quantity) {
    return NextResponse.json(
      { error: 'signal_id og quantity er påkrevd' },
      { status: 400 }
    );
  }

  // Get signal
  const { data: signal, error: sigError } = await getSupabase()
    .from('signals')
    .select('*')
    .eq('id', signal_id)
    .single();

  if (sigError || !signal) {
    return NextResponse.json({ error: 'Signal ikke funnet' }, { status: 404 });
  }

  // Create trade
  const { data: trade, error: tradeError } = await getSupabase()
    .from('trades')
    .insert({
      portfolio_id: null, // Will be set when user picks portfolio
      ticker: signal.symbol,
      entry_price: signal.entry_price,
      quantity,
      entry_date: new Date().toISOString().split('T')[0],
      stop_loss: signal.stop_price,
      initial_stop: signal.stop_price,
      current_stop: signal.stop_price,
      bucket: signal.bucket,
      signal_id: signal.id,
      status: 'ACTIVE',
      trailing_method,
    })
    .select()
    .single();

  if (tradeError || !trade) {
    return NextResponse.json(
      { error: tradeError?.message || 'Feil ved opprettelse av trade' },
      { status: 500 }
    );
  }

  // Create slot
  const { data: slot, error: slotError } = await getSupabase()
    .from('slots')
    .insert({
      trade_id: trade.id,
      symbol: signal.symbol,
      bucket: signal.bucket,
      entry_price: signal.entry_price,
      current_stop: signal.stop_price,
      trailing_method,
      quantity,
      original_quantity: quantity,
      highest_price: signal.entry_price,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (slotError) {
    return NextResponse.json(
      { error: slotError.message },
      { status: 500 }
    );
  }

  // Mark signal as taken
  await getSupabase()
    .from('signals')
    .update({ was_taken: true })
    .eq('id', signal_id);

  return NextResponse.json({
    trade,
    slot,
    message: `Slot opprettet for ${signal.symbol} — stop: ${signal.stop_price}, trailing: ${trailing_method}`,
  });
}
