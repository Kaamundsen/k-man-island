'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Target, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { Trade } from '@/lib/types';
import { getTrades } from '@/lib/store';
import { evaluateTrade, TradeEvaluation } from '@/lib/analysis/portfolio-evaluation';

interface PositionReportSectionProps {
  ticker: string;
  currentPrice: number;
}

export default function PositionReportSection({ ticker, currentPrice }: PositionReportSectionProps) {
  const [positions, setPositions] = useState<Trade[]>([]);
  const [evaluations, setEvaluations] = useState<TradeEvaluation[]>([]);

  useEffect(() => {
    const allTrades = getTrades();
    const tickerPositions = allTrades.filter(
      t => t.ticker === ticker && t.status === 'ACTIVE'
    );
    setPositions(tickerPositions);
    
    // Evaluate each position
    const evals = tickerPositions.map(trade => evaluateTrade(trade, currentPrice));
    setEvaluations(evals);
  }, [ticker, currentPrice]);

  if (positions.length === 0) {
    return null; // Don't show section if no positions
  }

  const recommendationColors = {
    STRONG_BUY: 'bg-green-600',
    BUY: 'bg-green-500',
    HOLD: 'bg-yellow-500',
    SELL: 'bg-orange-500',
    STRONG_SELL: 'bg-red-600',
  };

  const recommendationText = {
    STRONG_BUY: 'STERKT KJØP',
    BUY: 'KJØP MER',
    HOLD: 'HOLD',
    SELL: 'SELG',
    STRONG_SELL: 'SELG NÅ',
  };

  const urgencyColors = {
    low: 'border-gray-200',
    medium: 'border-yellow-300',
    high: 'border-orange-400',
    critical: 'border-red-500 bg-red-50',
  };

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation, index) => {
        const { trade, recommendation, urgency, reasons, warnings } = evaluation;
        const totalInvested = trade.entryPrice * trade.quantity;
        const currentValue = currentPrice * trade.quantity;
        const isProfit = evaluation.unrealizedPnL >= 0;

        return (
          <div 
            key={trade.id || index}
            className={clsx(
              'bg-white rounded-2xl border-2 overflow-hidden',
              urgencyColors[urgency]
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-slate to-gray-700 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">📊 Din posisjon</h3>
                <span className={clsx(
                  'px-3 py-1 rounded-full text-sm font-bold',
                  recommendationColors[recommendation]
                )}>
                  {recommendationText[recommendation]}
                </span>
              </div>
            </div>

            {/* Position Details */}
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Kjøpt</p>
                  <p className="font-bold text-gray-900">
                    {trade.entryPrice.toFixed(2)} kr × {trade.quantity}
                  </p>
                  <p className="text-sm text-gray-500">{totalInvested.toLocaleString('nb-NO')} kr</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nåværende</p>
                  <p className="font-bold text-gray-900">
                    {currentPrice.toFixed(2)} kr × {trade.quantity}
                  </p>
                  <p className="text-sm text-gray-500">{currentValue.toLocaleString('nb-NO')} kr</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">P/L</p>
                  <p className={clsx(
                    'font-bold text-xl',
                    isProfit ? 'text-green-600' : 'text-red-600'
                  )}>
                    {isProfit ? '+' : ''}{evaluation.unrealizedPnL.toLocaleString('nb-NO')} kr
                  </p>
                  <p className={clsx(
                    'text-sm font-medium',
                    isProfit ? 'text-green-600' : 'text-red-600'
                  )}>
                    {isProfit ? '+' : ''}{evaluation.unrealizedPnLPercent.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Holdt</p>
                  <p className="font-bold text-gray-900">{evaluation.daysHeld} dager</p>
                  <p className="text-sm text-gray-500">
                    {evaluation.daysToDeadline > 0 
                      ? `${evaluation.daysToDeadline} dager igjen`
                      : `${Math.abs(evaluation.daysToDeadline)} dager over`
                    }
                  </p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 mb-4">
                {/* Progress to Target */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Stop: {trade.stopLoss.toFixed(2)} kr
                    </span>
                    <span>Entry: {trade.entryPrice.toFixed(2)} kr</span>
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Target: {trade.target.toFixed(2)} kr
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    {/* Stop zone */}
                    <div 
                      className="absolute left-0 h-full bg-red-200"
                      style={{ width: '20%' }}
                    />
                    {/* Target zone */}
                    <div 
                      className="absolute right-0 h-full bg-green-200"
                      style={{ width: '20%' }}
                    />
                    {/* Current position marker */}
                    <div
                      className={clsx(
                        'absolute top-0 h-full w-1 transition-all',
                        evaluation.progressToTarget >= 100 ? 'bg-green-600' :
                        evaluation.progressToStop >= 80 ? 'bg-red-600' :
                        'bg-blue-600'
                      )}
                      style={{
                        left: `${Math.min(100, Math.max(0, 
                          20 + (evaluation.progressToTarget / 100) * 60
                        ))}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className={clsx(
                      evaluation.progressToStop >= 50 ? 'text-red-600 font-medium' : 'text-gray-400'
                    )}>
                      {evaluation.progressToStop.toFixed(0)}% mot stop
                    </span>
                    <span className={clsx(
                      evaluation.progressToTarget >= 80 ? 'text-green-600 font-medium' : 'text-gray-400'
                    )}>
                      {evaluation.progressToTarget.toFixed(0)}% mot target
                    </span>
                  </div>
                </div>
              </div>

              {/* Reasons */}
              {reasons.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="font-medium text-gray-700 mb-2">Anbefaling:</p>
                  <ul className="space-y-1">
                    {reasons.map((reason, i) => (
                      <li key={i} className="text-sm text-gray-600">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="font-medium text-yellow-800">Advarsler</p>
                  </div>
                  <ul className="space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
