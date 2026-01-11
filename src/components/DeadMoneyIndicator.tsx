import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { DeadMoneyAnalysis, getDeadMoneyColor } from '@/lib/analysis/dead-money';

interface DeadMoneyIndicatorProps {
  analysis: DeadMoneyAnalysis;
  compact?: boolean;
}

export default function DeadMoneyIndicator({ analysis, compact = false }: DeadMoneyIndicatorProps) {
  const colors = getDeadMoneyColor(analysis);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.text}`}>
        {analysis.isDeadMoney && <AlertTriangle className="w-4 h-4" />}
        <span className="text-xs font-bold">
          {analysis.timeProgress}% tid · {analysis.priceProgress}% progress
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 border-2 ${colors.border}`}>
          {analysis.isDeadMoney ? (
            <AlertTriangle className={`w-6 h-6 ${colors.text}`} />
          ) : analysis.priceProgress >= 90 ? (
            <TrendingUp className={`w-6 h-6 ${colors.text}`} />
          ) : (
            <Clock className={`w-6 h-6 ${colors.text}`} />
          )}
        </div>

        <div className="flex-1">
          <h4 className={`font-bold mb-2 text-lg ${colors.text}`}>
            {analysis.isDeadMoney ? '⚠️ Dead Money Warning' : 
             analysis.priceProgress >= 90 ? '✓ Nærmer seg Target' :
             'Trade Status'}
          </h4>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Tidsbruk</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${analysis.isDeadMoney ? 'bg-yellow-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(analysis.timeProgress, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>{analysis.timeProgress}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {analysis.daysElapsed} dager brukt · {analysis.daysRemaining} dager igjen
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">Pris-progresjon</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full ${
                      analysis.priceProgress >= 90 ? 'bg-brand-emerald' :
                      analysis.priceProgress >= 50 ? 'bg-green-500' :
                      analysis.priceProgress >= 0 ? 'bg-yellow-500' :
                      'bg-brand-rose'
                    }`}
                    style={{ width: `${Math.min(Math.max(analysis.priceProgress, 0), 100)}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>{analysis.priceProgress}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Til target
              </div>
            </div>
          </div>

          <div className={`${colors.bg} rounded-lg p-3 border ${colors.border}`}>
            <div className="text-xs font-bold text-gray-600 mb-1">ANBEFALING</div>
            <p className={`text-sm ${colors.text} font-medium leading-relaxed`}>
              {analysis.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
