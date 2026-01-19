'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import StockCard from '@/components/StockCard';
import StockCardOriginal from '@/components/StockCardOriginal';
import FilterBar, { MarketFilter, StrategyFilter } from '@/components/FilterBar';
import MarketStatus from '@/components/MarketStatus';
import { Stock } from '@/lib/types';
import { TrendingUp, TrendingDown, Palette, AlertCircle, ChevronRight, LayoutGrid, List, Layers, Minus, RefreshCcw, Loader2 } from 'lucide-react';

interface DashboardContentProps {
  initialStocks: Stock[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

// Beregn en sammensatt score for å rangere aksjer
const calculateCompositeScore = (stock: Stock, prioritizeInsider: boolean = false): number => {
  let score = 0;
  
  if (prioritizeInsider && stock.insiderScore !== undefined) {
    // Ved INSIDER-filter: Insider score får høyere vekt
    score += stock.insiderScore * 0.4; // 40%
    score += stock.kScore * 0.3; // 30%
    
    // RSI bonus (15%)
    const rsiOptimal = 50;
    const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
    const rsiScore = Math.max(0, 100 - (rsiDistance * 3));
    score += rsiScore * 0.15;
    
    // Risk/Reward Ratio (15%)
    const riskRewardRatio = stock.gainPercent / stock.riskPercent;
    const rrScore = Math.min(100, riskRewardRatio * 20);
    score += rrScore * 0.15;
  } else {
    // Standard scoring
    // K-Score (vekt: 50%)
    score += stock.kScore * 0.5;
    
    // RSI bonus (vekt: 20%) - mellom 40-60 er best
    const rsiOptimal = 50;
    const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
    const rsiScore = Math.max(0, 100 - (rsiDistance * 3));
    score += rsiScore * 0.2;
    
    // Risk/Reward Ratio (vekt: 30%)
    const riskRewardRatio = stock.gainPercent / stock.riskPercent;
    const rrScore = Math.min(100, riskRewardRatio * 20); // Cap ved 100
    score += rrScore * 0.3;
  }
  
  return score;
};

type ViewMode = 'cards-and-list' | 'list-only' | 'cards-only';

export default function DashboardContent({ initialStocks, onRefresh, isRefreshing, lastUpdated }: DashboardContentProps) {
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALLE');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('ALLE');
  const [useOriginalDesign, setUseOriginalDesign] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards-and-list');

  const filteredStocks = useMemo(() => {
    let filtered = [...initialStocks];

    // Filter by market
    if (marketFilter !== 'ALLE') {
      filtered = filtered.filter(stock => stock.market === marketFilter);
    }

    // Filter by strategy
    if (strategyFilter !== 'ALLE') {
      filtered = filtered.filter(stock => 
        stock.strategies.includes(strategyFilter as 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND' | 'INSIDER')
      );
    }

    // Filter only BUY signals
    const buyStocks = filtered.filter(stock => stock.signal === 'BUY');
    
    // Avansert sortering: Kombiner K-Score, RSI og Risk/Reward
    const prioritizeInsider = strategyFilter === 'INSIDER';
    buyStocks.sort((a, b) => {
      // Beregn composite score
      const scoreA = calculateCompositeScore(a, prioritizeInsider);
      const scoreB = calculateCompositeScore(b, prioritizeInsider);
      return scoreB - scoreA;
    });
    
    // Return based on view mode
    if (viewMode === 'cards-and-list') {
      return buyStocks.slice(0, 3); // Top 3 only
    } else if (viewMode === 'cards-only') {
      return buyStocks; // Show all as cards
    } else {
      return []; // list-only shows no cards
    }
  }, [initialStocks, marketFilter, strategyFilter, viewMode]);

  const buySignals = initialStocks.filter(s => s.signal === 'BUY').length;
  const holdSignals = initialStocks.filter(s => s.signal === 'HOLD').length;
  const sellSignals = initialStocks.filter(s => s.signal === 'SELL').length;
  
  // Watchlist - alle aksjer unntatt topp 3 BUY (eller alle hvis list-only)
  const watchlistStocks = useMemo(() => {
    const prioritizeInsider = strategyFilter === 'INSIDER';
    
    // Start med samme filtrering som kort
    let filtered = [...initialStocks];
    
    // Filter by market
    if (marketFilter !== 'ALLE') {
      filtered = filtered.filter(stock => stock.market === marketFilter);
    }
    
    // Filter by strategy
    if (strategyFilter !== 'ALLE') {
      filtered = filtered.filter(stock => 
        stock.strategies.includes(strategyFilter as 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND' | 'INSIDER')
      );
    }
    
    // Hent alle BUY-aksjer fra filtrert liste og sorter de på samme måte
    const allBuyStocks = filtered
      .filter(stock => stock.signal === 'BUY')
      .sort((a, b) => {
        const scoreA = calculateCompositeScore(a, prioritizeInsider);
        const scoreB = calculateCompositeScore(b, prioritizeInsider);
        return scoreB - scoreA;
      });
    
    if (viewMode === 'list-only') {
      // Show all filtered stocks in list
      return filtered.sort((a, b) => {
        const signalOrder = { BUY: 0, HOLD: 1, SELL: 2 };
        if (signalOrder[a.signal] !== signalOrder[b.signal]) {
          return signalOrder[a.signal] - signalOrder[b.signal];
        }
        const scoreA = calculateCompositeScore(a, prioritizeInsider);
        const scoreB = calculateCompositeScore(b, prioritizeInsider);
        return scoreB - scoreA;
      });
    }
    
    if (viewMode === 'cards-only') {
      // Show no list (all are cards)
      return [];
    }
    
    // cards-and-list mode: Ekskluder topp 3 fra filtrert liste
    const top3BuyTickers = allBuyStocks.slice(0, 3).map(s => s.ticker);
    
    return filtered
      .filter(stock => !top3BuyTickers.includes(stock.ticker))
      .sort((a, b) => {
        // Sort: BUY først, deretter HOLD, deretter SELL
        // Innenfor hver gruppe: composite score
        const signalOrder = { BUY: 0, HOLD: 1, SELL: 2 };
        if (signalOrder[a.signal] !== signalOrder[b.signal]) {
          return signalOrder[a.signal] - signalOrder[b.signal];
        }
        const scoreA = calculateCompositeScore(a, prioritizeInsider);
        const scoreB = calculateCompositeScore(b, prioritizeInsider);
        return scoreB - scoreA;
      });
  }, [initialStocks, viewMode, strategyFilter, marketFilter]);

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        {/* Top row: Dashboard + Market Status */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-4xl font-extrabold text-brand-slate tracking-tight">
            Dashboard
          </h1>
          <MarketStatus />
        </div>
        
        {/* Bottom row: Last updated + Refresh + Signals */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-500 text-sm">
              Sist oppdatert: {lastUpdated 
                ? new Date(lastUpdated).toLocaleDateString('nb-NO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : new Date().toLocaleDateString('nb-NO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
              }
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand-slate bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
                {isRefreshing ? 'Oppdaterer...' : 'Oppdater nå'}
              </button>
            )}
          </div>
          
          {/* Kompakte signaler */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-emerald" strokeWidth={2.5} />
              <span className="text-base font-bold text-brand-emerald">{buySignals}</span>
              <span className="text-sm font-medium text-gray-600 uppercase">Kjøp</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Minus className="w-4 h-4 text-gray-500" strokeWidth={2.5} />
              <span className="text-base font-bold text-gray-600">{holdSignals}</span>
              <span className="text-sm font-medium text-gray-600 uppercase">Hold</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-brand-rose" strokeWidth={2.5} />
              <span className="text-base font-bold text-brand-rose">{sellSignals}</span>
              <span className="text-sm font-medium text-gray-600 uppercase">Selg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="text-2xl font-bold text-brand-slate">
            {viewMode === 'cards-only' ? 'Alle Kjøpsanbefalinger' : 
             viewMode === 'list-only' ? '' : 
             'Topp 3 Kjøpsanbefalinger'}
          </h2>
          {viewMode !== 'list-only' && (
            <span className="text-sm text-gray-500">
              Rangert etter K-Score, RSI og Risk/Reward
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-6">
          <FilterBar 
            onMarketChange={setMarketFilter}
            onStrategyChange={setStrategyFilter}
          />
          
          <div className="flex items-center gap-3">
            {/* View Mode Filter */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('cards-and-list')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'cards-and-list' 
                    ? 'bg-white shadow-sm text-brand-emerald' 
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Kort + Liste"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list-only')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'list-only' 
                    ? 'bg-white shadow-sm text-brand-emerald' 
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Kun Liste"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cards-only')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'cards-only' 
                    ? 'bg-white shadow-sm text-brand-emerald' 
                    : 'text-gray-400 hover:text-gray-600'
                )}
                title="Kun Kort"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            
            {/* Design Toggle */}
            <button
              onClick={() => setUseOriginalDesign(!useOriginalDesign)}
              className="flex-shrink-0"
              title={useOriginalDesign ? 'Bytt til Moderne Design (farget topp)' : 'Bytt til Original Design (hvit)'}
            >
              <div className={`relative w-12 h-6 rounded-full transition-colors ${!useOriginalDesign ? 'bg-brand-emerald' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${!useOriginalDesign ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Stock Grid */}
      {filteredStocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStocks.map((stock, index) => {
            // ALLTID bruk lokal rank (posisjon i filtrert liste)
            const rank = index + 1;
            
            return useOriginalDesign ? (
              <StockCardOriginal key={stock.ticker} stock={stock} rank={rank} />
            ) : (
              <StockCard key={stock.ticker} stock={stock} rank={rank} />
            );
          })}
        </div>
      )}
      
      {filteredStocks.length === 0 && viewMode !== 'list-only' && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-2">Ingen aksjer matcher filtrene</div>
          <p className="text-gray-500 text-sm">Prøv å justere filtreringsalternativene</p>
        </div>
      )}

      {/* Watchlist - Overvåkes */}
      {watchlistStocks.length > 0 && (
        <div className={clsx(viewMode === 'list-only' ? 'mt-0' : 'mt-16')}>
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-400">
              {viewMode === 'list-only' ? 'Alle Aksjer' : 'Overvåkes'}
            </h2>
            <span className="text-sm text-gray-500">
              {viewMode === 'list-only' 
                ? `${watchlistStocks.length} aksjer totalt` 
                : `${watchlistStocks.filter(s => s.signal === 'BUY').length} flere kjøpsmuligheter`
              }
            </span>
          </div>

          <div className="bg-surface rounded-3xl border border-surface-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[0.5fr,2fr,1fr,1.5fr,1fr,1.5fr,0.5fr] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">#</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">TICKER</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">PRIS</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">STATUS</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">RSI</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">K-SCORE</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">AKSJON</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {watchlistStocks.map((stock, index) => {
                // Beregn rank basert på view mode og index
                let rank;
                if (viewMode === 'list-only') {
                  // I list-only, rank starter fra 1
                  rank = stock.signal === 'BUY' ? index + 1 : null;
                } else {
                  // I cards-and-list, rank starter fra 4 (etter topp 3 kort)
                  // Men kun for BUY-aksjer
                  if (stock.signal === 'BUY') {
                    // Finn posisjonen i den filtrerte BUY-listen
                    const buyStocksBeforeThis = watchlistStocks
                      .slice(0, index)
                      .filter(s => s.signal === 'BUY').length;
                    rank = buyStocksBeforeThis + 4; // +4 fordi topp 3 er i kort
                  } else {
                    rank = null;
                  }
                }
                const tickerShort = stock.ticker.replace('.OL', '');
                const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                  BUY: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'BUY' },
                  HOLD: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'WATCH' },
                  SELL: { bg: 'bg-red-50', text: 'text-red-600', label: 'SELL' },
                };
                const config = statusConfig[stock.signal] || statusConfig.HOLD;
                const kScoreColor = stock.kScore >= 75 ? 'bg-[#10B981]' : stock.kScore >= 60 ? 'bg-yellow-400' : 'bg-gray-300';
                const priceChangeColor = stock.changePercent > 0 ? 'text-brand-emerald' : 'text-brand-rose';

                return (
                  <Link
                    key={stock.ticker}
                    href={`/analyse/${stock.ticker}`}
                    className="grid grid-cols-[0.5fr,2fr,1fr,1.5fr,1fr,1.5fr,0.5fr] gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Ranking */}
                    <div className="flex items-center">
                      {rank ? (
                        <span className="text-lg font-extrabold text-gray-400 group-hover:text-brand-emerald transition-colors">
                          {rank}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </div>

                    {/* Ticker */}
                    <div>
                      <div className="text-lg font-bold text-[#1E293B] group-hover:text-brand-emerald transition-colors">
                        {tickerShort}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{stock.name}</div>
                    </div>

                    {/* Price */}
                    <div>
                      <div className="text-lg font-bold text-[#1E293B]">
                        {stock.price.toFixed(2)} kr
                      </div>
                      <div className={clsx('text-sm font-semibold mt-0.5', priceChangeColor)}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span className={clsx(
                        'inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold',
                        config.bg,
                        config.text
                      )}>
                        {config.label}
                      </span>
                    </div>

                    {/* RSI */}
                    <div className="flex items-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {stock.rsi.toFixed(1)}
                      </span>
                    </div>

                    {/* K-Score */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-extrabold text-[#10B981]">
                        {stock.kScore}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden max-w-[80px]">
                        <div 
                          className={clsx('h-full rounded-full', kScoreColor)}
                          style={{ width: `${stock.kScore}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end">
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand-emerald transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-500">
            Viser {watchlistStocks.length} aksjer som overvåkes
          </div>
        </div>
      )}
    </main>
  );
}
