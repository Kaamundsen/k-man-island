'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCcw,
  Calendar,
  BarChart3,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { getTrades } from '@/lib/store';
import { evaluatePortfolio, generateDailyReport, PortfolioSummary, TradeEvaluation } from '@/lib/analysis/portfolio-evaluation';
import { checkReminders, getActiveAlerts, getTriggeredAlerts, StockNote, StockAlert } from '@/lib/store/notes-store';

export default function RapportPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [evaluations, setEvaluations] = useState<TradeEvaluation[]>([]);
  const [reminders, setReminders] = useState<StockNote[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<StockAlert[]>([]);
  const [reportText, setReportText] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Accordion states
  const [reportOpen, setReportOpen] = useState(true);
  const [urgentOpen, setUrgentOpen] = useState(true);
  const [sellOpen, setSellOpen] = useState(true);
  const [holdOpen, setHoldOpen] = useState(false);
  const [buyMoreOpen, setBuyMoreOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Get trades
      const trades = getTrades();
      const activeTrades = trades.filter(t => t.status === 'ACTIVE');
      
      // Fetch live prices from API
      const prices: Record<string, number> = {};
      
      if (activeTrades.length > 0) {
        const uniqueTickers = Array.from(new Set(activeTrades.map(t => t.ticker)));
        
        try {
          const response = await fetch(`/api/quotes?tickers=${uniqueTickers.join(',')}`);
          if (response.ok) {
            const quotesData = await response.json();
            
            // Map prices from API response
            uniqueTickers.forEach(ticker => {
              const quote = quotesData[ticker];
              if (quote && quote.price) {
                prices[ticker] = quote.price;
              } else {
                // Fallback til entryPrice hvis ingen live-pris
                const trade = activeTrades.find(t => t.ticker === ticker);
                if (trade) {
                  prices[ticker] = trade.currentPrice || trade.entryPrice;
                }
              }
            });
          }
        } catch (err) {
          console.warn('Kunne ikke hente live-priser, bruker cached priser:', err);
          // Fallback til lagrede priser
          activeTrades.forEach(t => {
            prices[t.ticker] = t.currentPrice || t.entryPrice;
          });
        }
      }
      
      // Evaluate portfolio
      const { evaluations: evals, summary: sum } = evaluatePortfolio(trades, prices);
      setEvaluations(evals);
      setSummary(sum);
      
      // Generate report text
      const report = generateDailyReport(sum, evals);
      setReportText(report);
      
      // Load reminders and alerts
      setReminders(checkReminders());
      setActiveAlerts(getActiveAlerts());
      setTriggeredAlerts(getTriggeredAlerts());
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Feil ved lasting av rapport:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Daglig Rapport</h1>
            <p className="text-gray-600">
              Porteføljeevaluering og handlingsanbefalinger
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-slate text-white rounded-lg hover:bg-brand-slate/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            {isLoading ? 'Oppdaterer...' : 'Oppdater rapport'}
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Sist oppdatert: {lastUpdated.toLocaleString('nb-NO')}
          </p>
        )}
      </div>

      {/* Quick Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Aktive Trades</div>
            <div className="text-2xl font-bold text-gray-900">{summary.totalTrades || 0}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Urealisert P/L</div>
            <div className={clsx(
              'text-2xl font-bold',
              (summary.unrealizedPnL || 0) >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
            )}>
              {(summary.unrealizedPnL || 0) >= 0 ? '+' : ''}{(summary.unrealizedPnL || 0).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Krever Handling</div>
            <div className="text-2xl font-bold text-red-600">
              {evaluations.filter(e => e.urgency === 'critical' || e.urgency === 'high').length}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Win Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {(summary.winRate || 0).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Active Reminders & Alerts */}
      {(reminders.length > 0 || triggeredAlerts.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Påminnelser og varsler
          </h2>
          
          {reminders.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-yellow-700 mb-2">📝 Påminnelser</h3>
              {reminders.map(note => (
                <div key={note.id} className="bg-white rounded-lg p-3 mb-2 border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{note.ticker}</span>
                    <span className="text-sm text-yellow-600">{note.reminder}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{note.note}</p>
                </div>
              ))}
            </div>
          )}
          
          {triggeredAlerts.length > 0 && (
            <div>
              <h3 className="font-semibold text-yellow-700 mb-2">🔔 Utløste varsler</h3>
              {triggeredAlerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-lg p-3 mb-2 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{alert.ticker}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Portfolio Summary */}
      {summary && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-emerald" />
            Porteføljestatus
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Investert</p>
              <p className="text-xl font-bold">{summary.totalInvested.toLocaleString('nb-NO')} kr</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Nåverdi</p>
              <p className="text-xl font-bold">{summary.currentValue.toLocaleString('nb-NO')} kr</p>
            </div>
            <div className={clsx(
              'rounded-xl p-4',
              summary.totalPnL >= 0 ? 'bg-green-50' : 'bg-red-50'
            )}>
              <p className="text-sm text-gray-500">P/L</p>
              <p className={clsx(
                'text-xl font-bold',
                summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {summary.totalPnL >= 0 ? '+' : ''}{summary.totalPnL.toLocaleString('nb-NO')} kr
              </p>
              <p className={clsx(
                'text-sm',
                summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                ({summary.totalPnLPercent >= 0 ? '+' : ''}{summary.totalPnLPercent.toFixed(1)}%)
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">Aktive trades</p>
              <p className="text-xl font-bold">{evaluations.length}</p>
            </div>
          </div>

          {/* Recommendation breakdown */}
          <div className="flex flex-wrap gap-3">
            {summary.recommendations.strongSell > 0 && (
              <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium">
                🔴 Selg nå: {summary.recommendations.strongSell}
              </span>
            )}
            {summary.recommendations.sell > 0 && (
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-medium">
                🟠 Selg: {summary.recommendations.sell}
              </span>
            )}
            {summary.recommendations.hold > 0 && (
              <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
                🟡 Hold: {summary.recommendations.hold}
              </span>
            )}
            {summary.recommendations.buy > 0 && (
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                🟢 Kjøp mer: {summary.recommendations.buy}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 📋 Dagsrapport - Accordion */}
      {reportText && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl mb-8 overflow-hidden shadow-lg">
          <button 
            onClick={() => setReportOpen(!reportOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
          >
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand-emerald" />
              📋 Dagsrapport
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {lastUpdated?.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <ChevronDown className={clsx(
                'w-5 h-5 text-slate-400 transition-transform',
                reportOpen && 'rotate-180'
              )} />
            </div>
          </button>
          {reportOpen && (
            <div className="px-6 pb-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200 bg-slate-800/50 rounded-xl p-4 overflow-x-auto">
                {reportText}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Urgent Actions - Krever handling - Accordion */}
      {evaluations.filter(e => e.urgency === 'critical' || e.urgency === 'high').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl mb-4 overflow-hidden">
          <button 
            onClick={() => setUrgentOpen(!urgentOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-red-100/50 transition-colors"
          >
            <h2 className="text-xl font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              Krever handling nå ({evaluations.filter(e => e.urgency === 'critical' || e.urgency === 'high').length})
            </h2>
            <ChevronDown className={clsx(
              'w-5 h-5 text-red-600 transition-transform',
              urgentOpen && 'rotate-180'
            )} />
          </button>
          {urgentOpen && (
            <div className="px-6 pb-6 space-y-3">
              {evaluations
                .filter(e => e.urgency === 'critical' || e.urgency === 'high')
                .map(e => (
                  <div key={e.trade.id} className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{e.trade.ticker}</span>
                        <span className="text-sm text-gray-500">
                          {e.currentPrice?.toFixed(2)} kr ({e.unrealizedPnLPercent >= 0 ? '+' : ''}{e.unrealizedPnLPercent?.toFixed(1) || 0}%)
                        </span>
                      </div>
                      <span className={clsx(
                        'px-2 py-1 rounded text-xs font-bold',
                        e.recommendation.includes('SELL') ? 'bg-red-600 text-white' : 'bg-green-500 text-white'
                      )}>
                        {e.recommendation === 'STRONG_SELL' ? 'SELG NÅ' : e.recommendation}
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {e.reasons.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700">{r}</li>
                      ))}
                    </ul>
                    {e.warnings.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-red-100">
                        {e.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-orange-600">⚠️ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Sell Recommendations - Accordion */}
      {evaluations.filter(e => e.recommendation === 'SELL' && e.urgency !== 'critical' && e.urgency !== 'high').length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl mb-4 overflow-hidden">
          <button 
            onClick={() => setSellOpen(!sellOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-orange-100/50 transition-colors"
          >
            <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
              <TrendingDown className="w-6 h-6" />
              Selg ({evaluations.filter(e => e.recommendation === 'SELL' && e.urgency !== 'critical' && e.urgency !== 'high').length})
            </h2>
            <ChevronDown className={clsx(
              'w-5 h-5 text-orange-600 transition-transform',
              sellOpen && 'rotate-180'
            )} />
          </button>
          {sellOpen && (
            <div className="px-6 pb-6 space-y-3">
              {evaluations
                .filter(e => e.recommendation === 'SELL' && e.urgency !== 'critical' && e.urgency !== 'high')
                .map(e => (
                  <div key={e.trade.id} className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{e.trade.ticker}</span>
                        <span className="text-sm text-gray-500">
                          {e.currentPrice?.toFixed(2)} kr
                        </span>
                        <span className={clsx(
                          'text-sm font-medium',
                          e.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          ({e.unrealizedPnLPercent >= 0 ? '+' : ''}{e.unrealizedPnLPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-orange-500 text-white rounded text-xs font-bold">
                        SELG
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {e.reasons.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700">{r}</li>
                      ))}
                    </ul>
                    {e.warnings.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-orange-100">
                        {e.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-orange-600">⚠️ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Hold Recommendations - Accordion */}
      {evaluations.filter(e => e.recommendation === 'HOLD').length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl mb-8 overflow-hidden">
          <button 
            onClick={() => setHoldOpen(!holdOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-yellow-100/50 transition-colors"
          >
            <h2 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Hold ({evaluations.filter(e => e.recommendation === 'HOLD').length})
            </h2>
            <ChevronDown className={clsx(
              'w-5 h-5 text-yellow-600 transition-transform',
              holdOpen && 'rotate-180'
            )} />
          </button>
          {holdOpen && (
            <div className="px-6 pb-6 space-y-3">
              {evaluations
                .filter(e => e.recommendation === 'HOLD')
                .map(e => (
                  <div key={e.trade.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{e.trade.ticker}</span>
                        <span className="text-sm text-gray-500">
                          {e.currentPrice?.toFixed(2)} kr
                        </span>
                        <span className={clsx(
                          'text-sm font-medium',
                          e.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          ({e.unrealizedPnLPercent >= 0 ? '+' : ''}{e.unrealizedPnLPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs font-bold">
                        HOLD
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span>📊 Progress: {e.progressToTarget.toFixed(0)}% mot target</span>
                      <span>📅 {e.daysHeld} dager holdt</span>
                      {e.daysToDeadline > 0 && (
                        <span>⏰ {e.daysToDeadline} dager igjen</span>
                      )}
                    </div>
                    <ul className="space-y-1">
                      {e.reasons.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700">{r}</li>
                      ))}
                    </ul>
                    {e.warnings.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-yellow-100">
                        {e.warnings.map((w, i) => (
                          <p key={i} className="text-xs text-orange-600">⚠️ {w}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Buy More Recommendations - Accordion */}
      {evaluations.filter(e => e.recommendation === 'BUY' || e.recommendation === 'STRONG_BUY').length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl mb-8 overflow-hidden">
          <button 
            onClick={() => setBuyMoreOpen(!buyMoreOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-green-100/50 transition-colors"
          >
            <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Kjøp mer ({evaluations.filter(e => e.recommendation === 'BUY' || e.recommendation === 'STRONG_BUY').length})
            </h2>
            <ChevronDown className={clsx(
              'w-5 h-5 text-green-600 transition-transform',
              buyMoreOpen && 'rotate-180'
            )} />
          </button>
          {buyMoreOpen && (
            <div className="px-6 pb-6 space-y-3">
              {evaluations
                .filter(e => e.recommendation === 'BUY' || e.recommendation === 'STRONG_BUY')
                .map(e => (
                  <div key={e.trade.id} className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{e.trade.ticker}</span>
                        <span className="text-sm text-gray-500">
                          {e.currentPrice?.toFixed(2)} kr
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          (+{e.unrealizedPnLPercent?.toFixed(1) || 0}%)
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-bold">
                        KJØP MER
                      </span>
                    </div>
                    <ul className="space-y-1">
                      {e.reasons.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700">{r}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

    </main>
  );
}
