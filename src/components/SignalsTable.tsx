'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, Zap, BarChart3, Target, ChevronRight, Loader2 } from 'lucide-react';

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
  VCP_BREAKOUT: { icon: Target, label: 'VCP Breakout', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
  HIGH_52W: { icon: TrendingUp, label: '52u Ny Topp', color: 'text-brand-emerald bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
  VOLUME_SURGE: { icon: BarChart3, label: 'Volum Surge', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
  SMART_MONEY: { icon: Zap, label: 'Smart Money', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
};

interface SignalsTableProps {
  onTakeSignal?: (signal: Signal) => void;
}

export default function SignalsTable({ onTakeSignal }: SignalsTableProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);

  useEffect(() => {
    fetchSignals();
  }, [days]);

  async function fetchSignals() {
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
  }

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
            {signals.length} funnet
          </span>
        </div>

        {/* Day filter */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-border rounded-xl p-1">
          {[1, 3, 7].map(d => (
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

      {signals.length === 0 ? (
        <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-12 text-center">
          <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Ingen signaler i dag</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            Scanneren kjører automatisk etter børsslutt. Trykk &quot;Kjor Pipeline&quot; for manuell kjoring.
          </p>
        </div>
      ) : (
        <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,1.2fr,0.8fr] gap-4 px-6 py-4 bg-gray-50 dark:bg-dark-border border-b border-gray-200 dark:border-dark-border">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">SYMBOL</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">TYPE</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">SCORE</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">ENTRY</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">STOP</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">STØRRELSE</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">AKSJON</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {signals.map((signal) => {
              const typeConfig = signalTypeConfig[signal.signal_type] || signalTypeConfig.VCP_BREAKOUT;
              const Icon = typeConfig.icon;
              const tickerShort = signal.symbol.replace('.OL', '');

              return (
                <div
                  key={signal.id}
                  className="grid grid-cols-[2fr,1.5fr,1fr,1fr,1fr,1.2fr,0.8fr] gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-dark-border/50 transition-colors group"
                >
                  {/* Symbol */}
                  <div>
                    <div className="text-lg font-bold text-brand-slate dark:text-white group-hover:text-brand-emerald transition-colors">
                      {tickerShort}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {signal.reasons[0] || ''}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex items-center">
                    <span className={clsx(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold',
                      typeConfig.color
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                      {typeConfig.label}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex items-center">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'text-2xl font-extrabold',
                        signal.score >= 70 ? 'text-brand-emerald' :
                        signal.score >= 50 ? 'text-amber-500' : 'text-gray-400'
                      )}>
                        {signal.score}
                      </span>
                    </div>
                  </div>

                  {/* Entry */}
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-brand-slate dark:text-white">
                      {signal.entry_price.toFixed(2)}
                    </span>
                  </div>

                  {/* Stop */}
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-semibold text-brand-rose">
                      {signal.stop_price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-400">
                      -{signal.stop_pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Position Size */}
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-brand-slate dark:text-white">
                      {signal.position_size_nok.toLocaleString('nb-NO')} kr
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end">
                    {signal.was_taken ? (
                      <span className="text-xs font-bold text-brand-emerald">TATT</span>
                    ) : (
                      <button
                        onClick={() => onTakeSignal?.(signal)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-brand-emerald text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors"
                      >
                        Ta
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
