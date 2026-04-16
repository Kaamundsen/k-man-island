'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCcw, Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface PipelineStatus {
  configured: boolean;
  running: boolean;
  lastRun: string | null;
  lastStatus: string | null;
  runUrl: string | null;
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
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const prevRunning = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline', { cache: 'no-store' });
      const data = await res.json();

      // Var kjørende, er nå ferdig → refresh signaler
      if (prevRunning.current && !data.running && data.lastStatus === 'success') {
        onComplete?.();
      }
      prevRunning.current = data.running;
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [onComplete]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll hvert 10. sekund mens pipeline kjører
  useEffect(() => {
    if (status?.running || triggering) {
      pollRef.current = setInterval(fetchStatus, 10000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [status?.running, triggering, fetchStatus]);

  const runPipeline = async () => {
    if (triggering || status?.running) return;
    setTriggering(true);
    try {
      const res = await fetch('/api/pipeline', { method: 'POST', cache: 'no-store' });
      const data = await res.json();
      if (data.started) {
        // Pipeline er i gang — start polling
        setTimeout(fetchStatus, 3000);
      }
    } finally {
      setTriggering(false);
    }
  };

  const isRunning = triggering || status?.running;
  const isSuccess = status?.lastStatus === 'success';
  const isFailure = status?.lastStatus === 'failure';

  // Ikke konfigurert — vis ingenting ekstra, bare standard knapp
  if (status && !status.configured) {
    return (
      <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-5 h-5 text-gray-400" />
            <div>
              <h3 className="text-base font-bold text-brand-slate dark:text-white">Scanner</h3>
              <p className="text-xs text-gray-400 mt-0.5">Oppdateres automatisk kl 22:30 man–fre</p>
            </div>
          </div>
          <button
            onClick={() => onComplete?.()}
            className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Oppdater
          </button>
        </div>
        <div className="mt-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
            Legg til <code className="bg-gray-900 text-emerald-400 px-1 rounded">GITHUB_PAT</code> i Vercel for å aktivere sky-pipeline
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-500">
            Vercel → Settings → Environment Variables → GITHUB_PAT → GitHub token med workflow-tilgang
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCcw className={clsx('w-5 h-5', isRunning ? 'text-brand-emerald animate-spin' : 'text-gray-400')} />
          <div>
            <h3 className="text-base font-bold text-brand-slate dark:text-white">Scanner</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              {isRunning ? (
                <span className="text-brand-emerald">Kjører pipeline (~5 min)...</span>
              ) : status?.lastRun ? (
                <>
                  Sist kjørt: {timeAgo(status.lastRun)}
                  {isSuccess && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                  {isFailure && <XCircle className="w-3 h-3 text-red-500" />}
                  {status.runUrl && (
                    <a href={status.runUrl} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600" onClick={e => e.stopPropagation()}>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </>
              ) : (
                'Oppdateres automatisk kl 22:30 man–fre'
              )}
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
