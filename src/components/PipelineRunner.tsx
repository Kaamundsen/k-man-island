'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCcw, Loader2, CheckCircle, XCircle } from 'lucide-react';
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
  const [isRunning, setIsRunning] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline', { cache: 'no-store' });
      const data = await res.json();
      setStatus(data);
      return data as PipelineStatus;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const s = await fetchStatus();
      if (s && !s.running) {
        stopPolling();
        setIsRunning(false);
        onComplete?.();
      }
    }, 3000);
  }, [fetchStatus, onComplete]);

  useEffect(() => () => stopPolling(), []);

  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      await fetch('/api/pipeline', { method: 'POST', cache: 'no-store' });
      startPolling();
    } catch {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCcw className={clsx('w-5 h-5', isRunning ? 'text-brand-emerald animate-spin' : 'text-gray-400')} />
          <div>
            <h3 className="text-base font-bold text-brand-slate dark:text-white">Scanner</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRunning
                ? 'Henter priser og kjører scanner...'
                : status?.lastRun
                  ? <span className="flex items-center gap-1">
                      Sist kjørt: {timeAgo(status.lastRun)}
                      {status.lastStatus === 'success'
                        ? <CheckCircle className="w-3 h-3 text-emerald-500 inline" />
                        : <XCircle className="w-3 h-3 text-red-500 inline" />
                      }
                    </span>
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
            ? <><Loader2 className="w-4 h-4 animate-spin" />Kjører...</>
            : <><RefreshCcw className="w-4 h-4" />Oppdater</>
          }
        </button>
      </div>
    </div>
  );
}
