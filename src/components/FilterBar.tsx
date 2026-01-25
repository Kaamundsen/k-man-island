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
}

export default function FilterBar({ onMarketChange, onStrategyChange, mineCount = 0 }: FilterBarProps) {
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

  // Pill-style button class (matching portfolio page style)
  const pillClass = (isActive: boolean, color?: string) => clsx(
    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
    isActive
      ? color ? `${color} text-white shadow-sm` : 'bg-brand-slate text-white shadow-sm'
      : 'bg-muted text-muted-foreground hover:bg-muted/80'
  );

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Market filters */}
      <div className="flex gap-1.5 items-center bg-muted/50 rounded-full p-1">
        <button
          onClick={() => handleMarketClick('ALLE')}
          className={pillClass(selectedMarket === 'ALLE', 'bg-brand-emerald')}
        >
          Alle
        </button>
        <button
          onClick={() => handleMarketClick('OSLO')}
          className={pillClass(selectedMarket === 'OSLO', 'bg-brand-emerald')}
        >
          Oslo
        </button>
        <button
          onClick={() => handleMarketClick('USA')}
          className={pillClass(selectedMarket === 'USA', 'bg-brand-emerald')}
        >
          USA
        </button>
      </div>

      <div className="h-6 w-px bg-border"></div>

      {/* Strategy filters */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          onClick={() => handleStrategyClick('ALLE')}
          className={pillClass(selectedStrategy === 'ALLE')}
        >
          Alle
        </button>
        <button
          onClick={() => handleStrategyClick('MINE')}
          className={pillClass(selectedStrategy === 'MINE', 'bg-amber-500')}
        >
          <Star className="w-3.5 h-3.5" strokeWidth={2.5} />
          Mine {mineCount > 0 && <span className="ml-0.5 text-xs opacity-80">{mineCount}</span>}
        </button>
        <button
          onClick={() => handleStrategyClick('MOMENTUM')}
          className={pillClass(selectedStrategy === 'MOMENTUM')}
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          Momentum
        </button>
        <button
          onClick={() => handleStrategyClick('BUFFETT')}
          className={pillClass(selectedStrategy === 'BUFFETT')}
        >
          <Shield className="w-3.5 h-3.5" strokeWidth={2.5} />
          Buffett
        </button>
        <button
          onClick={() => handleStrategyClick('TVEITEREID')}
          className={pillClass(selectedStrategy === 'TVEITEREID')}
        >
          <TrendingUp className="w-3.5 h-3.5" strokeWidth={2.5} />
          Tveitereid
        </button>
        <button
          onClick={() => handleStrategyClick('REBOUND')}
          className={pillClass(selectedStrategy === 'REBOUND')}
        >
          <ArrowUpCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
          Rebound
        </button>
        <button
          onClick={() => handleStrategyClick('INSIDER')}
          className={pillClass(selectedStrategy === 'INSIDER')}
        >
          <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
          Insider
        </button>
        <button
          onClick={() => handleStrategyClick('SWINGTRADE')}
          className={pillClass(selectedStrategy === 'SWINGTRADE')}
        >
          <Repeat className="w-3.5 h-3.5" strokeWidth={2.5} />
          Swing
        </button>
        <button
          onClick={() => handleStrategyClick('DAYTRADE')}
          className={pillClass(selectedStrategy === 'DAYTRADE')}
        >
          <Activity className="w-3.5 h-3.5" strokeWidth={2.5} />
          Day
        </button>
        <button
          onClick={() => handleStrategyClick('UTBYTTE')}
          className={pillClass(selectedStrategy === 'UTBYTTE')}
        >
          <DollarSign className="w-3.5 h-3.5" strokeWidth={2.5} />
          Utbytte
        </button>
        <button
          onClick={() => handleStrategyClick('SB_SCAN')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
            selectedStrategy === 'SB_SCAN'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
          )}
        >
          <Layers className="w-3.5 h-3.5" strokeWidth={2.5} />
          SB-Scan
        </button>
      </div>
    </div>
  );
}
