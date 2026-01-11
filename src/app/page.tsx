'use client';

import { useState, useMemo } from 'react';
import StockCard from '@/components/StockCard';
import StockCardOriginal from '@/components/StockCardOriginal';
import FilterBar, { MarketFilter, StrategyFilter } from '@/components/FilterBar';
import MarketStatus from '@/components/MarketStatus';
import { mockStocks } from '@/lib/mock-data';
import { TrendingUp, Palette, AlertCircle, ChevronRight } from 'lucide-react';

export default function Home() {
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALLE');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('ALLE');
  const [useOriginalDesign, setUseOriginalDesign] = useState(false);

  const filteredStocks = useMemo(() => {
    let filtered = [...mockStocks];

    // Filter by market
    if (marketFilter !== 'ALLE') {
      filtered = filtered.filter(stock => stock.market === marketFilter);
    }

    // Filter by strategy
    if (strategyFilter !== 'ALLE') {
      filtered = filtered.filter(stock => 
        stock.strategies.includes(strategyFilter as 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID')
      );
    }

    // Sort by K-Score (highest first)
    return filtered.sort((a, b) => b.kScore - a.kScore);
  }, [marketFilter, strategyFilter]);

  const buySignals = mockStocks.filter(s => s.signal === 'BUY').length;
  const holdSignals = mockStocks.filter(s => s.signal === 'HOLD').length;
  const sellSignals = mockStocks.filter(s => s.signal === 'SELL').length;
  
  // Watchlist - aksjer som ikke har kjøpssignal
  const watchlistStocks = useMemo(() => {
    return mockStocks
      .filter(stock => stock.signal !== 'BUY')
      .sort((a, b) => b.kScore - a.kScore);
  }, []);

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-extrabold text-brand-slate tracking-tight">
            Dashboard
          </h1>
          <MarketStatus />
        </div>
        <p className="text-gray-600">
          Beste investeringsmuligheter basert på K-Score analyse
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold opacity-90">Kjøpssignaler</span>
            <TrendingUp className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="text-5xl font-extrabold mb-1">{buySignals}</div>
          <div className="text-sm opacity-75">Sterke muligheter</div>
        </div>

        <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold opacity-90">Hold</span>
            <div className="w-5 h-5 rounded-full border-2 border-white"></div>
          </div>
          <div className="text-5xl font-extrabold mb-1">{holdSignals}</div>
          <div className="text-sm opacity-75">Avventer signal</div>
        </div>

        <div className="bg-gradient-to-br from-brand-rose to-rose-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold opacity-90">Salgssignaler</span>
            <div className="w-5 h-5 flex items-center justify-center">
              <span className="text-2xl leading-none">⚠</span>
            </div>
          </div>
          <div className="text-5xl font-extrabold mb-1">{sellSignals}</div>
          <div className="text-sm opacity-75">Bør vurderes</div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-brand-slate mb-4">
          Beste Muligheter Nå
        </h2>
        
        <div className="flex items-center justify-between gap-6">
          <FilterBar 
            onMarketChange={setMarketFilter}
            onStrategyChange={setStrategyFilter}
          />
          
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

      {/* Stock Grid */}
      {filteredStocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStocks.map((stock) => (
            useOriginalDesign ? (
              <StockCardOriginal key={stock.ticker} stock={stock} />
            ) : (
              <StockCard key={stock.ticker} stock={stock} />
            )
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-2">Ingen aksjer matcher filtrene</div>
          <p className="text-gray-500 text-sm">Prøv å justere filtreringsalternativene</p>
        </div>
      )}

      {/* Watchlist - Overvåkes */}
      {watchlistStocks.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-400">Overvåkes</h2>
          </div>

          <div className="bg-surface rounded-3xl border border-surface-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr,1.5fr,1fr,1.5fr,0.5fr] gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">TICKER</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">STATUS</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">RSI</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">K-SCORE</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">AKSJON</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {watchlistStocks.map((stock) => {
                const tickerShort = stock.ticker.replace('.OL', '');
                const statusConfig = {
                  HOLD: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'WATCH' },
                  SELL: { bg: 'bg-red-50', text: 'text-red-600', label: 'SELL' },
                };
                const config = statusConfig[stock.signal as 'HOLD' | 'SELL'];
                const kScoreColor = stock.kScore >= 75 ? 'bg-[#10B981]' : stock.kScore >= 60 ? 'bg-yellow-400' : 'bg-gray-300';

                return (
                  <Link
                    key={stock.ticker}
                    href={`/analyse/${stock.ticker}`}
                    className="grid grid-cols-[2fr,1.5fr,1fr,1.5fr,0.5fr] gap-4 px-6 py-5 hover:bg-gray-50 transition-colors group"
                  >
                    {/* Ticker */}
                    <div>
                      <div className="text-lg font-bold text-[#1E293B] group-hover:text-brand-emerald transition-colors">
                        {tickerShort}
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">{stock.name}</div>
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
                        {(Math.random() * 30 + 50).toFixed(1)}
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
