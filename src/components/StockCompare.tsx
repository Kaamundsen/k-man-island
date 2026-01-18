'use client';

import { useState } from 'react';
import { 
  GitCompare, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { Stock } from '@/lib/types';
import { calculateMasterScore } from '@/lib/analysis/master-score';

interface StockCompareProps {
  stocks: Stock[];
}

export default function StockCompare({ stocks }: StockCompareProps) {
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addStock = (ticker: string) => {
    if (selectedTickers.length < 4 && !selectedTickers.includes(ticker)) {
      setSelectedTickers([...selectedTickers, ticker]);
      setSearchQuery('');
    }
  };

  const removeStock = (ticker: string) => {
    setSelectedTickers(selectedTickers.filter(t => t !== ticker));
  };

  const filteredStocks = stocks.filter(s => 
    !selectedTickers.includes(s.ticker) &&
    (s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
     s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 8);

  const selectedStocks = selectedTickers
    .map(ticker => stocks.find(s => s.ticker === ticker))
    .filter((s): s is Stock => s !== undefined)
    .map(s => ({
      ...s,
      masterScore: calculateMasterScore(s),
    }));

  const getComparisonColor = (value: number, values: number[], higherIsBetter: boolean = true) => {
    if (values.length < 2) return 'text-brand-slate dark:text-white';
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    const worst = higherIsBetter ? Math.min(...values) : Math.max(...values);
    
    if (value === best) return 'text-green-600 font-bold';
    if (value === worst && values.length > 2) return 'text-red-500';
    return 'text-brand-slate dark:text-white';
  };

  const metrics = [
    { key: 'price', label: 'Pris', format: (v: number) => `${v.toFixed(2)} kr`, icon: DollarSign },
    { key: 'changePercent', label: 'Dag %', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, icon: Activity },
    { key: 'kScore', label: 'K-Score', format: (v: number) => v.toString(), icon: Target, higherBetter: true },
    { key: 'masterScore.masterScore', label: 'Master Score', format: (v: number) => v.toString(), icon: BarChart3, higherBetter: true },
    { key: 'rsi', label: 'RSI', format: (v: number) => v.toFixed(1), icon: Activity },
    { key: 'gainPercent', label: 'Gevinst %', format: (v: number) => `+${v.toFixed(1)}%`, icon: TrendingUp, higherBetter: true },
    { key: 'riskPercent', label: 'Risiko %', format: (v: number) => `-${v.toFixed(1)}%`, icon: TrendingDown, higherBetter: false },
    { key: 'peRatio', label: 'P/E', format: (v: number | undefined) => v ? v.toFixed(1) : 'N/A', icon: BarChart3, higherBetter: false },
    { key: 'dividendYield', label: 'Utbytte %', format: (v: number | undefined) => v ? `${v.toFixed(2)}%` : 'N/A', icon: DollarSign, higherBetter: true },
    { key: 'marketCap', label: 'Mkt Cap', format: (v: number | undefined) => v ? `${(v / 1e9).toFixed(1)} mrd` : 'N/A', icon: BarChart3, higherBetter: true },
  ];

  const getValue = (stock: any, key: string) => {
    const keys = key.split('.');
    let value = stock;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  };

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-surface-border dark:border-dark-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <GitCompare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-slate dark:text-white">Sammenlign aksjer</h2>
            <p className="text-sm text-gray-500 dark:text-dark-muted">Velg opptil 4 aksjer</p>
          </div>
        </div>
      </div>

      {/* Stock Selector */}
      <div className="p-4 bg-gray-50 dark:bg-dark-bg border-b border-surface-border dark:border-dark-border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Selected Stocks */}
          {selectedTickers.map(ticker => {
            const stock = stocks.find(s => s.ticker === ticker);
            return (
              <div 
                key={ticker}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-dark-surface rounded-lg border border-surface-border dark:border-dark-border"
              >
                <span className="font-semibold text-brand-slate dark:text-white">
                  {ticker.replace('.OL', '')}
                </span>
                <button
                  onClick={() => removeStock(ticker)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Add Stock */}
          {selectedTickers.length < 4 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Legg til aksje..."
                className="w-48 px-3 py-1.5 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-surface text-brand-slate dark:text-white"
              />
              
              {/* Dropdown */}
              {searchQuery && filteredStocks.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-dark-surface border border-surface-border dark:border-dark-border rounded-lg shadow-lg z-10 max-h-64 overflow-auto">
                  {filteredStocks.map(stock => (
                    <button
                      key={stock.ticker}
                      onClick={() => addStock(stock.ticker)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-dark-border flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-brand-slate dark:text-white">
                          {stock.ticker.replace('.OL', '')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-dark-muted truncate">
                          {stock.name}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedStocks.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-dark-bg">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-dark-muted uppercase tracking-wider">
                  Metrikk
                </th>
                {selectedStocks.map(stock => (
                  <th 
                    key={stock.ticker}
                    className="px-4 py-3 text-center text-sm font-bold text-brand-slate dark:text-white"
                  >
                    <Link 
                      href={`/analyse/${stock.ticker}`}
                      className="hover:text-brand-emerald transition-colors"
                    >
                      {stock.ticker.replace('.OL', '')}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {/* Signal Row */}
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">Signal</td>
                {selectedStocks.map(stock => (
                  <td key={stock.ticker} className="px-4 py-3 text-center">
                    <span className={clsx(
                      'px-2 py-1 rounded text-xs font-bold',
                      stock.masterScore.signal === 'STERK_KJØP' ? 'bg-green-100 text-green-700' :
                      stock.masterScore.signal === 'KJØP' ? 'bg-green-50 text-green-600' :
                      stock.masterScore.signal === 'HOLD' ? 'bg-yellow-50 text-yellow-600' :
                      stock.masterScore.signal === 'SELG' ? 'bg-red-50 text-red-600' :
                      'bg-red-100 text-red-700'
                    )}>
                      {stock.masterScore.signal.replace('_', ' ')}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Metric Rows */}
              {metrics.map(metric => {
                const values = selectedStocks.map(s => getValue(s, metric.key)).filter(v => v !== undefined && v !== null);
                const numValues = values.filter(v => typeof v === 'number') as number[];
                
                return (
                  <tr key={metric.key} className="hover:bg-gray-50 dark:hover:bg-dark-border">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted flex items-center gap-2">
                      <metric.icon className="w-4 h-4" />
                      {metric.label}
                    </td>
                    {selectedStocks.map(stock => {
                      const value = getValue(stock, metric.key);
                      return (
                        <td 
                          key={stock.ticker}
                          className={clsx(
                            'px-4 py-3 text-center text-sm',
                            typeof value === 'number' 
                              ? getComparisonColor(value, numValues, metric.higherBetter !== false)
                              : 'text-gray-400'
                          )}
                        >
                          {metric.format(value)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Sector Row */}
              <tr>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-dark-muted">Sektor</td>
                {selectedStocks.map(stock => (
                  <td key={stock.ticker} className="px-4 py-3 text-center text-sm text-brand-slate dark:text-white">
                    {stock.sector || 'Ukjent'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <GitCompare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 dark:text-dark-muted">
            Velg minst 2 aksjer for å sammenligne
          </p>
        </div>
      )}

      {/* Verdict */}
      {selectedStocks.length >= 2 && (
        <div className="p-4 bg-gray-50 dark:bg-dark-bg border-t border-surface-border dark:border-dark-border">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-dark-muted">🏆 Beste valg basert på Master Score:</span>
            <span className="font-bold text-brand-emerald">
              {selectedStocks.reduce((best, s) => 
                s.masterScore.masterScore > best.masterScore.masterScore ? s : best
              ).ticker.replace('.OL', '')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
