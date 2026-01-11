'use client';

import { useState } from 'react';

type MarketFilter = 'ALL' | 'OSLO' | 'USA';
type StrategyFilter = 'ALL' | 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID';

interface FilterBarProps {
  onMarketChange: (market: MarketFilter) => void;
  onStrategyChange: (strategy: StrategyFilter) => void;
}

export default function FilterBar({ onMarketChange, onStrategyChange }: FilterBarProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketFilter>('ALL');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyFilter>('ALL');

  const handleMarketClick = (market: MarketFilter) => {
    setSelectedMarket(market);
    onMarketChange(market);
  };

  const handleStrategyClick = (strategy: StrategyFilter) => {
    setSelectedStrategy(strategy);
    onStrategyChange(strategy);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Market filters */}
      <div className="flex gap-2">
        <button
          onClick={() => handleMarketClick('ALL')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedMarket === 'ALL'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          ALL
        </button>
        <button
          onClick={() => handleMarketClick('OSLO')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedMarket === 'OSLO'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          OSLO
        </button>
        <button
          onClick={() => handleMarketClick('USA')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedMarket === 'USA'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          USA
        </button>
      </div>

      {/* Strategy filters */}
      <div className="flex gap-2">
        <button
          onClick={() => handleStrategyClick('ALL')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedStrategy === 'ALL'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          ALL
        </button>
        <button
          onClick={() => handleStrategyClick('MOMENTUM')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedStrategy === 'MOMENTUM'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          MOMENTUM
        </button>
        <button
          onClick={() => handleStrategyClick('BUFFETT')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedStrategy === 'BUFFETT'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          BUFFETT
        </button>
        <button
          onClick={() => handleStrategyClick('TVEITEREID')}
          className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
            selectedStrategy === 'TVEITEREID'
              ? 'bg-brand-emerald text-white'
              : 'bg-surface text-brand-slate border border-gray-200 hover:bg-gray-50'
          }`}
        >
          TVEITEREID
        </button>
      </div>
    </div>
  );
}
