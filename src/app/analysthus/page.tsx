'use client';

import AnalystTracker from '@/components/AnalystTracker';

export default function AnalysthusPage() {
  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-slate dark:text-white mb-2">
          Analysthus-Tracker
        </h1>
        <p className="text-gray-500 dark:text-dark-muted">
          Track anbefalinger fra DNB Markets, Delphi Fondene, Investtech og andre. 
          Se konsensus og historisk treffsikkerhet.
        </p>
      </div>

      {/* Main Component */}
      <AnalystTracker />

      {/* Info Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
          <h3 className="font-bold text-brand-slate dark:text-white mb-3 flex items-center gap-2">
            📊 Slik bruker du tracker
          </h3>
          <ul className="text-sm text-gray-600 dark:text-dark-muted space-y-2">
            <li>• Importer anbefalinger fra dine kilder</li>
            <li>• Se konsensus når flere er enige</li>
            <li>• Track historisk treffsikkerhet</li>
            <li>• Kombiner med K-Score for bedre beslutninger</li>
          </ul>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
          <h3 className="font-bold text-brand-slate dark:text-white mb-3 flex items-center gap-2">
            📈 Import-format
          </h3>
          <div className="text-sm text-gray-600 dark:text-dark-muted space-y-2">
            <p className="font-medium">CSV-format:</p>
            <code className="block bg-gray-100 dark:bg-dark-bg p-2 rounded text-xs">
              TICKER, NAVN, SIGNAL, PRIS, MÅL
            </code>
            <p className="text-xs">Eksempel:</p>
            <code className="block bg-gray-100 dark:bg-dark-bg p-2 rounded text-xs">
              VAR, Vår Energi, KJØP, 33.71, 39.30
            </code>
          </div>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
          <h3 className="font-bold text-brand-slate dark:text-white mb-3 flex items-center gap-2">
            🎯 Konsensus-nivåer
          </h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">STERK KJØP</span>
              <span className="text-gray-600 dark:text-dark-muted">100% enige om kjøp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-bold">KJØP</span>
              <span className="text-gray-600 dark:text-dark-muted">&gt;70% anbefaler kjøp</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded text-xs font-bold">HOLD</span>
              <span className="text-gray-600 dark:text-dark-muted">&gt;50% anbefaler hold</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs font-bold">BLANDET</span>
              <span className="text-gray-600 dark:text-dark-muted">Uenighet mellom kilder</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
