'use client';

import { useState } from 'react';
import { Zap, Shield, TrendingUp, ArrowUpCircle, Users } from 'lucide-react';
import { clsx } from 'clsx';

export type MarketFilter = 'ALLE' | 'OSLO' | 'USA';
export type StrategyFilter = 'ALLE' | 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND' | 'INSIDER';

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
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
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
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
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
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          )}
        >
          USA
        </button>
      </div>

      <div className="h-8 w-px bg-border"></div>

      {/* Strategy filters */}
      <div className="flex gap-2 items-center">
        <button
          onClick={() => handleStrategyClick('ALLE')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'ALLE'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
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
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
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
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
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
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          )}
        >
          <TrendingUp className="w-4 h-4" strokeWidth={2.5} />
          TVEITEREID
        </button>
        <button
          onClick={() => handleStrategyClick('REBOUND')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'REBOUND'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          )}
        >
          <ArrowUpCircle className="w-4 h-4" strokeWidth={2.5} />
          REBOUND
        </button>
        <button
          onClick={() => handleStrategyClick('INSIDER')}
          className={clsx(
            'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
            selectedStrategy === 'INSIDER'
              ? 'bg-brand-slate text-white shadow-md'
              : 'bg-card text-muted-foreground border border-border hover:bg-muted'
          )}
        >
          <Users className="w-4 h-4" strokeWidth={2.5} />
          INSIDER
        </button>
      </div>
    </div>
  );
}
