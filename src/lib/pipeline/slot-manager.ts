/**
 * Slot Manager — manages active positions and enforces exit rules
 *
 * This is the module that prevents another Norwegian/Kahoot disaster.
 * Exit logic is HARDCODED — the user cannot override it from the UI.
 *
 * Rules:
 * 1. Initial stop: 2x ATR below entry (set at trade creation)
 * 2. Trailing stop: 10-day SMA or 20-day SMA on DAILY CLOSE (not intraday)
 * 3. Partial exit: sell 1/3 at +1R
 * 4. Hard max loss: 1% of portfolio per trade (enforced by position sizing)
 * 5. Hard stop: if close < current_stop → EXIT next open
 */

import { getSupabase } from '@/lib/supabase/client';

export interface SlotAction {
  trade_id: string;
  symbol: string;
  action: 'HOLD' | 'MOVE_STOP' | 'PARTIAL_EXIT' | 'FULL_EXIT';
  new_stop?: number;
  exit_reason?: string;
  message: string;
}

/**
 * Evaluate all active slots against today's indicators.
 * Returns list of required actions.
 */
export async function evaluateSlots(): Promise<SlotAction[]> {
  // Get all active slots
  const { data: slots, error } = await getSupabase()
    .from('slots')
    .select('*, trades(*)')
    .eq('status', 'ACTIVE');

  if (error || !slots || slots.length === 0) {
    return [];
  }

  const actions: SlotAction[] = [];

  for (const slot of slots) {
    const symbol = slot.symbol;

    // Get latest indicator
    const { data: indicator } = await getSupabase()
      .from('indicators_daily')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    // Get latest price
    const { data: price } = await getSupabase()
      .from('prices_daily')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    if (!indicator || !price) {
      actions.push({
        trade_id: slot.trade_id,
        symbol,
        action: 'HOLD',
        message: `${symbol}: Ingen ny data — hold`,
      });
      continue;
    }

    const currentClose = Number(price.close);
    const currentStop = Number(slot.current_stop);
    const entryPrice = Number(slot.entry_price);
    const highestPrice = Math.max(Number(slot.highest_price || 0), currentClose);

    // Update highest price seen
    if (currentClose > (slot.highest_price || 0)) {
      await getSupabase()
        .from('slots')
        .update({ highest_price: currentClose, days_held: (slot.days_held || 0) + 1 })
        .eq('id', slot.id);
    } else {
      await getSupabase()
        .from('slots')
        .update({ days_held: (slot.days_held || 0) + 1 })
        .eq('id', slot.id);
    }

    // ---- RULE 1: HARD STOP CHECK ----
    // If daily close is below current stop → FULL EXIT
    if (currentClose < currentStop) {
      actions.push({
        trade_id: slot.trade_id,
        symbol,
        action: 'FULL_EXIT',
        exit_reason: 'TRAILING_STOP',
        message: `🔴 ${symbol}: Close ${currentClose.toFixed(2)} < stop ${currentStop.toFixed(2)} — EXIT ved neste åpning`,
      });

      // Update slot status
      await getSupabase()
        .from('slots')
        .update({ status: 'CLOSED' })
        .eq('id', slot.id);

      continue;
    }

    // ---- RULE 2: PARTIAL EXIT at +1R ----
    const riskPerShare = entryPrice - Number(slot.trades?.initial_stop || currentStop);
    const target1R = entryPrice + riskPerShare;
    const partialExits = slot.partial_exits || [];

    if (
      currentClose >= target1R &&
      partialExits.length === 0 &&
      slot.quantity > 1
    ) {
      const partialQty = Math.max(1, Math.floor(slot.original_quantity / 3));

      actions.push({
        trade_id: slot.trade_id,
        symbol,
        action: 'PARTIAL_EXIT',
        message: `🟡 ${symbol}: +1R nådd (${currentClose.toFixed(2)}) — selg ${partialQty} av ${slot.quantity} aksjer`,
      });

      // Record partial exit
      const newPartials = [...partialExits, {
        date: new Date().toISOString().split('T')[0],
        qty: partialQty,
        price: currentClose,
        reason: '+1R target',
      }];

      await getSupabase()
        .from('slots')
        .update({
          partial_exits: newPartials,
          quantity: slot.quantity - partialQty,
        })
        .eq('id', slot.id);
    }

    // ---- RULE 3: TRAILING STOP UPDATE ----
    let newStop = currentStop;

    if (slot.trailing_method === 'SMA10' && indicator.sma_10) {
      // Trail with SMA10 — only move UP, never down
      const sma10Stop = Number(indicator.sma_10);
      if (sma10Stop > currentStop && currentClose > sma10Stop) {
        newStop = sma10Stop;
      }
    } else if (slot.trailing_method === 'SMA20' && indicator.sma_20) {
      const sma20Stop = Number(indicator.sma_20);
      if (sma20Stop > currentStop && currentClose > sma20Stop) {
        newStop = sma20Stop;
      }
    } else if (slot.trailing_method === 'CHANDELIER' && indicator.atr_14) {
      // Chandelier exit: highest high - 3x ATR
      const chandelierStop = highestPrice - (Number(indicator.atr_14) * 3);
      if (chandelierStop > currentStop) {
        newStop = chandelierStop;
      }
    }

    if (newStop > currentStop) {
      actions.push({
        trade_id: slot.trade_id,
        symbol,
        action: 'MOVE_STOP',
        new_stop: Math.round(newStop * 10000) / 10000,
        message: `🟢 ${symbol}: Flytt stop ${currentStop.toFixed(2)} → ${newStop.toFixed(2)} (${slot.trailing_method})`,
      });

      await getSupabase()
        .from('slots')
        .update({ current_stop: newStop })
        .eq('id', slot.id);
    } else {
      actions.push({
        trade_id: slot.trade_id,
        symbol,
        action: 'HOLD',
        message: `⚪ ${symbol}: Hold — close ${currentClose.toFixed(2)}, stop ${currentStop.toFixed(2)} (${((currentClose - currentStop) / currentClose * 100).toFixed(1)}% margin)`,
      });
    }
  }

  return actions;
}
