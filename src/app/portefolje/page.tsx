'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  Shield, TrendingUp, TrendingDown, AlertTriangle,
  Loader2, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';

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
  created_at: string;
}

const bucketConfig: Record<string, { label: string; color: string }> = {
  BREAKOUT: { label: 'Breakout', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  EVENT:    { label: 'Event',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  KJERNE:   { label: 'Kjerne',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  INNTEKT:  { label: 'Inntekt',  color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

export default function PorteføljePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bucketFilter, setBucketFilter] = useState<string | null>(null);

  const fetchSlots = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`/api/slots?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const filtered = bucketFilter ? slots.filter(s => s.bucket === bucketFilter) : slots;

  // Stats
  const totalInvested = slots.reduce((sum, s) => sum + s.entry_price * s.quantity, 0);
  const totalPnlKr = slots.reduce((sum, s) => {
    if (s.current_price) return sum + (s.current_price - s.entry_price) * s.quantity;
    return sum;
  }, 0);
  const totalPnlPct = totalInvested > 0 ? (totalPnlKr / totalInvested) * 100 : 0;
  const positionsAtRisk = slots.filter(s => s.stop_distance_pct !== null && s.stop_distance_pct < 3).length;
  const winners = slots.filter(s => (s.pnl_pct ?? 0) >= 0).length;

  const buckets = Array.from(new Set(slots.map(s => s.bucket)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <span className="ml-3 text-gray-500 dark:text-gray-400 text-lg">Laster portefølje...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-brand-emerald" strokeWidth={2} />
            <div>
              <h1 className="text-3xl font-extrabold text-brand-slate dark:text-white">
                Portefølje
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {slots.length} aktive posisjoner
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchSlots(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-brand-emerald dark:hover:border-brand-emerald hover:text-brand-emerald transition-all text-sm font-medium"
          >
            <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
            Oppdater
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Investert</div>
            <div className="text-2xl font-extrabold text-brand-slate dark:text-white">
              {totalInvested.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
            </div>
          </div>

          <div className={clsx(
            'rounded-2xl p-5 border',
            totalPnlKr >= 0
              ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30'
              : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
          )}>
            <div className={clsx(
              'text-xs uppercase tracking-wider mb-2',
              totalPnlKr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            )}>
              Urealisert P/L
            </div>
            <div className="flex items-baseline gap-2">
              <span className={clsx(
                'text-2xl font-extrabold',
                totalPnlKr >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
              )}>
                {totalPnlKr >= 0 ? '+' : ''}{totalPnlKr.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
              </span>
              <span className={clsx(
                'text-sm font-bold',
                totalPnlKr >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
              )}>
                ({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-surface rounded-2xl p-5 border border-gray-100 dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Vinnere</div>
            <div className="text-2xl font-extrabold text-brand-slate dark:text-white">
              {slots.length > 0 ? Math.round((winners / slots.length) * 100) : 0}%
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
                ({winners}/{slots.length})
              </span>
            </div>
          </div>

          <div className={clsx(
            'rounded-2xl p-5 border',
            positionsAtRisk > 0
              ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
              : 'bg-white dark:bg-dark-surface border-gray-100 dark:border-dark-border'
          )}>
            <div className={clsx(
              'text-xs uppercase tracking-wider mb-2',
              positionsAtRisk > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'
            )}>
              Nær stop (&lt;3%)
            </div>
            <div className={clsx(
              'text-2xl font-extrabold flex items-center gap-2',
              positionsAtRisk > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-brand-slate dark:text-white'
            )}>
              {positionsAtRisk > 0 && <AlertTriangle className="w-5 h-5" />}
              {positionsAtRisk}
            </div>
          </div>
        </div>

        {/* Bucket filter */}
        {buckets.length > 1 && (
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setBucketFilter(null)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                !bucketFilter
                  ? 'bg-brand-slate dark:bg-white text-white dark:text-brand-slate'
                  : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              )}
            >
              Alle ({slots.length})
            </button>
            {buckets.map(b => {
              const cfg = bucketConfig[b] || bucketConfig.BREAKOUT;
              return (
                <button
                  key={b}
                  onClick={() => setBucketFilter(bucketFilter === b ? null : b)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                    bucketFilter === b
                      ? 'bg-brand-slate dark:bg-white text-white dark:text-brand-slate'
                      : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  )}
                >
                  {cfg.label} ({slots.filter(s => s.bucket === b).length})
                </button>
              );
            })}
          </div>
        )}

        {/* Positions Table */}
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-dark-border p-16 text-center">
            <Shield className="w-14 h-14 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg font-semibold">Ingen aktive posisjoner</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              Importer posisjoner med <code className="bg-gray-100 dark:bg-dark-border px-1.5 py-0.5 rounded text-xs">npx tsx scripts/import-positions.ts</code>
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-surface rounded-3xl border border-gray-100 dark:border-dark-border overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_1fr] gap-4 px-6 py-3 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-muted text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <div>Aksje</div>
              <div className="text-right">Entry</div>
              <div className="text-right">Nå</div>
              <div className="text-right">Stop</div>
              <div className="text-right">P/L</div>
              <div className="text-right">Til stop</div>
              <div className="text-right">Dager</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50 dark:divide-dark-border">
              {filtered.map((slot) => {
                const bucket = bucketConfig[slot.bucket] || bucketConfig.BREAKOUT;
                const isProfit = (slot.pnl_pct ?? 0) >= 0;
                const isNearStop = slot.stop_distance_pct !== null && slot.stop_distance_pct < 3;
                const pnlKr = slot.current_price
                  ? (slot.current_price - slot.entry_price) * slot.quantity
                  : null;

                return (
                  <div
                    key={slot.id}
                    className={clsx(
                      'grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr_1fr] gap-4 px-6 py-4 items-center transition-colors',
                      isNearStop
                        ? 'bg-amber-50/50 dark:bg-amber-900/5 hover:bg-amber-50 dark:hover:bg-amber-900/10'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-muted'
                    )}
                  >
                    {/* Symbol + bucket */}
                    <div className="flex items-center gap-3">
                      {isNearStop && (
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-slate dark:text-white">
                            {slot.symbol.replace('.OL', '')}
                          </span>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-bold', bucket.color)}>
                            {bucket.label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {slot.quantity.toLocaleString('nb-NO')} stk · {slot.trailing_method}
                        </div>
                      </div>
                    </div>

                    {/* Entry */}
                    <div className="text-right">
                      <div className="font-semibold text-brand-slate dark:text-gray-200 text-sm">
                        {slot.entry_price.toFixed(slot.entry_price < 10 ? 3 : 2)}
                      </div>
                    </div>

                    {/* Current */}
                    <div className="text-right">
                      <div className={clsx(
                        'font-bold text-sm',
                        isProfit ? 'text-brand-emerald' : 'text-brand-rose'
                      )}>
                        {slot.current_price
                          ? slot.current_price.toFixed(slot.current_price < 10 ? 3 : 2)
                          : '—'}
                      </div>
                      {slot.price_date && (
                        <div className="text-xs text-gray-400 dark:text-gray-600">
                          {slot.price_date.slice(5)}
                        </div>
                      )}
                    </div>

                    {/* Stop */}
                    <div className="text-right">
                      <div className="font-semibold text-brand-rose text-sm">
                        {slot.current_stop.toFixed(slot.current_stop < 10 ? 3 : 2)}
                      </div>
                    </div>

                    {/* P/L */}
                    <div className="text-right">
                      <div className={clsx(
                        'font-extrabold text-sm',
                        isProfit ? 'text-brand-emerald' : 'text-brand-rose'
                      )}>
                        {(slot.pnl_pct ?? 0) >= 0 ? '+' : ''}{(slot.pnl_pct ?? 0).toFixed(1)}%
                      </div>
                      {pnlKr !== null && (
                        <div className={clsx(
                          'text-xs',
                          isProfit ? 'text-emerald-500 dark:text-emerald-500' : 'text-red-400'
                        )}>
                          {pnlKr >= 0 ? '+' : ''}{pnlKr.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                        </div>
                      )}
                    </div>

                    {/* Stop distance bar */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-full max-w-[100px] bg-gray-100 dark:bg-dark-border rounded-full h-1.5 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all',
                            isNearStop ? 'bg-amber-400' :
                            (slot.stop_distance_pct ?? 0) > 10 ? 'bg-brand-emerald' : 'bg-blue-400'
                          )}
                          style={{ width: `${Math.min(100, (slot.stop_distance_pct ?? 0) * 5)}%` }}
                        />
                      </div>
                      <span className={clsx(
                        'text-xs font-semibold',
                        isNearStop ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
                      )}>
                        {(slot.stop_distance_pct ?? 0).toFixed(1)}% til stop
                      </span>
                    </div>

                    {/* Days */}
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400 font-medium">
                      Dag {slot.days_held ?? '—'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-muted flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {filtered.length} posisjoner · priser fra Supabase
              </span>
              <div className={clsx(
                'flex items-center gap-1.5 text-sm font-bold',
                totalPnlKr >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
              )}>
                {totalPnlKr >= 0
                  ? <ArrowUpRight className="w-4 h-4" />
                  : <ArrowDownRight className="w-4 h-4" />
                }
                Totalt: {totalPnlKr >= 0 ? '+' : ''}{totalPnlKr.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr ({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)}%)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
