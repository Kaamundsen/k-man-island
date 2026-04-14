'use client';

import { RefreshCcw } from 'lucide-react';

/**
 * Pipeline info panel.
 * Scanning + price loading happens locally via scripts.
 * This just lets the user refresh the signal list.
 */
export default function PipelineRunner({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="bg-surface dark:bg-dark-surface rounded-3xl border border-surface-border dark:border-dark-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RefreshCcw className="w-5 h-5 text-gray-400" />
          <div>
            <h3 className="text-base font-bold text-brand-slate dark:text-white">Scanner</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Signaler oppdateres daglig via lokal pipeline
            </p>
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
    </div>
  );
}
