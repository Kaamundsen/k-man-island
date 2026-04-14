'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, Zap, BarChart3, Target, ChevronRight, Loader2, AlertTriangle, RefreshCcw, ArrowUpRight } from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  date: string;
  bucket: string;
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
  was_taken: boolean;
}

const signalTypeConfig: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  VCP_BREAKOUT: { icon: Target, label: 'VCP', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
  HIGH_52W: { icon: TrendingUp, label: '52W High', color: 'text-brand-emerald bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
  VOLUME_SURGE: { icon: BarChart3, label: 'Vol Surge', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
  EPISODIC_PIVOT: { icon: Zap, label: 'Episodic', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
  CONTINUATION: { icon: RefreshCcw, label: 'Cont.', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30 dark:text-cyan-400' },
  FAILED_BREAKOUT: { icon: AlertTriangle, label: 'Failed BO', color: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
  SMART_MONEY: { icon: ArrowUpRight, label: 'Smart $', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
};

interface SignalsTableProps {
  onTakeSignal?: (signal: Signal) => void;
  refreshKey?: number;
}

export default function SignalsTable({ onTakeSignal, refreshKey }: SignalsTableProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(14);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/signals?days=${days}`);
      const data = await res.json();
      setSignals(data.signals || []);
    } catch (err) {
      console.error('Failed to fetch signals:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals, refreshKey]);

  const filteredSignals = typeFilter
    ? signals.filter(s => s.signal_type === typeFilter)
    : signals;

  // Count by type
  const typeCounts: Record<string, number> = {};
  signals.forEach(s => {
    typeCounts[s.signal_type] = (typeCounts[s.signal_type] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-3 text-gray-500">Laster signaler...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-brand-emerald" strokeWidth={2.5} />
          <h2 className="text-2xl font-bold text-brand-slate dark:text-white">
            Signaler
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredSignals.length} funnet
          </span>
        </div>

        {/* Day filter */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-border rounded-xl p-1">
          {[1, 3, 7, 14].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                days === d
                  ? 'bg-white dark:bg-dark-surface shadow-sm text-brand-emerald'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )}
            >
              {d === 1 ? 'I dag' : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter chips */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setTypeFilter(null)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all',
              !typeFilter
                ? 'bg-brand-slate text-white dark:bg-white dark:text-black'
                : 'bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-gray-400 hover:bg-gray-200'
            )}
          >
            Alle ({signals.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = signalTypeConfig[type];
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                  typeFilter === type
                    ? cfg?.color || 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-gray-400 hover:bg-gray-200'
                )}
              >
                {cfg?.label || type} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filteredSignals.length === 0 ? (
        <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Ingen signaler</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Kjor &quot;Last &amp; Scan&quot; for a lete etter setups.
          </p>
        </div>
      ) : (
        <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1.5fr,1.2fr,0.8fr,0.8fr,0.7fr,0.8fr,0.6fr] gap-3 px-5 py-3 bg-gray-50 dark:bg-dark-border border-b border-gray-200 dark:border-dark-border">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticker</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Setup</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Score</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Vol</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">RS</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Entry</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Aksjon</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {filteredSignals.map((signal) => {
              const typeConfig = signalTypeConfig[signal.signal_type] || signalTypeConfig.VCP_BREAKOUT;
              const Icon = typeConfig.icon;
              const tickerShort = signal.symbol.replace('.OL', '');
              const isFailed = signal.signal_type === 'FAILED_BREAKOUT';

              // Extract rel_volume and rel_strength from reasons (they're stored in the signal)
              // We parse from reasons as a quick way since the DB doesn't store these fields yet
              const volMatch = signal.reasons.find(r => /[Vv]olum.*x/.test(r));
              const volText = volMatch?.match(/([\d.]+)x/)?.[1] || '-';

              return (
                <div
                  key={signal.id}
                  className={clsx(
                    'grid grid-cols-[1.5fr,1.2fr,0.8fr,0.8fr,0.7fr,0.8fr,0.6fr] gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors group',
                    isFailed && 'bg-red-50/50 dark:bg-red-900/10'
                  )}
                >
                  {/* Ticker */}
                  <div>
                    <div className={clsx(
                      'text-base font-bold group-hover:text-brand-emerald transition-colors',
                      isFailed ? 'text-red-600 dark:text-red-400' : 'text-brand-slate dark:text-white'
                    )}>
                      {tickerShort}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                      {signal.reasons[0] || ''}
                    </div>
                  </div>

                  {/* Setup Type */}
                  <div className="flex items-center">
                    <span className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                      typeConfig.color
                    )}>
                      <Icon className="w-3 h-3" />
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center">
                    <span className={clsx(
                      'text-xl font-extrabold',
                      isFailed ? 'text-red-500' :
                      signal.score >= 70 ? 'text-brand-emerald' :
                      signal.score >= 50 ? 'text-amber-500' : 'text-gray-400'
                    )}>
                      {signal.score}
                    </span>
                  </div>

                  {/* Volume spike */}
                  <div className="flex items-center">
                    <span className={clsx(
                      'text-sm font-semibold',
                      volText !== '-' && parseFloat(volText) >= 2
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500'
                    )}>
                      {volText !== '-' ? `${volText}x` : '-'}
                    </span>
                  </div>

                  {/* Relative Strength (position in 52w range) */}
                  <div className="flex items-center">
                    <div className="w-full">
                      <div className="w-full bg-gray-100 dark:bg-dark-border rounded-full h-1.5">
                        <div
                          className={clsx(
                            'h-full rounded-full',
                            signal.stop_pct < 5 ? 'bg-brand-emerald' :
                            signal.stop_pct < 10 ? 'bg-amber-400' : 'bg-red-400'
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, 100 - signal.stop_pct * 5))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Entry + Stop */}
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-semibold text-brand-slate dark:text-white">
                      {signal.entry_price.toFixed(2)}
                    </span>
                    <span className="text-xs text-red-400">
                      Stop: {signal.stop_price.toFixed(2)} ({signal.stop_pct.toFixed(1)}%)
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end">
                    {isFailed ? (
                      <span className="text-xs font-bold text-red-500">UNNGA</span>
                    ) : signal.was_taken ? (
                      <span className="text-xs font-bold text-brand-emerald">TATT</span>
                    ) : (
                      <button
                        onClick={() => onTakeSignal?.(signal)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-emerald text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                      >
                        Ta
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded details on click could go here */}
    </div>
  );
}
