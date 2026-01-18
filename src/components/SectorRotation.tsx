'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, ArrowRight, AlertTriangle } from 'lucide-react';
import type { Stock } from '@/lib/types';
import { getSectorName, SECTORS, type SectorId } from '@/lib/data/sectors';

interface SectorRotationProps {
  stocks: Stock[];
}

type Momentum = 'strong_up' | 'up' | 'neutral' | 'down' | 'strong_down';
type Signal = 'rotating_in' | 'rotating_out' | 'stable';

interface SectorData {
  id: SectorId | 'UNKNOWN';
  name: string;
  icon: string;
  color: string;
  avgChange: number;
  stockCount: number;
  topStock: Stock | null;
  momentum: Momentum;
  signal: Signal;
}

function getMomentum(avgChange: number): Momentum {
  if (avgChange >= 3) return 'strong_up';
  if (avgChange >= 1) return 'up';
  if (avgChange <= -3) return 'strong_down';
  if (avgChange <= -1) return 'down';
  return 'neutral';
}

function getSignal(momentum: Momentum): Signal {
  if (momentum === 'strong_up' || momentum === 'up') return 'rotating_in';
  if (momentum === 'strong_down' || momentum === 'down') return 'rotating_out';
  return 'stable';
}

function fmtPct(x: number) {
  const v = Number.isFinite(x) ? x : 0;
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

export default function SectorRotation({ stocks }: SectorRotationProps) {
  const sectors = useMemo((): SectorData[] => {
    const sectorMap = new Map<string, Stock[]>();

    // Group stocks by sector name (ticker mapping)
    for (let i = 0; i < stocks.length; i++) {
      const stock = stocks[i];
      const sectorName = getSectorName(stock.ticker);
      const arr = sectorMap.get(sectorName) ?? [];
      arr.push(stock);
      sectorMap.set(sectorName, arr);
    }

    const out: SectorData[] = [];

    // IMPORTANT: don't iterate Map with for..of (ts target)
    sectorMap.forEach((sectorStocks, name) => {
      if (!sectorStocks || sectorStocks.length === 0) return;

      const avgChange =
        sectorStocks.reduce((sum, s) => sum + (s.changePercent ?? 0), 0) / sectorStocks.length;

      const topStock = sectorStocks.reduce((best, current) => {
        const bestVal = best?.changePercent ?? -Infinity;
        const curVal = current.changePercent ?? -Infinity;
        return curVal > bestVal ? current : best;
      }, null as Stock | null);

      const momentum = getMomentum(avgChange);
      const signal = getSignal(momentum);

      const sectorDef = Object.values(SECTORS).find((s) => s.name === name);
      out.push({
        id: (sectorDef?.id ?? 'UNKNOWN') as SectorId | 'UNKNOWN',
        name,
        icon: sectorDef?.icon ?? '📊',
        color: sectorDef?.color ?? 'bg-gray-500',
        avgChange,
        stockCount: sectorStocks.length,
        topStock,
        momentum,
        signal,
      });
    });

    // sort: strongest in first, then stable, then out
    const prio = (s: Signal) => (s === 'rotating_in' ? 0 : s === 'stable' ? 1 : 2);
    out.sort((a, b) => prio(a.signal) - prio(b.signal) || b.avgChange - a.avgChange);

    return out;
  }, [stocks]);

  if (!stocks || stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 text-gray-700">
          <AlertTriangle className="h-5 w-5" />
          <span>Ingen aksjeå analysere.</span>
        </div>
      </div>
    );
  }

  const iconFor = (m: Momentum) => {
    if (m === 'strong_up' || m === 'up') return <TrendingUp className="h-4 w-4" />;
    if (m === 'strong_down' || m === 'down') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const badgeFor = (signal: Signal) => {
    const base = 'text-xs font-semibold px-2 py-1 rounded-full';
    if (signal === 'rotating_in') return <span className={clsx(base, 'bg-green-100 text-green-700')}>Inn</span>;
    if (signal === 'rotating_out') return <span className={clsx(base, 'bg-red-100 text-red-700')}>Ut</span>;
    return <span className={clsx(base, 'bg-gray-100 text-gray-700')}>Stabil</span>;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Sektor-rotasjon</h2>
        <span className="text-sm text-gray-500">{sectors.length} sektorer</span>
      </div>

      <div className="space-y-3">
        {sectors.map((s) => (
          <div
            key={`${s.name}-${s.id}`}
            className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:bg-gray-50 transition"
          >
            <div className="flex items-center gap-3">
              <div className={clsx('h-10 w-10 rounded-xl flex items-center justify-center text-white', s.color)}>
                <span className="text-lg">{s.icon}</span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900">{s.name}</div>
                  {badgeFor(s.signal)}
                </div>
                <div className="text-sm text-gray-500">
                  {s.stockCount} aksjer{s.topStock ? ` • Topp: ${s.topStock.ticker}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className={clsx('flex items-center gap-2', s.avgChange >= 0 ? 'text-green-700' : 'text-red-700')}>
                {iconFor(s.momentum)}
                <span className="font-semibold">{fmtPct(s.avgChange)}</span>
              </div>

              {s.topStock?.ticker ? (
                <Link
                  href={`/analyse/${encodeURIComponent(s.topStock.ticker.replace('.OL', ''))}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
                >
                  Se <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

