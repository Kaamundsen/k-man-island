'use client';

import { useMemo } from 'react';
import { Stock } from '@/lib/types';
import { clsx } from 'clsx';
import Link from 'next/link';

interface SectorHeatmapProps {
  stocks: Stock[];
}

interface SectorData {
  name: string;
  avgChange: number;
  stockCount: number;
  stocks: Stock[];
  totalMarketCap: number;
}

const SECTOR_COLORS: Record<string, string> = {
  'Energy': 'from-orange-500 to-red-500',
  'Materials': 'from-amber-500 to-orange-500',
  'Industrials': 'from-blue-500 to-indigo-500',
  'Consumer Cyclical': 'from-pink-500 to-rose-500',
  'Consumer Defensive': 'from-green-500 to-emerald-500',
  'Healthcare': 'from-cyan-500 to-blue-500',
  'Financial Services': 'from-purple-500 to-violet-500',
  'Technology': 'from-indigo-500 to-purple-500',
  'Communication Services': 'from-sky-500 to-cyan-500',
  'Utilities': 'from-teal-500 to-green-500',
  'Real Estate': 'from-slate-500 to-gray-500',
  'Basic Materials': 'from-yellow-500 to-amber-500',
  'Unknown': 'from-gray-400 to-gray-500',
};

const SECTOR_EMOJIS: Record<string, string> = {
  'Energy': '⚡',
  'Materials': '🏗️',
  'Industrials': '🏭',
  'Consumer Cyclical': '🛍️',
  'Consumer Defensive': '🛒',
  'Healthcare': '🏥',
  'Financial Services': '🏦',
  'Technology': '💻',
  'Communication Services': '📡',
  'Utilities': '💡',
  'Real Estate': '🏠',
  'Basic Materials': '⛏️',
  'Unknown': '❓',
};

export default function SectorHeatmap({ stocks }: SectorHeatmapProps) {
  const sectorData = useMemo(() => {
    const sectors: Record<string, SectorData> = {};
    
    stocks.forEach(stock => {
      const sector = (stock as any).sector || stock.market || 'Unknown';
      
      if (!sectors[sector]) {
        sectors[sector] = {
          name: sector,
          avgChange: 0,
          stockCount: 0,
          stocks: [],
          totalMarketCap: 0,
        };
      }
      
      sectors[sector].stocks.push(stock);
      sectors[sector].stockCount++;
      sectors[sector].totalMarketCap += stock.marketCap || 0;
    });
    
    // Calculate average change per sector
    Object.values(sectors).forEach(sector => {
      sector.avgChange = sector.stocks.reduce((sum, s) => sum + s.changePercent, 0) / sector.stockCount;
    });
    
    // Sort by average change
    return Object.values(sectors).sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  const maxAbsChange = Math.max(...sectorData.map(s => Math.abs(s.avgChange)), 1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-brand-slate dark:text-white flex items-center gap-2">
          📊 Sektor-analyse
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {sectorData.length} sektorer
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectorData.map(sector => {
          const intensity = Math.abs(sector.avgChange) / maxAbsChange;
          const isPositive = sector.avgChange >= 0;
          
          return (
            <div
              key={sector.name}
              className={clsx(
                'rounded-xl p-4 transition-all hover:scale-105 cursor-pointer',
                isPositive 
                  ? `bg-gradient-to-br from-green-${Math.round(intensity * 400 + 100)} to-emerald-${Math.round(intensity * 400 + 100)}`
                  : `bg-gradient-to-br from-red-${Math.round(intensity * 400 + 100)} to-rose-${Math.round(intensity * 400 + 100)}`,
                intensity > 0.5 ? 'text-white' : 'text-gray-800 dark:text-gray-100'
              )}
              style={{
                backgroundColor: isPositive 
                  ? `rgba(16, 185, 129, ${0.1 + intensity * 0.5})`
                  : `rgba(239, 68, 68, ${0.1 + intensity * 0.5})`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{SECTOR_EMOJIS[sector.name] || '📈'}</span>
                <span className="font-semibold text-sm truncate">{sector.name}</span>
              </div>
              
              <div className={clsx(
                'text-2xl font-bold',
                isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              )}>
                {isPositive ? '+' : ''}{sector.avgChange.toFixed(2)}%
              </div>
              
              <div className="text-xs mt-2 opacity-70">
                {sector.stockCount} aksjer
              </div>
            </div>
          );
        })}
      </div>

      {/* Sector Details */}
      <div className="mt-6 space-y-3">
        <h4 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
          Topp aksjer per sektor
        </h4>
        
        {sectorData.slice(0, 4).map(sector => (
          <div key={sector.name} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-1">
                {SECTOR_EMOJIS[sector.name]} {sector.name}
              </span>
              <span className={clsx(
                'text-sm font-bold',
                sector.avgChange >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {sector.avgChange >= 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {sector.stocks
                .sort((a, b) => b.changePercent - a.changePercent)
                .slice(0, 3)
                .map(stock => (
                  <Link
                    key={stock.ticker}
                    href={`/analyse/${stock.ticker}`}
                    className="text-xs px-2 py-1 bg-white dark:bg-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {stock.ticker.replace('.OL', '')}
                    </span>
                    <span className={clsx(
                      'ml-1',
                      stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
