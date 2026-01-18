'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, ChevronRight, Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { Stock } from '@/lib/types';
import { calculateMasterScore, type MasterScoreBreakdown } from '@/lib/analysis/master-score';

interface MasterScoreWidgetProps {
  stocks: Stock[];
  limit?: number;
}

export default function MasterScoreWidget({ stocks, limit = 10 }: MasterScoreWidgetProps) {
  const [masterScores, setMasterScores] = useState<MasterScoreBreakdown[]>([]);
  const [selectedStock, setSelectedStock] = useState<MasterScoreBreakdown | null>(null);

  useEffect(() => {
    const scores = stocks
      .map(stock => calculateMasterScore(stock))
      .sort((a, b) => b.masterScore - a.masterScore)
      .slice(0, limit);
    setMasterScores(scores);
  }, [stocks, limit]);

  const getSignalStyle = (signal: MasterScoreBreakdown['signal']) => {
    switch (signal) {
      case 'STERK_KJØP': return 'bg-green-100 text-green-700 border-green-300';
      case 'KJØP': return 'bg-green-50 text-green-600 border-green-200';
      case 'HOLD': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'SELG': return 'bg-red-50 text-red-600 border-red-200';
      case 'STERK_SELG': return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-green-500';
    if (score >= 40) return 'text-yellow-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-surface-border dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-slate dark:text-white">Master Score</h2>
            <p className="text-sm text-gray-500 dark:text-dark-muted">K-Score + Investtech + Analysthus</p>
          </div>
        </div>
      </div>

      {/* Score List */}
      <div className="divide-y divide-gray-100 dark:divide-dark-border">
        {masterScores.map((score, index) => {
          const tickerShort = score.ticker.replace('.OL', '').replace('.CO', '');
          
          return (
            <div 
              key={score.ticker}
              className="group"
            >
              <div 
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors cursor-pointer"
                onClick={() => setSelectedStock(selectedStock?.ticker === score.ticker ? null : score)}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <span className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                    index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-dark-muted'
                  )}>
                    {index + 1}
                  </span>

                  {/* Ticker & Signal */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-slate dark:text-white group-hover:text-brand-emerald transition-colors">
                        {tickerShort}
                      </span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded border text-xs font-bold',
                        getSignalStyle(score.signal)
                      )}>
                        {score.signal.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-muted mt-1">
                      <span>{score.confidence}% confidence</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="flex items-center gap-3">
                  <div className={clsx('text-2xl font-bold', getScoreColor(score.masterScore))}>
                    {score.masterScore}
                  </div>
                  <ChevronRight className={clsx(
                    'w-5 h-5 text-gray-400 transition-transform',
                    selectedStock?.ticker === score.ticker && 'rotate-90'
                  )} />
                </div>
              </div>

              {/* Expanded Details */}
              {selectedStock?.ticker === score.ticker && (
                <div className="px-4 pb-4 pt-0 bg-gray-50 dark:bg-dark-bg">
                  {/* Component Breakdown */}
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {Object.entries(score.components).map(([key, comp]) => (
                      <div key={key} className="text-center">
                        <div className="text-xs text-gray-500 dark:text-dark-muted capitalize mb-1">
                          {key === 'kScore' ? 'K-Score' : key === 'investtech' ? 'Investtech' : key}
                        </div>
                        <div className={clsx(
                          'text-lg font-bold',
                          comp.value >= 70 ? 'text-green-600' :
                          comp.value >= 50 ? 'text-yellow-600' : 'text-red-500'
                        )}>
                          {comp.value}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(comp.weight * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reasons */}
                  {score.reasons.length > 0 && (
                    <div className="space-y-1">
                      {score.reasons.map((reason, i) => (
                        <div key={i} className="text-xs text-gray-600 dark:text-dark-muted flex items-start gap-2">
                          <span>{reason.startsWith('⚠️') ? '' : '✓'}</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Link */}
                  <Link
                    href={`/analyse/${score.ticker}`}
                    className="mt-4 block w-full text-center py-2 bg-brand-emerald text-white rounded-lg font-semibold text-sm hover:bg-brand-emerald/90 transition-colors"
                  >
                    Se full analyse →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="p-4 bg-gray-50 dark:bg-dark-bg border-t border-surface-border dark:border-dark-border">
        <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-dark-muted">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            Master Score kombinerer K-Score (30%), Investtech (20%), Analysthus-konsensus (20%), 
            Teknisk analyse (15%) og Fundamentale data (15%).
          </span>
        </div>
      </div>
    </div>
  );
}
