'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, Zap, Target, ChevronDown, ChevronUp, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';

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
  company_name: string;
}

const signalTypeConfig: Record<string, { icon: typeof TrendingUp; label: string; color: string; bg: string }> = {
  POWER_BREAKOUT: { icon: Zap, label: 'Breakout', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
  HIGH_52W: { icon: TrendingUp, label: 'Årstopp', color: 'text-brand-emerald dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
  CONTINUATION: { icon: RefreshCcw, label: 'Pullback', color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30' },
  FAILED_BREAKOUT: { icon: AlertTriangle, label: 'Unngå', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
};

interface SignalsTableProps {
  onTakeSignal?: (signal: Signal) => void;
  refreshKey?: number;
}

export default function SignalsTable({ onTakeSignal, refreshKey }: SignalsTableProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/signals?days=${days}&t=${Date.now()}`, { cache: 'no-store' });
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
          <h2 className="text-2xl font-bold text-brand-slate dark:text-white">Signaler</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{filteredSignals.length} funnet</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-border rounded-xl p-1">
          {[1, 3, 7, 14].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                days === d ? 'bg-white dark:bg-dark-surface shadow-sm text-brand-emerald' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )}>
              {d === 1 ? 'I dag' : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* Type filter chips */}
      {Object.keys(typeCounts).length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={() => setTypeFilter(null)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-bold transition-all',
              !typeFilter ? 'bg-brand-slate text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-gray-400 hover:bg-gray-200'
            )}>
            Alle ({signals.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = signalTypeConfig[type];
            return (
              <button key={type} onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={clsx('px-3 py-1.5 rounded-full text-xs font-bold transition-all',
                  typeFilter === type ? `${cfg?.color} ${cfg?.bg}` : 'bg-gray-100 text-gray-500 dark:bg-dark-border dark:text-gray-400 hover:bg-gray-200'
                )}>
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
            Kjor scanner lokalt for å finne nye setups.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal) => {
            const cfg = signalTypeConfig[signal.signal_type] || signalTypeConfig.POWER_BREAKOUT;
            const Icon = cfg.icon;
            const tickerShort = signal.symbol.replace('.OL', '');
            const isFailed = signal.signal_type === 'FAILED_BREAKOUT';
            const isExpanded = expandedId === signal.id;

            const volMatch = signal.reasons.find(r => /[Vv]olum.*x/.test(r));
            const volText = volMatch?.match(/([\d.]+)x/)?.[1] || null;

            const riskReward1 = signal.stop_pct > 0
              ? ((signal.r_target_1 - signal.entry_price) / (signal.entry_price - signal.stop_price)).toFixed(1)
              : '-';

            return (
              <div key={signal.id}
                className={clsx(
                  'bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden transition-all',
                  isFailed && 'border-red-200 dark:border-red-900/50'
                )}>
                {/* Main row — clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors"
                >
                  {/* Score circle */}
                  <div className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center text-lg font-extrabold shrink-0',
                    isFailed ? 'bg-red-100 text-red-500 dark:bg-red-900/30' :
                    signal.score >= 70 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                    signal.score >= 50 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                    'bg-gray-100 text-gray-500 dark:bg-dark-border'
                  )}>
                    {signal.score}
                  </div>

                  {/* Ticker + company */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'text-base font-bold',
                        isFailed ? 'text-red-600 dark:text-red-400' : 'text-brand-slate dark:text-white'
                      )}>
                        {tickerShort}
                      </span>
                      <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold', cfg.color, cfg.bg)}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {signal.company_name}
                    </div>
                  </div>

                  {/* Key stats */}
                  <div className="hidden sm:flex items-center gap-6 text-sm shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-brand-slate dark:text-white">{signal.entry_price.toFixed(2)}</div>
                      <div className="text-xs text-red-400">-{signal.stop_pct.toFixed(1)}%</div>
                    </div>
                    {volText && (
                      <div className="text-right">
                        <div className="font-bold text-blue-600 dark:text-blue-400">{volText}x</div>
                        <div className="text-xs text-gray-400">volum</div>
                      </div>
                    )}
                    {!isFailed && (
                      <div className="text-right">
                        <div className="font-bold text-brand-slate dark:text-white">{Number(riskReward1).toFixed(1)}R</div>
                        <div className="text-xs text-gray-400">r/r</div>
                      </div>
                    )}
                  </div>

                  {/* Expand icon */}
                  {isExpanded
                    ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                  }
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-dark-border">
                    {/* Why this signal */}
                    <div className="mt-4 mb-4">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hvorfor dette signalet</div>
                      <div className="flex flex-wrap gap-2">
                        {signal.reasons.map((r, i) => (
                          <span key={i} className={clsx(
                            'px-2.5 py-1 rounded-lg text-xs font-medium',
                            r.startsWith('⚠️') ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-gray-100 text-gray-600 dark:bg-dark-border dark:text-gray-300'
                          )}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!isFailed && (
                      <>
                        {/* Trade plan */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-3">
                            <div className="text-xs text-gray-400 mb-1">Entry</div>
                            <div className="text-lg font-bold text-brand-slate dark:text-white">{signal.entry_price.toFixed(2)}</div>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                            <div className="text-xs text-red-400 mb-1">Stop-loss</div>
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">{signal.stop_price.toFixed(2)}</div>
                            <div className="text-xs text-red-400">-{signal.stop_pct.toFixed(1)}%</div>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                            <div className="text-xs text-emerald-500 mb-1">Mål 1 (1R)</div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{signal.r_target_1.toFixed(2)}</div>
                            <div className="text-xs text-emerald-500">+{((signal.r_target_1 - signal.entry_price) / signal.entry_price * 100).toFixed(1)}%</div>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                            <div className="text-xs text-emerald-500 mb-1">Mål 2 (2R)</div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{signal.r_target_2.toFixed(2)}</div>
                            <div className="text-xs text-emerald-500">+{((signal.r_target_2 - signal.entry_price) / signal.entry_price * 100).toFixed(1)}%</div>
                          </div>
                        </div>

                        {/* Position sizing */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-blue-500 font-bold uppercase tracking-wider mb-1">Posisjonsstørrelse</div>
                              <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-300">
                                {signal.position_size_nok.toLocaleString('nb-NO')} kr
                              </div>
                            </div>
                            <div className="text-right text-sm text-blue-600 dark:text-blue-400">
                              <div>Risiko: {(signal.position_size_nok * signal.stop_pct / 100).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</div>
                              <div className="text-xs text-blue-400">1% av portefølje</div>
                            </div>
                          </div>
                        </div>

                        {/* Take action */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            Signal fra {signal.date}
                          </div>
                          {signal.was_taken ? (
                            <span className="text-sm font-bold text-brand-emerald">Allerede tatt</span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); onTakeSignal?.(signal); }}
                              className="px-5 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                            >
                              Ta denne posisjonen
                            </button>
                          )}
                        </div>
                      </>
                    )}

                    {isFailed && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                        <p className="text-red-600 dark:text-red-400 font-bold">Hold deg unna denne</p>
                        <p className="text-red-500 dark:text-red-400/70 text-sm mt-1">
                          Breakout-forsøk feilet. Selgerne tok over.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
