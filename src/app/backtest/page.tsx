'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import {
  TrendingUp, Zap, RefreshCcw, Target, AlertTriangle,
  BarChart3, ChevronDown, ChevronUp, Info
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScoreGroup {
  total: number;
  wins: number;
  avgR: number;
}

interface Stats {
  total: number;
  completed: number;
  open: number;
  win_rate: number;
  avg_r: number;
  avg_win_r: number;
  avg_loss_r: number;
  expected_value: number;
  avg_days_held: number;
  wins: number;
  losses: number;
  time_exits: number;
  target_1_hits: number;
  target_2_hits: number;
  target_3_hits: number;
  score_groups: Record<string, ScoreGroup>;
}

interface BacktestData {
  overall: Stats | null;
  by_type: Record<string, Stats | null>;
  rows?: any[];
  filters: { type: string | null; minScore: number; fromDate: string };
}

// ── Config ─────────────────────────────────────────────────────────────────────

const signalTypeConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  POWER_BREAKOUT: { label: 'Power Breakout', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', icon: Zap },
  HIGH_52W:       { label: '52-ukers høy',   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: TrendingUp },
  CONTINUATION:   { label: 'Pullback',        color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30', icon: RefreshCcw },
};

const outcomeConfig: Record<string, { label: string; color: string }> = {
  STOP:      { label: 'Stop',   color: 'text-red-500' },
  TARGET_1:  { label: '1R',     color: 'text-emerald-500' },
  TARGET_2:  { label: '2R',     color: 'text-emerald-600' },
  TARGET_3:  { label: '3R',     color: 'text-emerald-700 dark:text-emerald-300' },
  TIME_EXIT: { label: 'Tid',    color: 'text-gray-400' },
  OPEN:      { label: 'Åpen',   color: 'text-blue-400' },
};

// ── Components ─────────────────────────────────────────────────────────────────

function Verdict({ stats }: { stats: Stats }) {
  if (stats.completed < 5) return <span className="text-gray-400 text-xs">For lite data</span>;
  const ev = stats.expected_value;
  const wr = stats.win_rate;
  if (ev >= 0.5 && wr >= 55) return <span className="text-xs font-bold text-emerald-500">✅ Lønnsomt setup</span>;
  if (ev >= 0.2 && wr >= 45) return <span className="text-xs font-bold text-amber-500">⚡ Marginalt positivt</span>;
  if (ev < 0) return <span className="text-xs font-bold text-red-500">❌ Unngå / filtrer</span>;
  return <span className="text-xs font-bold text-gray-400">— Nøytralt</span>;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={clsx('text-2xl font-extrabold', color || 'text-brand-slate dark:text-white')}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function TypeCard({ type, stats }: { type: string; stats: Stats | null }) {
  const cfg = signalTypeConfig[type];
  const Icon = cfg.icon;
  const [expanded, setExpanded] = useState(false);

  if (!stats || stats.completed < 3) {
    return (
      <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border p-5 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold', cfg.color, cfg.bg)}>
            <Icon className="w-3 h-3" />{cfg.label}
          </span>
        </div>
        <p className="text-sm text-gray-400">For lite data ({stats?.completed ?? 0} fullførte)</p>
      </div>
    );
  }

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 hover:bg-gray-50 dark:hover:bg-dark-border/30 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold', cfg.color, cfg.bg)}>
              <Icon className="w-3 h-3" />{cfg.label}
            </span>
            <Verdict stats={stats} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-xl font-extrabold text-brand-slate dark:text-white">{stats.win_rate}%</div>
            <div className="text-xs text-gray-400">treffsikkerhet</div>
          </div>
          <div>
            <div className={clsx('text-xl font-extrabold', stats.avg_r >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {stats.avg_r >= 0 ? '+' : ''}{stats.avg_r}R
            </div>
            <div className="text-xs text-gray-400">snitt R</div>
          </div>
          <div>
            <div className={clsx('text-xl font-extrabold', stats.expected_value >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {stats.expected_value >= 0 ? '+' : ''}{stats.expected_value}R
            </div>
            <div className="text-xs text-gray-400">forventet verdi</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-brand-slate dark:text-white">{stats.completed}</div>
            <div className="text-xs text-gray-400">fullførte trades</div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-surface-border dark:border-dark-border">
          {/* Outcome distribution */}
          <div className="mt-4 mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Utfallsfordeling</div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'TARGET_3', val: stats.target_3_hits },
                { key: 'TARGET_2', val: stats.target_2_hits },
                { key: 'TARGET_1', val: stats.target_1_hits },
                { key: 'TIME_EXIT', val: stats.time_exits },
                { key: 'STOP', val: stats.losses },
              ].map(({ key, val }) => {
                const pct = stats.completed > 0 ? Math.round((val / stats.completed) * 100) : 0;
                const oc = outcomeConfig[key];
                return (
                  <div key={key} className="flex-1 min-w-[80px] bg-gray-50 dark:bg-dark-border rounded-xl p-3 text-center">
                    <div className={clsx('text-base font-bold', oc.color)}>{pct}%</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{oc.label}</div>
                    <div className="text-[10px] text-gray-500">{val} trades</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Score group breakdown */}
          <div className="mb-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Resultat per score-intervall</div>
            <div className="space-y-2">
              {['85+', '70-84', '55-69', '45-54'].map(g => {
                const sg = stats.score_groups[g];
                if (!sg || sg.total === 0) return null;
                const wr = Math.round((sg.wins / sg.total) * 100);
                return (
                  <div key={g} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-500 w-12 shrink-0">{g}</span>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full', wr >= 55 ? 'bg-emerald-400' : wr >= 45 ? 'bg-amber-400' : 'bg-red-400')}
                        style={{ width: `${wr}%` }}
                      />
                    </div>
                    <span className={clsx('text-xs font-bold w-10 text-right', wr >= 55 ? 'text-emerald-500' : wr >= 45 ? 'text-amber-500' : 'text-red-500')}>
                      {wr}%
                    </span>
                    <span className={clsx('text-xs w-14 text-right', sg.avgR >= 0 ? 'text-emerald-500' : 'text-red-400')}>
                      {sg.avgR >= 0 ? '+' : ''}{sg.avgR}R
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right">{sg.total} trades</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Win/loss/time averages */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{stats.avg_win_r}R</div>
              <div className="text-xs text-emerald-500">snitt gevinst</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-red-500">{stats.avg_loss_r}R</div>
              <div className="text-xs text-red-400">snitt tap</div>
            </div>
            <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-brand-slate dark:text-white">{stats.avg_days_held}d</div>
              <div className="text-xs text-gray-400">snitt holdtid</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignalRow({ row }: { row: any }) {
  const oc = outcomeConfig[row.outcome] || outcomeConfig.OPEN;
  return (
    <tr className="border-b border-surface-border dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border/30">
      <td className="px-4 py-2.5 text-sm font-bold text-brand-slate dark:text-white">{row.symbol.replace('.OL','')}</td>
      <td className="px-4 py-2.5 text-xs text-gray-500">{row.signal_date}</td>
      <td className="px-4 py-2.5">
        <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', signalTypeConfig[row.signal_type]?.color, signalTypeConfig[row.signal_type]?.bg)}>
          {signalTypeConfig[row.signal_type]?.label || row.signal_type}
        </span>
      </td>
      <td className="px-4 py-2.5 text-xs text-center font-bold text-brand-slate dark:text-white">{row.score}</td>
      <td className="px-4 py-2.5 text-xs text-right text-gray-500">{row.entry_actual?.toFixed(2) ?? '—'}</td>
      <td className="px-4 py-2.5 text-xs text-center">
        <span className={clsx('font-bold', oc.color)}>{oc.label}</span>
      </td>
      <td className={clsx('px-4 py-2.5 text-xs text-right font-bold',
        row.r_multiple == null ? 'text-gray-400' : row.r_multiple > 0 ? 'text-emerald-500' : 'text-red-500'
      )}>
        {row.r_multiple != null ? `${row.r_multiple >= 0 ? '+' : ''}${row.r_multiple}R` : '—'}
      </td>
      <td className="px-4 py-2.5 text-xs text-right text-gray-400">{row.days_held ?? '—'}d</td>
    </tr>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BacktestPage() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [minScore, setMinScore] = useState(45);
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minScore: String(minScore),
        from: fromDate,
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      const statsRes = await fetch(`/api/backtest?${params}`, { cache: 'no-store' });
      const stats = await statsRes.json();
      if (stats.setup_required) { setSetupRequired(true); setLoading(false); return; }
      setData(stats);

      if (showDetail) {
        const detailRes = await fetch(`/api/backtest?${params}&detail=true`, { cache: 'no-store' });
        const det = await detailRes.json();
        setRows(det.rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [minScore, fromDate, typeFilter, showDetail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Setup required screen ────────────────────────────────────────────────────
  if (setupRequired) {
    return (
      <div className="min-h-screen bg-surface-muted dark:bg-dark-surface flex items-center justify-center p-8">
        <div className="bg-surface dark:bg-dark-bg rounded-3xl border border-surface-border dark:border-dark-border p-8 max-w-lg w-full">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-brand-slate dark:text-white mb-2">Backtesting ikke satt opp ennå</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            Tabellen <code className="bg-gray-100 dark:bg-dark-border px-1 rounded">signal_results</code> mangler i databasen.
            Kjør disse to kommandoene i terminalen:
          </p>
          <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono space-y-2 mb-4">
            <div>
              <div className="text-emerald-400 text-xs mb-1"># 1. Åpner Supabase SQL Editor (paste SQL og klikk Run)</div>
              <div className="text-white">npx tsx scripts/setup-db.ts</div>
            </div>
            <div>
              <div className="text-emerald-400 text-xs mb-1"># 2. Seed og beregn historiske resultater</div>
              <div className="text-white">npx tsx scripts/compute-signal-results.ts --init</div>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Dette er en engangsjobb. Etter dette oppdateres backtest-dataen automatisk hver kveld kl 22:30.
          </p>
        </div>
      </div>
    );
  }

  // ── Main content ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-muted dark:bg-dark-surface">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-7 h-7 text-brand-emerald" strokeWidth={2.5} />
          <div>
            <h1 className="text-3xl font-extrabold text-brand-slate dark:text-white">Backtesting</h1>
            <p className="text-sm text-gray-400 mt-0.5">Historiske resultater — validerer at signalene faktisk fungerer</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-surface dark:bg-dark-surface rounded-xl border border-surface-border dark:border-dark-border px-3 py-2">
            <span className="text-xs text-gray-400">Min score</span>
            <div className="flex gap-1">
              {[45, 55, 65, 70].map(s => (
                <button key={s} onClick={() => setMinScore(s)}
                  className={clsx('px-2 py-1 rounded-lg text-xs font-bold transition-all',
                    minScore === s ? 'bg-brand-emerald text-white' : 'text-gray-400 hover:text-gray-600'
                  )}>
                  {s}+
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface dark:bg-dark-surface rounded-xl border border-surface-border dark:border-dark-border px-3 py-2">
            <span className="text-xs text-gray-400">Fra</span>
            <div className="flex gap-1">
              {[
                { label: '3 mnd', val: new Date(Date.now() - 90*86400000).toISOString().split('T')[0] },
                { label: '6 mnd', val: new Date(Date.now() - 180*86400000).toISOString().split('T')[0] },
                { label: '1 år',  val: new Date(Date.now() - 365*86400000).toISOString().split('T')[0] },
                { label: 'Alt',   val: '2024-01-01' },
              ].map(({ label, val }) => (
                <button key={label} onClick={() => setFromDate(val)}
                  className={clsx('px-2 py-1 rounded-lg text-xs font-bold transition-all',
                    fromDate === val ? 'bg-brand-emerald text-white' : 'text-gray-400 hover:text-gray-600'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            {[null, 'POWER_BREAKOUT', 'HIGH_52W', 'CONTINUATION'].map(t => (
              <button key={t ?? 'all'} onClick={() => setTypeFilter(t)}
                className={clsx('px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
                  typeFilter === t
                    ? 'bg-brand-slate dark:bg-white text-white dark:text-black border-transparent'
                    : 'bg-surface dark:bg-dark-surface border-surface-border dark:border-dark-border text-gray-400 hover:text-gray-600'
                )}>
                {t ? (signalTypeConfig[t]?.label || t) : 'Alle typer'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-400">Laster backtest-data...</span>
          </div>
        ) : data ? (
          <>
            {/* Overall summary */}
            {data.overall && data.overall.completed > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-brand-slate dark:text-white">Totalresultat</h2>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {data.overall.completed} fullførte trades, {data.overall.open} åpne
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  <StatCard
                    label="Treffsikkerhet"
                    value={`${data.overall.win_rate}%`}
                    sub={`${data.overall.wins} vinn / ${data.overall.losses} tap`}
                    color={data.overall.win_rate >= 50 ? 'text-emerald-500' : 'text-red-500'}
                  />
                  <StatCard
                    label="Snitt R per trade"
                    value={`${data.overall.avg_r >= 0 ? '+' : ''}${data.overall.avg_r}R`}
                    sub="gevinst minus tap"
                    color={data.overall.avg_r >= 0 ? 'text-emerald-500' : 'text-red-500'}
                  />
                  <StatCard
                    label="Forventet verdi"
                    value={`${data.overall.expected_value >= 0 ? '+' : ''}${data.overall.expected_value}R`}
                    sub="per trade i snitt"
                    color={data.overall.expected_value >= 0 ? 'text-emerald-500' : 'text-red-500'}
                  />
                  <StatCard
                    label="Snitt holdtid"
                    value={`${data.overall.avg_days_held}d`}
                    sub={`maks ${20} handelsdager`}
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Forventet verdi (EV)</strong> er det viktigste tallet — hvis positiv er systemet lønnsomt over tid.
                    EV = (vinnsannsynlighet × snitt gevinst) − (tapssannsynlighet × snitt tap).
                    {data.overall.expected_value >= 0.3 && ' ✅ Systemet ser lønnsomt ut.'}
                    {data.overall.expected_value > 0 && data.overall.expected_value < 0.3 && ' ⚡ Marginalt positivt — bruk score 65+ for bedre resultater.'}
                    {data.overall.expected_value < 0 && ' ❌ Negativt EV — filtrer på score 70+ for å finne de beste setups.'}
                  </p>
                </div>
              </div>
            )}

            {/* Per signal type */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-brand-slate dark:text-white mb-4">Per signaltype</h2>
              <div className="space-y-3">
                {['POWER_BREAKOUT', 'HIGH_52W', 'CONTINUATION'].map(type => (
                  <TypeCard key={type} type={type} stats={data.by_type[type]} />
                ))}
              </div>
            </div>

            {/* Detail table */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-slate dark:text-white">Alle signaler</h2>
              <button
                onClick={() => setShowDetail(!showDetail)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-brand-slate dark:bg-white text-white dark:text-black hover:opacity-90 transition-all"
              >
                {showDetail ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showDetail ? 'Skjul' : 'Vis alle signaler'}
              </button>
            </div>

            {showDetail && rows.length > 0 && (
              <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-dark-muted text-xs text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Symbol</th>
                        <th className="px-4 py-3 text-left">Dato</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-center">Score</th>
                        <th className="px-4 py-3 text-right">Entry</th>
                        <th className="px-4 py-3 text-center">Utfall</th>
                        <th className="px-4 py-3 text-right">R</th>
                        <th className="px-4 py-3 text-right">Dager</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((r: any) => r.signal_type !== 'FAILED_BREAKOUT')
                        .slice(0, 200)
                        .map((r: any) => <SignalRow key={r.id} row={r} />)
                      }
                    </tbody>
                  </table>
                </div>
                {rows.length > 200 && (
                  <div className="px-4 py-3 text-xs text-gray-400 border-t border-surface-border dark:border-dark-border">
                    Viser 200 av {rows.length} signaler — bruk filter for å innsnevre
                  </div>
                )}
              </div>
            )}

            {showDetail && rows.length === 0 && (
              <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border p-8 text-center">
                <Target className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Ingen fullførte signaler ennå</p>
                <p className="text-xs text-gray-500 mt-1">
                  Kjør <code className="bg-gray-100 dark:bg-dark-border px-1 rounded">npx tsx scripts/compute-signal-results.ts --init</code>
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">Ingen data</div>
        )}
      </div>
    </div>
  );
}
