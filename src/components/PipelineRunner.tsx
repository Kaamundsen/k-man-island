'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';

interface PipelineStatus {
  local_server: boolean;
  running: boolean;
  lastRun: string | null;
  lastStatus: 'success' | 'error' | null;
  startedAt: string | null;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'akkurat nå';
  if (diff < 3600) return `${Math.floor(diff / 60)} min siden`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} t siden`;
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PipelineRunner({ onComplete }: { onComplete?: () => void }) {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);

      // If pipeline just finished (was running, now not), refresh signals
      if (data.local_server && !data.running && triggering) {
        setTriggering(false);
        onComplete?.();
      }

      return data;
    } catch {
      return null;
    }
  }, [triggering, onComplete]);

  // Initial status fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll while running
  useEffect(() => {
    if (status?.running) {
      const id = setInterval(async () => {
        const s = await fetchStatus();
        if (s && !s.running) {
          clearInterval(id);
          setPollInterval(null);
          setTriggering(false);
          onComplete?.();
        }
      }, 3000);
      setPollInterval(id);
      return () => clearInterval(id);
    }
  }, [status?.running, fetchStatus, onComplete]);

  const runPipeline = async () => {
    if (triggering || status?.running) return;
    setTriggering(true);

    try {
      const res = await fetch('/api/pipeline', { method: 'POST', cache: 'no-store' });
      const data = await res.json();

      if (!data.local_server) {
        // Server not running — show instructions
        setStatus(s => s ? { ...s, local_server: false } : null);
        setTriggering(false);
        return;
      }

      // Pipeline started — poll for completion
      setStatus(s => s ? { ...s, running: true } : null);
    } catch {
      setTriggering(false);
    }
  };

  const isRunning = triggering || status?.running;
  const serverUp = status?.local_server;

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCcw className={clsx('w-5 h-5', isRunning ? 'text-brand-emerald animate-spin' : 'text-gray-400')} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-brand-slate dark:text-white">Scanner</h3>
              {status && (
                <span className={clsx(
                  'flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                  serverUp
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-gray-100 text-gray-400 dark:bg-dark-border dark:text-gray-500'
                )}>
                  {serverUp ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                  {serverUp ? 'lokal server aktiv' : 'server av'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRunning
                ? '⏳ Laster priser og kjører scanner...'
                : status?.lastRun
                  ? <>Sist kjørt: {timeAgo(status.lastRun)}{' '}
                    {status.lastStatus === 'success'
                      ? <span className="text-emerald-500">✓</span>
                      : <span className="text-red-500">✗</span>
                    }</>
                  : 'Signaler oppdateres daglig via lokal pipeline'
              }
            </p>
          </div>
        </div>

        <button
          onClick={runPipeline}
          disabled={isRunning}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all',
            isRunning
              ? 'bg-gray-100 dark:bg-dark-border text-gray-400 cursor-not-allowed'
              : 'bg-brand-emerald text-white hover:bg-emerald-600'
          )}
        >
          {isRunning
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Kjører...</>
            : <><RefreshCcw className="w-4 h-4" /> Oppdater</>
          }
        </button>
      </div>

      {/* Server not running — instructions */}
      {status && !serverUp && (
        <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
            Start lokal server for å bruke &ldquo;Oppdater&rdquo;-knappen:
          </p>
          <code className="text-xs bg-gray-900 text-emerald-400 px-2 py-1 rounded block">
            npx tsx scripts/local-server.ts
          </code>
          <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
            Eller kjør manuelt: <code className="bg-gray-100 dark:bg-dark-border px-1 rounded">bash scripts/daglig.sh</code>
          </p>
        </div>
      )}
    </div>
  );
}
