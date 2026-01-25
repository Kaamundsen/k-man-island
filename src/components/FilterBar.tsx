'use client';

import { useState } from 'react';
import { Zap, Shield, TrendingUp, ArrowUpCircle, Users, Star, Activity, DollarSign, Repeat, Layers } from 'lucide-react';
import { clsx } from 'clsx';

export type MarketFilter = 'ALLE' | 'OSLO' | 'USA';
export type StrategyFilter = 'ALLE' | 'MOMENTUM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND' | 'INSIDER' | 'MINE' | 'SWINGTRADE' | 'DAYTRADE' | 'UTBYTTE' | 'SB_SCAN';

interface FilterBarProps {
  onMarketChange: (market: MarketFilter) => void;
  onStrategyChange: (strategy: StrategyFilter) => void;
  mineCount?: number;
  initialMarket?: MarketFilter;
}

export default function FilterBar({ onMarketChange, onStrategyChange, mineCount = 0, initialMarket = 'OSLO' }: FilterBarProps) {
  const [selectedMarket, setSelectedMarket] = useState<MarketFilter>(initialMarket);
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
    <div className="flex flex-wrap gap-2 items-center">
      {/* Market filters - inline with strategy filters */}
      <button
        onClick={() => handleMarketClick('ALLE')}
        className={clsx(
          'px-5 py-2.5 rounded-xl font-bold text-sm transition-all',
          selectedMarket === 'ALLE'
            ? 'bg-brand-emerald text-white shadow-md'
            : 'bg-card text-muted-foreground border border-border hover:bg-muted'
        )}
      >
        Alle
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

      <div className="h-8 w-px bg-border"></div>

      {/* Strategy filters - ALLE first, then standard strategies, MINE before SB_SCAN */}
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
      <button
        onClick={() => handleStrategyClick('SWINGTRADE')}
        className={clsx(
          'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
          selectedStrategy === 'SWINGTRADE'
            ? 'bg-brand-slate text-white shadow-md'
            : 'bg-card text-muted-foreground border border-border hover:bg-muted'
        )}
      >
        <Repeat className="w-4 h-4" strokeWidth={2.5} />
        SWING
      </button>
      <button
        onClick={() => handleStrategyClick('DAYTRADE')}
        className={clsx(
          'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
          selectedStrategy === 'DAYTRADE'
            ? 'bg-brand-slate text-white shadow-md'
            : 'bg-card text-muted-foreground border border-border hover:bg-muted'
        )}
      >
        <Activity className="w-4 h-4" strokeWidth={2.5} />
        DAY
      </button>
      <button
        onClick={() => handleStrategyClick('UTBYTTE')}
        className={clsx(
          'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
          selectedStrategy === 'UTBYTTE'
            ? 'bg-brand-slate text-white shadow-md'
            : 'bg-card text-muted-foreground border border-border hover:bg-muted'
        )}
      >
        <DollarSign className="w-4 h-4" strokeWidth={2.5} />
        UTBYTTE
      </button>
      
      {/* Mine - before SB-Scan */}
      <button
        onClick={() => handleStrategyClick('MINE')}
        className={clsx(
          'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
          selectedStrategy === 'MINE'
            ? 'bg-amber-500 text-white shadow-md'
            : 'bg-card text-muted-foreground border border-border hover:bg-muted'
        )}
      >
        <Star className="w-4 h-4" strokeWidth={2.5} />
        MINE {mineCount > 0 && <span className="text-xs opacity-80">({mineCount})</span>}
      </button>
      
      {/* SB-Scan - last */}
      <button
        onClick={() => handleStrategyClick('SB_SCAN')}
        className={clsx(
          'px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2',
          selectedStrategy === 'SB_SCAN'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
            : 'bg-card text-muted-foreground border border-border hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
        )}
      >
        <Layers className="w-4 h-4" strokeWidth={2.5} />
        SB-SCAN
      </button>
    </div>
  );
}
