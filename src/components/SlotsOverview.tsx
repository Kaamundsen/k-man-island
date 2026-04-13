'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Shield, TrendingUp, TrendingDown, AlertTriangle, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Slot {
  id: string;
  symbol: string;
  bucket: string;
  entry_price: number;
  current_stop: number;
  trailing_method: string;
  quantity: number;
  original_quantity: number;
  days_held: number;
  highest_price: number | null;
  status: string;
  current_price: number | null;
  pnl_pct: number | null;
  stop_distance_pct: number | null;
  price_date: string | null;
}

const bucketConfig: Record<string, { label: string; color: string }> = {
  BREAKOUT: { label: 'Breakout', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  EVENT: { label: 'Event', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  KJERNE: { label: 'Kjerne', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  INNTEKT: { label: 'Inntekt', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function SlotsOverview() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, []);

  async function fetchSlots() {
    setLoading(true);
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Laster posisjoner...</span>
      </div>
    );
  }

  // Calculate totals
  const totalPnl = slots.reduce((sum, s) => {
    if (s.current_price && s.entry_price) {
      return sum + ((s.current_price - s.entry_price) * s.quantity);
    }
    return sum;
  }, 0);

  const positionsAtRisk = slots.filter(s =>
    s.stop_distance_pct !== null && s.stop_distance_pct < 3
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-brand-emerald" strokeWidth={2.5} />
          <h2 className="text-2xl font-bold text-brand-slate dark:text-white">
            Aktive Posisjoner
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {slots.length} aktive
          </span>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-4">
          <div className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold',
            totalPnl >= 0
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          )}>
            {totalPnl >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {totalPnl >= 0 ? '+' : ''}{totalPnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </div>

          {positionsAtRisk > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              {positionsAtRisk} nær stop
            </div>
          )}
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-12 text-center">
          <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Ingen aktive posisjoner</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Trykk &quot;Ta&quot; på et signal for å opprette en posisjon med automatisk stop-loss.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {slots.map((slot) => {
            const bucket = bucketConfig[slot.bucket] || bucketConfig.BREAKOUT;
            const tickerShort = slot.symbol.replace('.OL', '');
            const isProfit = (slot.pnl_pct || 0) >= 0;
            const isNearStop = slot.stop_distance_pct !== null && slot.stop_distance_pct < 3;
            const isPartial = slot.quantity < slot.original_quantity;

            return (
              <div
                key={slot.id}
                className={clsx(
                  'bg-surface dark:bg-dark-surface rounded-2xl border p-5 transition-all',
                  isNearStop
                    ? 'border-amber-300 dark:border-amber-600'
                    : 'border-surface-border dark:border-dark-border'
                )}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Symbol + Bucket + Days */}
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-brand-slate dark:text-white">
                          {tickerShort}
                        </span>
                        <span className={clsx(
                          'px-2 py-0.5 rounded-full text-xs font-bold',
                          bucket.color
                        )}>
                          {bucket.label}
                        </span>
                        {isPartial && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-dark-border dark:text-gray-400">
                            {slot.quantity}/{slot.original_quantity} gjenstår
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Dag {slot.days_held || 0} | {slot.trailing_method} trailing
                      </div>
                    </div>
                  </div>

                  {/* Center: Prices */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Entry</div>
                      <div className="text-sm font-semibold text-brand-slate dark:text-white">
                        {slot.entry_price.toFixed(2)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Nå</div>
                      <div className={clsx(
                        'text-sm font-bold',
                        isProfit ? 'text-brand-emerald' : 'text-brand-rose'
                      )}>
                        {slot.current_price?.toFixed(2) || '—'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-gray-400 uppercase tracking-wider">Stop</div>
                      <div className="text-sm font-semibold text-brand-rose">
                        {slot.current_stop.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Right: P&L + Stop Distance */}
                  <div className="flex items-center gap-6">
                    {/* P&L */}
                    <div className={clsx(
                      'flex items-center gap-1.5 px-4 py-2 rounded-xl',
                      isProfit
                        ? 'bg-emerald-50 dark:bg-emerald-900/20'
                        : 'bg-red-50 dark:bg-red-900/20'
                    )}>
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4 text-brand-emerald" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-brand-rose" />
                      )}
                      <span className={clsx(
                        'text-lg font-extrabold',
                        isProfit ? 'text-brand-emerald' : 'text-brand-rose'
                      )}>
                        {(slot.pnl_pct || 0) >= 0 ? '+' : ''}{(slot.pnl_pct || 0).toFixed(1)}%
                      </span>
                    </div>

                    {/* Stop Distance Indicator */}
                    <div className="w-20">
                      <div className="text-xs text-gray-400 text-center mb-1">Til stop</div>
                      <div className="w-full bg-gray-100 dark:bg-dark-border rounded-full h-2 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            isNearStop ? 'bg-amber-400' :
                            (slot.stop_distance_pct || 0) > 10 ? 'bg-brand-emerald' : 'bg-blue-400'
                          )}
                          style={{ width: `${Math.min(100, (slot.stop_distance_pct || 0) * 5)}%` }}
                        />
                      </div>
                      <div className={clsx(
                        'text-xs text-center mt-0.5 font-semibold',
                        isNearStop ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'
                      )}>
                        {(slot.stop_distance_pct || 0).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
