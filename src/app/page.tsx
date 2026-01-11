'use client';

import { useState, useMemo } from 'react';
import StockCard from '@/components/StockCard';
import FilterBar, { MarketFilter, StrategyFilter } from '@/components/FilterBar';
import MarketStatus from '@/components/MarketStatus';
import { mockStocks } from '@/lib/mock-data';
import { TrendingUp } from 'lucide-react';

export default function Home() {
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALLE');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('ALLE');

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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-slate mb-4">
          Beste Muligheter Nå
        </h2>
        <FilterBar 
          onMarketChange={setMarketFilter}
          onStrategyChange={setStrategyFilter}
        />
      </div>

      {/* Stock Grid */}
      {filteredStocks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStocks.map((stock) => (
            <StockCard key={stock.ticker} stock={stock} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 text-lg mb-2">Ingen aksjer matcher filtrene</div>
          <p className="text-gray-500 text-sm">Prøv å justere filtreringsalternativene</p>
        </div>
      )}
    </main>
  );
}
