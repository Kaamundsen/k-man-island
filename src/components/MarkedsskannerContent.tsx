'use client';

import { useState, useMemo } from 'react';
import { Stock } from '@/lib/types';
import MarketStatus from '@/components/MarketStatus';
import { TrendingUp, TrendingDown, ArrowUpDown, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

type SortField = 'ticker' | 'kScore' | 'price' | 'changePercent' | 'gainPercent';
type SortOrder = 'asc' | 'desc';

interface MarkedsskannerContentProps {
  stocks: Stock[];
}

export default function MarkedsskannerContent({ stocks }: MarkedsskannerContentProps) {
  const [sortField, setSortField] = useState<SortField>('kScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndSortedStocks = useMemo(() => {
    let filtered = [...stocks];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [stocks, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <TrendingUp className="w-4 h-4 text-brand-emerald" />
    ) : (
      <TrendingDown className="w-4 h-4 text-brand-rose" />
    );
  };

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">
              Markedsskanner
            </h1>
            <p className="text-muted-foreground">
              Komplett oversikt over alle aksjer med sortering og filtrering
            </p>
          </div>
          <MarketStatus />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Søk etter ticker eller navn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-sm text-muted-foreground mb-1">Totalt Aksjer</div>
          <div className="text-3xl font-extrabold text-foreground">{stocks.length}</div>
        </div>
        <div className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-2xl p-4 text-white">
          <div className="text-sm opacity-75 mb-1">Kjøpssignaler</div>
          <div className="text-3xl font-extrabold">{stocks.filter(s => s.signal === 'BUY').length}</div>
        </div>
        <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl p-4 text-white">
          <div className="text-sm opacity-75 mb-1">Hold</div>
          <div className="text-3xl font-extrabold">{stocks.filter(s => s.signal === 'HOLD').length}</div>
        </div>
        <div className="bg-gradient-to-br from-brand-rose to-rose-600 rounded-2xl p-4 text-white">
          <div className="text-sm opacity-75 mb-1">Salgssignaler</div>
          <div className="text-3xl font-extrabold">{stocks.filter(s => s.signal === 'SELL').length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('ticker')}
                    className="flex items-center gap-2 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ticker
                    <SortIcon field="ticker" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="font-bold text-sm text-muted-foreground">Navn</div>
                </th>
                <th className="px-6 py-4 text-left">
                  <button
                    onClick={() => handleSort('kScore')}
                    className="flex items-center gap-2 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    K-Score
                    <SortIcon field="kScore" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="font-bold text-sm text-muted-foreground">Signal</div>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-2 ml-auto font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pris
                    <SortIcon field="price" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('changePercent')}
                    className="flex items-center gap-2 ml-auto font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Endring
                    <SortIcon field="changePercent" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleSort('gainPercent')}
                    className="flex items-center gap-2 ml-auto font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Potensial
                    <SortIcon field="gainPercent" />
                  </button>
                </th>
                <th className="px-6 py-4 text-center">
                  <div className="font-bold text-sm text-muted-foreground">Marked</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAndSortedStocks.map((stock, index) => {
                const isPositive = stock.changePercent >= 0;
                const tickerShort = stock.ticker.replace('.OL', '');
                
                const signalConfig = {
                  BUY: { bg: 'bg-brand-emerald', text: 'KJØP' },
                  SELL: { bg: 'bg-brand-rose', text: 'SELG' },
                  HOLD: { bg: 'bg-gray-500', text: 'HOLD' },
                };
                
                const config = signalConfig[stock.signal];

                return (
                  <tr 
                    key={stock.ticker}
                    className="hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link 
                        href={`/analyse/${stock.ticker}`}
                        className="font-bold text-foreground hover:text-brand-emerald transition-colors"
                      >
                        {tickerShort}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-extrabold text-foreground">
                          {stock.kScore}
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden w-20">
                          <div 
                            className={clsx(
                              'h-full rounded-full',
                              stock.kScore >= 75 ? 'bg-brand-emerald' :
                              stock.kScore >= 60 ? 'bg-yellow-500' :
                              'bg-gray-400'
                            )}
                            style={{ width: `${stock.kScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold text-white',
                        config.bg
                      )}>
                        {config.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-foreground">
                        {stock.price.toFixed(2)} NOK
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={clsx(
                        'font-bold flex items-center justify-end gap-1',
                        isPositive ? 'text-brand-emerald' : 'text-brand-rose'
                      )}>
                        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-brand-emerald">
                        +{stock.gainPercent.toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm">
                        {stock.market === 'OSLO' ? '🇳🇴' : '🇺🇸'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAndSortedStocks.length === 0 && (
          <div className="text-center py-16">
            <div className="text-muted-foreground text-lg mb-2">Ingen aksjer funnet</div>
            <p className="text-muted-foreground/70 text-sm">Prøv et annet søk</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Viser {filteredAndSortedStocks.length} av {stocks.length} aksjer
      </div>
    </main>
  );
}
