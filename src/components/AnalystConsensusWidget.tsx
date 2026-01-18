'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ChevronRight, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { 
  getAllConsensus, 
  getAnalystRecommendations,
  type ConsensusResult 
} from '@/lib/store/analyst-store';

export default function AnalystConsensusWidget() {
  const [consensus, setConsensus] = useState<ConsensusResult[]>([]);
  const [totalRecs, setTotalRecs] = useState(0);

  useEffect(() => {
    setConsensus(getAllConsensus().slice(0, 5));
    setTotalRecs(getAnalystRecommendations().filter(r => !r.closed).length);
  }, []);

  const getConsensusStyle = (c: ConsensusResult['consensus']) => {
    switch (c) {
      case 'STERK_KJØP': return 'bg-green-100 text-green-700 border-green-300';
      case 'KJØP': return 'bg-green-50 text-green-600 border-green-200';
      case 'HOLD': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'SELG': return 'bg-red-50 text-red-600 border-red-200';
      case 'STERK_SELG': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-slate dark:text-dark-text" />
          <h3 className="text-xl font-bold text-brand-slate dark:text-dark-text">Analysthus-Konsensus</h3>
        </div>
        <Link
          href="/analysthus"
          className="flex items-center gap-1 text-sm text-brand-emerald hover:underline"
        >
          Se alle
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Content */}
      {consensus.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-dark-muted mb-2">Ingen anbefalinger importert</p>
          <Link
            href="/analysthus"
            className="text-sm text-brand-emerald hover:underline"
          >
            Importer fra DNB, Delphi, Investtech →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {consensus.map(item => (
            <Link
              key={item.ticker}
              href={`/analyse/${item.ticker}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <span className={clsx(
                  'px-2 py-1 rounded border text-xs font-bold',
                  getConsensusStyle(item.consensus)
                )}>
                  {item.consensus.replace('_', ' ')}
                </span>
                <div>
                  <div className="font-bold text-brand-slate dark:text-white group-hover:text-brand-emerald transition-colors">
                    {item.ticker.replace('.OL', '')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted">
                    {item.recommendations.length} kilder · {item.agreementLevel.toFixed(0)}% enighet
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-emerald transition-colors" />
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      {totalRecs > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border text-center">
          <span className="text-sm text-gray-500 dark:text-dark-muted">
            {totalRecs} aktive anbefalinger fra analysthus
          </span>
        </div>
      )}
    </div>
  );
}
