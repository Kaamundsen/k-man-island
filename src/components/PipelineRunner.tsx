'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Play, Loader2, CheckCircle2, XCircle, Clock, RefreshCcw } from 'lucide-react';

interface PipelineResult {
  success: boolean;
  market: string;
  duration: string;
  prices: { success: number; failed: number; skipped: number };
  indicators: { computed: number; failed: number };
  signals: Array<{
    symbol: string;
    type: string;
    score: number;
    entry: number;
    stop: number;
    size_nok: number;
    reasons: string[];
  }>;
  slot_actions: Array<{
    symbol: string;
    action: string;
    message: string;
  }>;
  log: string[];
  error?: string;
}

export default function PipelineRunner({ onComplete }: { onComplete?: () => void }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [market, setMarket] = useState<'OSE' | 'US'>('OSE');

  async function runPipeline(fullHistory = false) {
    setRunning(true);
    setResult(null);

    try {
      const params = new URLSearchParams({
        manual: 'true',
        market,
        ...(fullHistory ? { full: 'true' } : {}),
      });

      const res = await fetch(`/api/cron/pipeline?${params}`);
      const data = await res.json();

      // Normalize response — API may return partial data on error/429
      setResult({
        success: data.success ?? false,
        market: data.market ?? market,
        duration: data.duration ?? '0s',
        prices: data.prices ?? { success: 0, failed: 0, skipped: 0 },
        indicators: data.indicators ?? { computed: 0, failed: 0 },
        signals: data.signals ?? [],
        slot_actions: data.slot_actions ?? [],
        log: data.log ?? [],
        error: data.error,
      });

      if (data.success) {
        onComplete?.();
      }
    } catch (err) {
      setResult({
        success: false,
        market,
        duration: '0s',
        prices: { success: 0, failed: 0, skipped: 0 },
        indicators: { computed: 0, failed: 0 },
        signals: [],
        slot_actions: [],
        log: [],
        error: err instanceof Error ? err.message : 'Ukjent feil',
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <RefreshCcw className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-brand-slate dark:text-white">Pipeline</h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Market selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-border rounded-xl p-1">
            {(['OSE', 'US'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMarket(m)}
                disabled={running}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  market === m
                    ? 'bg-white dark:bg-dark-surface shadow-sm text-brand-emerald'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Run button */}
          <button
            onClick={() => runPipeline(false)}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {running ? 'Kjorer...' : 'Kjor Pipeline'}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-4 space-y-3">
          {/* Status banner */}
          <div className={clsx(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium',
            result.success
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          )}>
            {result.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {result.success
              ? `Ferdig på ${result.duration} — ${result.signals.length} signaler funnet`
              : `Feilet: ${result.error || 'ukjent feil'}`
            }
            <Clock className="w-3.5 h-3.5 ml-auto opacity-50" />
            <span className="opacity-50">{result.duration}</span>
          </div>

          {/* Stats */}
          {result.success && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-brand-slate dark:text-white">
                  {result.prices.success}
                </div>
                <div className="text-xs text-gray-500">Priser oppdatert</div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-brand-slate dark:text-white">
                  {result.indicators.computed}
                </div>
                <div className="text-xs text-gray-500">Indikatorer</div>
              </div>
              <div className="bg-gray-50 dark:bg-dark-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-brand-emerald">
                  {result.signals.length}
                </div>
                <div className="text-xs text-gray-500">Signaler</div>
              </div>
            </div>
          )}

          {/* Slot Actions */}
          {result.slot_actions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                Posisjonsoppdateringer
              </div>
              {result.slot_actions.map((action, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-600 dark:text-gray-300 px-3 py-2 bg-gray-50 dark:bg-dark-border rounded-lg"
                >
                  {action.message}
                </div>
              ))}
            </div>
          )}

          {/* Log */}
          <details className="text-xs">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-600">
              Vis log ({result.log.length} linjer)
            </summary>
            <pre className="mt-2 p-3 bg-gray-50 dark:bg-dark-border rounded-xl text-gray-500 overflow-x-auto">
              {result.log.join('\n')}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
