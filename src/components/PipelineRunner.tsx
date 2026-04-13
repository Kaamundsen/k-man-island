'use client';

import { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { Play, Loader2, CheckCircle2, XCircle, Clock, RefreshCcw, Download, Radar, Square } from 'lucide-react';

interface PipelineResult {
  success: boolean;
  market: string;
  step: string;
  duration: string;
  prices: { success: number; failed: number; skipped: number; total: number; remaining: number };
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
  const [runningStep, setRunningStep] = useState<string | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [market, setMarket] = useState<'OSE' | 'US'>('OSE');

  // Auto-loader state
  const [autoLoading, setAutoLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ loaded: 0, total: 0, batch: 0 });
  const abortRef = useRef(false);

  // Single API call
  const callPipeline = useCallback(async (step?: 'prices' | 'scan', mkt?: 'OSE' | 'US'): Promise<PipelineResult> => {
    const params = new URLSearchParams({
      manual: 'true',
      market: mkt || market,
      ...(step ? { step } : {}),
    });

    const res = await fetch(`/api/cron/pipeline?${params}`);
    const data = await res.json();

    return {
      success: data.success ?? false,
      market: data.market ?? mkt ?? market,
      step: data.step ?? step ?? 'full',
      duration: data.duration ?? '0s',
      prices: data.prices ?? { success: 0, failed: 0, skipped: 0, total: 0, remaining: 0 },
      indicators: data.indicators ?? { computed: 0, failed: 0 },
      signals: data.signals ?? [],
      slot_actions: data.slot_actions ?? [],
      log: data.log ?? [],
      error: data.error,
    };
  }, [market]);

  // Auto-load ALL prices — runs batch after batch until done
  async function autoLoadPrices() {
    setAutoLoading(true);
    setRunning(true);
    setRunningStep('auto');
    abortRef.current = false;

    let totalLoaded = 0;
    let batchNum = 0;
    let lastResult: PipelineResult | null = null;

    try {
      while (!abortRef.current) {
        batchNum++;
        const data = await callPipeline('prices');
        lastResult = data;

        totalLoaded += data.prices.success;
        setBatchProgress({
          loaded: totalLoaded,
          total: data.prices.total || totalLoaded + (data.prices.remaining || 0),
          batch: batchNum,
        });

        // Stop if nothing new was loaded (all done or all failed)
        if (data.prices.success === 0 && data.prices.failed === 0) {
          break;
        }

        // Stop if no remaining
        if (data.prices.remaining === 0) {
          break;
        }

        // Stop on error
        if (!data.success) {
          break;
        }

        // Small pause between batches
        await new Promise(r => setTimeout(r, 300));
      }

      // Set final result
      if (lastResult) {
        setResult({
          ...lastResult,
          prices: { ...lastResult.prices, success: totalLoaded },
          log: [...(lastResult.log || []), `Auto-loader ferdig: ${totalLoaded} aksjer lastet i ${batchNum} batches`],
        });
      }

      onComplete?.();
    } catch (err) {
      setResult({
        success: false,
        market,
        step: 'auto',
        duration: '0s',
        prices: { success: totalLoaded, failed: 0, skipped: 0, total: 0, remaining: 0 },
        indicators: { computed: 0, failed: 0 },
        signals: [],
        slot_actions: [],
        log: [`Feil etter ${batchNum} batches: ${err instanceof Error ? err.message : 'Ukjent feil'}`],
        error: err instanceof Error ? err.message : 'Ukjent feil',
      });
    } finally {
      setAutoLoading(false);
      setRunning(false);
      setRunningStep(null);
    }
  }

  // Stop auto-loading
  function stopAutoLoad() {
    abortRef.current = true;
  }

  // Regular single-step run
  async function runPipeline(step?: 'prices' | 'scan') {
    setRunning(true);
    setRunningStep(step || 'full');
    setResult(null);

    try {
      const data = await callPipeline(step);
      setResult(data);
      if (data.success) onComplete?.();
    } catch (err) {
      setResult({
        success: false,
        market,
        step: step || 'full',
        duration: '0s',
        prices: { success: 0, failed: 0, skipped: 0, total: 0, remaining: 0 },
        indicators: { computed: 0, failed: 0 },
        signals: [],
        slot_actions: [],
        log: [],
        error: err instanceof Error ? err.message : 'Ukjent feil',
      });
    } finally {
      setRunning(false);
      setRunningStep(null);
    }
  }

  // Auto-load + scan in sequence
  async function runFullAuto() {
    setAutoLoading(true);
    setRunning(true);
    setRunningStep('auto');
    abortRef.current = false;

    let totalLoaded = 0;
    let batchNum = 0;

    try {
      // Phase 1: Load all prices (max 60 batches = 300 symbols at 5/batch)
      let consecutiveNoNew = 0;
      let totalFailed = 0;
      while (!abortRef.current && batchNum < 60) {
        batchNum++;
        const data = await callPipeline('prices');
        totalLoaded += data.prices.success;
        totalFailed += data.prices.failed;
        const remaining = data.prices.remaining ?? 0;
        const totalSymbols = data.prices.total || 0;
        setBatchProgress({
          loaded: totalSymbols - remaining,
          total: totalSymbols,
          batch: batchNum,
        });

        // Track consecutive batches with no successful loads
        if (data.prices.success === 0) {
          consecutiveNoNew++;
        } else {
          consecutiveNoNew = 0;
        }

        // Stop conditions
        if (remaining === 0) break;           // All done!
        if (consecutiveNoNew >= 3) break;     // 3 empty in a row = stuck
        if (!data.success) break;             // API error

        await new Promise(r => setTimeout(r, 500));
      }

      if (abortRef.current) return;

      // Phase 2: Run scanner
      setRunningStep('scan');
      setBatchProgress(prev => ({ ...prev, batch: -1 })); // -1 = scanning phase
      const scanData = await callPipeline('scan');

      setResult({
        ...scanData,
        prices: { ...scanData.prices, success: totalLoaded },
        log: [
          `Auto-loader: ${totalLoaded} aksjer lastet i ${batchNum} batches`,
          ...(scanData.log || []),
        ],
      });

      onComplete?.();
    } catch (err) {
      setResult({
        success: false,
        market,
        step: 'auto',
        duration: '0s',
        prices: { success: totalLoaded, failed: 0, skipped: 0, total: 0, remaining: 0 },
        indicators: { computed: 0, failed: 0 },
        signals: [],
        slot_actions: [],
        log: [`Feil: ${err instanceof Error ? err.message : 'Ukjent feil'}`],
        error: err instanceof Error ? err.message : 'Ukjent feil',
      });
    } finally {
      setAutoLoading(false);
      setRunning(false);
      setRunningStep(null);
    }
  }

  const progressPct = batchProgress.total > 0
    ? Math.round((batchProgress.loaded / batchProgress.total) * 100)
    : 0;

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

          {/* Run Scanner only */}
          <button
            onClick={() => runPipeline('scan')}
            disabled={running}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {runningStep === 'scan' && !autoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Radar className="w-4 h-4" />
            )}
            Scanner
          </button>

          {/* Auto-load + scan — the main button */}
          {autoLoading ? (
            <button
              onClick={stopAutoLoad}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stopp
            </button>
          ) : (
            <button
              onClick={runFullAuto}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Last & Scan
            </button>
          )}
        </div>
      </div>

      {/* Auto-loader progress bar */}
      {autoLoading && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              {batchProgress.batch === -1
                ? 'Kjorer scanner...'
                : `Laster priser — batch ${batchProgress.batch}`
              }
            </span>
            <span className="font-bold text-brand-emerald">
              {batchProgress.loaded} / {batchProgress.total || '?'} aksjer
              {batchProgress.total > 0 && ` (${progressPct}%)`}
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-emerald h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.max(progressPct, 2)}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {result && !autoLoading && (
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
              ? `Ferdig — ${result.prices.success} priser lastet, ${result.signals.length} signaler funnet`
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
                <div className="text-xs text-gray-500">Priser lastet</div>
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
