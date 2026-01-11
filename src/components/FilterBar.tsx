'use client';

import { useState } from 'react';
import { Zap, Shield, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

export type MarketFilter = 'ALLE' | 'OSLO' | 'USA';
export type StrategyFilter = 'ALLE' | 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID';

interface FilterBarProps {
  onMarketChange: (market: MarketFilter) => void;
  onStrategyChange: (strategy: StrategyFilter) => void;
}

export default function FilterBar({ onMarketChange, onStrategyChange }: FilterBarProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketFilter>('ALLE');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyFilter>('ALLE');

  const handleMarketClick = (market: MarketFilter) => {
    setSelectedMarket(market);
    onMarketChange(market);
  };

  const handleStrategyClick = (strategy: StrategyFilter) => {
    setSelectedStrategy(strategy);
    onStrategyChange(strategy);
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Market filters */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => handleMarketClick('ALLE')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
            selectedMarket === 'ALLE'
              ? 'bg-brand-emerald text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          ALL
        </button>
        <button
          onClick={() => handleMarketClick('OSLO')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
            selectedMarket === 'OSLO'
              ? 'bg-brand-emerald text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          OSLO
        </button>
        <button
          onClick={() => handleMarketClick('USA')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
            selectedMarket === 'USA'
              ? 'bg-brand-emerald text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          USA
        </button>
      </div>

      <div className="h-8 w-px bg-gray-200"></div>

      {/* Strategy filters */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => handleStrategyClick('ALLE')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'ALLE'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          ALLE
        </button>
        <button
          onClick={() => handleStrategyClick('MOMENTUM')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'MOMENTUM'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <Zap className="w-4 h-4" strokeWidth={2.5} />
          MOMENTUM
        </button>
        <button
          onClick={() => handleStrategyClick('BUFFETT')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'BUFFETT'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <Shield className="w-4 h-4" strokeWidth={2.5} />
          BUFFETT
        </button>
        <button
          onClick={() => handleStrategyClick('TVEITEREID')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'TVEITEREID'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-surface text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
          TVEITEREID
        </button>
      </div>
    </div>
  );
}
