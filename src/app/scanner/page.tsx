'use client';

import { useState, useCallback } from 'react';
import SignalsTable from '@/components/SignalsTable';
import SlotsOverview from '@/components/SlotsOverview';
import PipelineRunner from '@/components/PipelineRunner';
import { Radar } from 'lucide-react';
import MarketStatus from '@/components/MarketStatus';

export default function ScannerPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePipelineComplete = useCallback(() => {
    // Force re-render of signals and slots
    setRefreshKey(k => k + 1);
  }, []);

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Radar className="w-8 h-8 text-brand-emerald" strokeWidth={2} />
            <h1 className="text-4xl font-extrabold text-brand-slate dark:text-white tracking-tight">
              Scanner
            </h1>
          </div>
          <MarketStatus />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Breakout-signaler fra OSE og US. Entry, stop-loss og posisjonsstorrelse ferdig beregnet.
        </p>
      </div>

      <div className="space-y-8">
        {/* Pipeline Runner */}
        <PipelineRunner onComplete={handlePipelineComplete} />

        {/* Signals */}
        <div key={`signals-${refreshKey}`}>
          <SignalsTable />
        </div>

        {/* Active Slots */}
        <div key={`slots-${refreshKey}`}>
          <SlotsOverview />
        </div>
      </div>
    </main>
  );
}
