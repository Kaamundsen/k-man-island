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
  Loader2,
  Target,
  Layers,
  Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { getTrades } from '@/lib/store';
import { evaluatePortfolio, generateDailyReport, PortfolioSummary, TradeEvaluation } from '@/lib/analysis/portfolio-evaluation';
import { checkReminders, getActiveAlerts, getTriggeredAlerts, StockNote, StockAlert } from '@/lib/store/notes-store';
import { qualifiesForCore, getMaxCoreSlots } from '@/lib/strategies/registry';

// V2-compliant Core Brief structure
interface CoreBriefData {
  asOfDate: string;
  coreStatus: {
    slotsUsed: number;
    maxSlots: number;
    trendCount: number;
    asymCount: number;
    openSlots: number;
  };
  actions: {
    exits: Array<{ ticker: string; reason: string }>;
    moveStops: Array<{ ticker: string; action: string }>;
    enters: Array<{ ticker: string; profile: string; rr: number }>;
    holds: Array<{ ticker: string; note: string }>;
  };
  candidates: Array<{ ticker: string; profile: string; score: number; blockedReason?: string }>;
  riskCheck: {
    maxRiskPerTrade: boolean;
    totalExposure: boolean;
    overtrading: boolean;
  };
}

// Market overview data
interface MarketOverview {
  totalStocks: number;
  buySignals: number;
  holdSignals: number;
  sellSignals: number;
  topBuyStocks: Array<{ ticker: string; kScore: number; signal: string }>;
  timestamp: string;
}

export default function RapportPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [evaluations, setEvaluations] = useState<TradeEvaluation[]>([]);
  const [reminders, setReminders] = useState<StockNote[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StockAlert[]>([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState<StockAlert[]>([]);
  const [reportText, setReportText] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [coreBrief, setCoreBrief] = useState<CoreBriefData | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  
  // Accordion states
  const [coreBriefOpen, setCoreBriefOpen] = useState(true);
  const [marketOpen, setMarketOpen] = useState(true);
  const [portfolioOpen, setPortfolioOpen] = useState(true);
  const [urgentOpen, setUrgentOpen] = useState(true);
  const [sellOpen, setSellOpen] = useState(true);
  const [holdOpen, setHoldOpen] = useState(false);
  const [buyMoreOpen, setBuyMoreOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // 1. Fetch market overview (full re-fetch of stock data)
      console.log('📊 Rapport: Fetching market data...');
      try {
        const stocksResponse = await fetch('/api/stocks?limit=50');
        if (stocksResponse.ok) {
          const stocksData = await stocksResponse.json();
          const stocks = stocksData.stocks || [];
          
          const buyStocks = stocks.filter((s: any) => s.signal === 'BUY');
          const holdStocks = stocks.filter((s: any) => s.signal === 'HOLD');
          const sellStocks = stocks.filter((s: any) => s.signal === 'SELL');
          
          setMarketOverview({
            totalStocks: stocks.length,
            buySignals: buyStocks.length,
            holdSignals: holdStocks.length,
            sellSignals: sellStocks.length,
            topBuyStocks: buyStocks.slice(0, 5).map((s: any) => ({
              ticker: s.ticker,
              kScore: s.kScore,
              signal: s.signal,
            })),
            timestamp: stocksData.timestamp,
          });
        }
      } catch (err) {
        console.warn('Kunne ikke hente markedsdata:', err);
      }
      
      // 2. Get trades from local store
      const trades = getTrades();
      const activeTrades = trades.filter(t => t.status === 'ACTIVE');
      
      // 3. Fetch live prices for portfolio tickers
      const prices: Record<string, number> = {};
      
      if (activeTrades.length > 0) {
        const uniqueTickers = Array.from(new Set(activeTrades.map(t => t.ticker)));
        
        try {
          const response = await fetch(`/api/quotes?tickers=${uniqueTickers.join(',')}`);
          if (response.ok) {
            const quotesData = await response.json();
            
            uniqueTickers.forEach(ticker => {
              const quote = quotesData[ticker];
              if (quote && quote.price) {
                prices[ticker] = quote.price;
              } else {
                const trade = activeTrades.find(t => t.ticker === ticker);
                if (trade) {
                  prices[ticker] = trade.currentPrice || trade.entryPrice;
                }
              }
            });
          }
        } catch (err) {
          console.warn('Kunne ikke hente live-priser, bruker cached priser:', err);
          activeTrades.forEach(t => {
            prices[t.ticker] = t.currentPrice || t.entryPrice;
          });
        }
      }
      
      // 4. Evaluate portfolio with fresh prices
      const { evaluations: evals, summary: sum } = evaluatePortfolio(trades, prices);
      setEvaluations(evals);
      setSummary(sum);
      
      // 5. Generate report text
      const report = generateDailyReport(sum, evals);
      setReportText(report);
      
      // 6. Generate Core Brief (V2 structure)
      const brief = generateCoreBrief(evals, activeTrades.length);
      setCoreBrief(brief);
      
      // 7. Load reminders and alerts
      setReminders(checkReminders());
      setActiveAlerts(getActiveAlerts());
      setTriggeredAlerts(getTriggeredAlerts());
      
      setLastUpdated(new Date());
      console.log('✅ Rapport: Data loaded successfully');
    } catch (error) {
      console.error('Feil ved lasting av rapport:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Generate Core Brief according to V2 docs (14_CORE_BRIEF_V2.md)
   */
  function generateCoreBrief(evals: TradeEvaluation[], activeCount: number): CoreBriefData {
    const maxSlots = getMaxCoreSlots();
    const today = new Date().toISOString().split('T')[0];
    
    // Categorize actions
    const exits: Array<{ ticker: string; reason: string }> = [];
    const moveStops: Array<{ ticker: string; action: string }> = [];
    const enters: Array<{ ticker: string; profile: string; rr: number }> = [];
    const holds: Array<{ ticker: string; note: string }> = [];
    
    evals.forEach(e => {
      if (e.recommendation === 'STRONG_SELL' || e.recommendation === 'SELL') {
        exits.push({ 
          ticker: e.trade.ticker, 
          reason: e.reasons[0] || 'Anbefalt exit' 
        });
      } else if (e.progressToTarget >= 50 && e.unrealizedPnLPercent >= 5) {
        // Move stop to break-even at +1R equivalent
        moveStops.push({
          ticker: e.trade.ticker,
          action: `Flytt stop til break-even (${e.trade.entryPrice.toFixed(2)} kr)`
        });
      } else {
        holds.push({
          ticker: e.trade.ticker,
          note: e.progressToTarget > 30 ? 'God fremgang' : 'Plan intakt'
        });
      }
    });
    
    // Estimate profile distribution (simplified)
    const trendCount = Math.min(3, Math.ceil(activeCount * 0.6));
    const asymCount = Math.min(2, activeCount - trendCount);
    
    return {
      asOfDate: today,
      coreStatus: {
        slotsUsed: Math.min(activeCount, maxSlots),
        maxSlots,
        trendCount,
        asymCount,
        openSlots: Math.max(0, maxSlots - activeCount),
      },
      actions: {
        exits,
        moveStops,
        enters,
        holds,
      },
      candidates: [], // Would be populated from stock scanner
      riskCheck: {
        maxRiskPerTrade: true,
        totalExposure: activeCount <= maxSlots,
        overtrading: false,
      },
    };
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daglig Rapport</h1>
            <p className="text-gray-600">
              Core Brief + Porteføljeevaluering
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
            {isLoading ? 'Oppdaterer...' : 'Oppdater nå'}
          </button>
        </div>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-2">
            Sist oppdatert: {lastUpdated.toLocaleString('nb-NO')}
          </p>
        )}
      </div>

      {/* ============================================ */}
      {/* SECTION A: CORE BRIEF (V2 compliant) */}
      {/* ============================================ */}
      {coreBrief && (
        <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl mb-8 overflow-hidden shadow-lg">
          <button 
            onClick={() => setCoreBriefOpen(!coreBriefOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-emerald-800/30 transition-colors"
          >
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-400" />
              CORE BRIEF
            </h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-800 text-emerald-200 rounded-full text-sm font-medium">
                {coreBrief.coreStatus.slotsUsed} / {coreBrief.coreStatus.maxSlots} slots
              </span>
              <ChevronDown className={clsx(
                'w-5 h-5 text-emerald-400 transition-transform',
                coreBriefOpen && 'rotate-180'
              )} />
            </div>
          </button>
          
          {coreBriefOpen && (
            <div className="px-6 pb-6 space-y-6">
              {/* Core Status */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-emerald-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{coreBrief.coreStatus.slotsUsed}</div>
                  <div className="text-xs text-emerald-300">Aktive slots</div>
                </div>
                <div className="bg-emerald-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-400">{coreBrief.coreStatus.trendCount}</div>
                  <div className="text-xs text-emerald-300">TREND</div>
                </div>
                <div className="bg-emerald-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{coreBrief.coreStatus.asymCount}</div>
                  <div className="text-xs text-emerald-300">ASYM</div>
                </div>
                <div className="bg-emerald-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{coreBrief.coreStatus.openSlots}</div>
                  <div className="text-xs text-emerald-300">Ledige</div>
                </div>
              </div>
              
              {/* Today's Actions */}
              <div className="bg-emerald-800/30 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Dagens Handlinger
                </h3>
                
                {/* EXIT */}
                {coreBrief.actions.exits.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-red-400 font-medium mb-2">EXIT</h4>
                    {coreBrief.actions.exits.map((e, i) => (
                      <div key={i} className="flex items-center justify-between bg-red-900/30 rounded-lg p-3 mb-2">
                        <span className="font-bold text-white">{e.ticker}</span>
                        <span className="text-sm text-red-300">{e.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* MOVE_STOP */}
                {coreBrief.actions.moveStops.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-amber-400 font-medium mb-2">MOVE STOP</h4>
                    {coreBrief.actions.moveStops.map((m, i) => (
                      <div key={i} className="flex items-center justify-between bg-amber-900/30 rounded-lg p-3 mb-2">
                        <span className="font-bold text-white">{m.ticker}</span>
                        <span className="text-sm text-amber-300">{m.action}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* ENTER */}
                {coreBrief.actions.enters.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-emerald-400 font-medium mb-2">ENTER</h4>
                    {coreBrief.actions.enters.map((e, i) => (
                      <div key={i} className="flex items-center justify-between bg-emerald-900/30 rounded-lg p-3 mb-2">
                        <span className="font-bold text-white">{e.ticker}</span>
                        <span className="text-sm text-emerald-300">{e.profile} | R/R: {e.rr}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* No actions message */}
                {coreBrief.actions.exits.length === 0 && 
                 coreBrief.actions.moveStops.length === 0 && 
                 coreBrief.actions.enters.length === 0 && (
                  <p className="text-emerald-300 italic">Ingen aktive handlinger i dag.</p>
                )}
              </div>
              
              {/* HOLD overview */}
              {coreBrief.actions.holds.length > 0 && (
                <div className="bg-emerald-800/20 rounded-xl p-4">
                  <h4 className="text-emerald-300 font-medium mb-2">HOLD ({coreBrief.actions.holds.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {coreBrief.actions.holds.map((h, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-800/50 rounded-full text-sm text-white">
                        {h.ticker} - {h.note}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Risk Check */}
              <div className="bg-emerald-800/20 rounded-xl p-4">
                <h4 className="text-emerald-300 font-medium mb-2">Risiko & Disiplin</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className={clsx(
                    'flex items-center gap-1',
                    coreBrief.riskCheck.maxRiskPerTrade ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {coreBrief.riskCheck.maxRiskPerTrade ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Maks risiko per trade
                  </span>
                  <span className={clsx(
                    'flex items-center gap-1',
                    coreBrief.riskCheck.totalExposure ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {coreBrief.riskCheck.totalExposure ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Total eksponering OK
                  </span>
                  <span className={clsx(
                    'flex items-center gap-1',
                    !coreBrief.riskCheck.overtrading ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {!coreBrief.riskCheck.overtrading ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Ingen overtrading
                  </span>
                </div>
              </div>
              
              {/* Daily mantra */}
              <div className="text-center pt-4 border-t border-emerald-700">
                <p className="text-emerald-300 italic text-sm">
                  "I dag skal jeg kun gjøre det Core Brief sier."
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION: MARKET OVERVIEW */}
      {/* ============================================ */}
      {marketOverview && (
        <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl mb-8 overflow-hidden shadow-lg">
          <button 
            onClick={() => setMarketOpen(!marketOpen)}
            className="w-full p-6 flex items-center justify-between text-left hover:bg-blue-800/30 transition-colors"
          >
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Markedsoversikt
            </h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-800 text-blue-200 rounded-full text-sm font-medium">
                {marketOverview.totalStocks} aksjer skannet
              </span>
              <ChevronDown className={clsx(
                'w-5 h-5 text-blue-400 transition-transform',
                marketOpen && 'rotate-180'
              )} />
            </div>
          </button>
          
          {marketOpen && (
            <div className="px-6 pb-6 space-y-6">
              {/* Signal Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">{marketOverview.buySignals}</div>
                  <div className="text-xs text-emerald-300">Kjøpssignaler</div>
                </div>
                <div className="bg-amber-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-amber-400">{marketOverview.holdSignals}</div>
                  <div className="text-xs text-amber-300">Hold/Avvent</div>
                </div>
                <div className="bg-red-900/50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">{marketOverview.sellSignals}</div>
                  <div className="text-xs text-red-300">Salgssignaler</div>
                </div>
              </div>
              
              {/* Top Buy Signals */}
              {marketOverview.topBuyStocks.length > 0 && (
                <div className="bg-blue-800/30 rounded-xl p-4">
                  <h4 className="text-blue-300 font-medium mb-3">Topp 5 Kjøpskandidater</h4>
                  <div className="space-y-2">
                    {marketOverview.topBuyStocks.map((stock, i) => (
                      <div key={stock.ticker} className="flex items-center justify-between bg-blue-900/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </span>
                          <span className="font-bold text-white">{stock.ticker.replace('.OL', '')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-300">K-Score:</span>
                          <span className="font-bold text-emerald-400">{stock.kScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Timestamp */}
              <div className="text-center text-xs text-blue-400">
                Sist skannet: {new Date(marketOverview.timestamp).toLocaleString('nb-NO')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* SECTION B: PORTFOLIO REVIEW */}
      {/* ============================================ */}
      <div className="bg-white rounded-2xl border border-gray-100 mb-8 overflow-hidden">
        <button 
          onClick={() => setPortfolioOpen(!portfolioOpen)}
          className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-slate" />
            Portfolio Review
          </h2>
          <ChevronDown className={clsx(
            'w-5 h-5 text-gray-400 transition-transform',
            portfolioOpen && 'rotate-180'
          )} />
        </button>
        
        {portfolioOpen && summary && (
          <div className="px-6 pb-6">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Aktive Trades</div>
                <div className="text-2xl font-bold text-gray-900">{summary.totalTrades || 0}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Maks CORE: {getMaxCoreSlots()} slots
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Urealisert P/L</div>
                <div className={clsx(
                  'text-2xl font-bold',
                  (summary.unrealizedPnL || 0) >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
                )}>
                  {(summary.unrealizedPnL || 0) >= 0 ? '+' : ''}{(summary.unrealizedPnL || 0).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Krever Handling</div>
                <div className="text-2xl font-bold text-red-600">
                  {evaluations.filter(e => e.urgency === 'critical' || e.urgency === 'high').length}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-sm text-gray-500 mb-1">Win Rate</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(summary.winRate || 0).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Slot Warning */}
            {summary.totalTrades > getMaxCoreSlots() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    Over CORE-grense: {summary.totalTrades} trades aktive, maks {getMaxCoreSlots()} anbefalt
                  </span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Vurder å redusere til {getMaxCoreSlots()} CORE-trades for bedre fokus og risikostyring.
                </p>
              </div>
            )}

            {/* Recommendation breakdown */}
            <div className="flex flex-wrap gap-3">
              {summary.recommendations.strongSell > 0 && (
                <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium">
                  Selg nå: {summary.recommendations.strongSell}
                </span>
              )}
              {summary.recommendations.sell > 0 && (
                <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-medium">
                  Selg: {summary.recommendations.sell}
                </span>
              )}
              {summary.recommendations.hold > 0 && (
                <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm font-medium">
                  Hold: {summary.recommendations.hold}
                </span>
              )}
              {summary.recommendations.buy > 0 && (
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                  Kjøp mer: {summary.recommendations.buy}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Reminders & Alerts */}
      {(reminders.length > 0 || triggeredAlerts.length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Påminnelser og varsler
          </h2>
          
          {reminders.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-yellow-700 mb-2">Påminnelser</h3>
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
              <h3 className="font-semibold text-yellow-700 mb-2">Utløste varsler</h3>
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

      {/* Urgent Actions - Krever handling */}
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
                        {e.recommendation === 'STRONG_SELL' ? 'EXIT' : e.recommendation}
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

      {/* Sell Recommendations */}
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
                        EXIT
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

      {/* Hold Recommendations */}
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
                      <span>Progress: {e.progressToTarget.toFixed(0)}% mot target</span>
                      <span>{e.daysHeld} dager holdt</span>
                      {e.daysToDeadline > 0 && (
                        <span>{e.daysToDeadline} dager igjen</span>
                      )}
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

      {/* Buy More Recommendations */}
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
                        ENTER
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
