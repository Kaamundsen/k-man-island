'use client';

import { Stock } from '@/lib/types';
import { Zap, Shield, TrendingUp as TrendingUpIcon, ArrowUpCircle } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface StockCardOriginalProps {
  stock: Stock;
  rank?: number;
}

export default function StockCardOriginal({ stock, rank }: StockCardOriginalProps) {
  const signalConfig = {
    BUY: { bg: 'bg-[#10B981]', text: 'BUY', textColor: 'text-white' },
    SELL: { bg: 'bg-[#EF4444]', text: 'SELL', textColor: 'text-white' },
    HOLD: { bg: 'bg-gray-400', text: 'HOLD', textColor: 'text-white' },
  };

  const config = signalConfig[stock.signal];
  const kScoreColor = stock.kScore >= 75 ? 'bg-[#10B981]' : stock.kScore >= 60 ? 'bg-yellow-400' : 'bg-gray-300';
  const tickerShort = stock.ticker.replace('.OL', '');

  return (
    <Link 
      href={`/analyse/${stock.ticker}`}
      className="block bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200"
    >
      {/* Header - Hvit bakgrunn med grønn badge */}
      <div className="bg-white px-6 pt-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {rank && (
                <span className="text-[#1E293B] font-extrabold text-xl">
                  #{rank}
                </span>
              )}
              <div className={clsx('inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold', config.bg, config.textColor)}>
                {config.text}
              </div>
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-1">{tickerShort}</h3>
            <p className="text-sm text-gray-500">{stock.name}</p>
          </div>
          <div className="flex gap-1.5">
            {stock.strategies.includes('MOMENTUM') && (
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center" title="Momentum">
                <Zap className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </div>
            )}
            {stock.strategies.includes('BUFFETT') && (
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center" title="Buffett">
                <Shield className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </div>
            )}
            {stock.strategies.includes('TVEITEREID') && (
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center" title="Tveitereid">
                <TrendingUpIcon className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </div>
            )}
            {stock.strategies.includes('REBOUND') && (
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center" title="Rebound">
                <ArrowUpCircle className="w-4 h-4 text-gray-600" strokeWidth={2} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6">
        {/* Price */}
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="text-3xl font-extrabold text-[#1E293B]">
              {stock.price.toFixed(2)} <span className="text-base text-gray-400 font-semibold">NOK</span>
            </div>
          </div>
          <div className="text-right">
            <div className={clsx('text-base font-bold', stock.changePercent >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* K-SCORE */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">K-SCORE</span>
            <span className="text-2xl font-extrabold text-[#1E293B]">{stock.kScore}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className={clsx('h-full rounded-full', kScoreColor)}
              style={{ width: `${stock.kScore}%` }}
            ></div>
          </div>
        </div>

        {/* RSI */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold">RSI</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#1E293B]">{stock.rsi.toFixed(1)}</span>
              <span className={clsx(
                'text-xs font-semibold px-2 py-0.5 rounded',
                stock.rsi < 40 ? 'bg-green-100 text-green-700' : 
                stock.rsi > 60 ? 'bg-red-100 text-red-700' : 
                'bg-gray-100 text-gray-600'
              )}>
                {stock.rsi < 40 ? 'Lav' : stock.rsi > 60 ? 'Høy' : 'OK'}
              </span>
            </div>
          </div>
        </div>

        {/* Gain and Risk */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">GEVINST</div>
            <div className="text-lg font-bold text-[#10B981]">+{stock.gainKr.toFixed(2)} kr</div>
            <div className="text-xs text-[#10B981] font-semibold">+{stock.gainPercent.toFixed(0)}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">RISIKO</div>
            <div className="text-lg font-bold text-[#EF4444]">-{stock.riskKr.toFixed(2)} kr</div>
            <div className="text-xs text-[#EF4444] font-semibold">-{stock.riskPercent.toFixed(1)}%</div>
          </div>
        </div>

        {/* Risk/Reward Ratio */}
        <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 font-semibold uppercase">Risk/Reward</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold text-[#1E293B]">
                1:{(stock.gainPercent / stock.riskPercent).toFixed(2)}
              </span>
              <span className={clsx(
                'text-xs font-bold px-2 py-1 rounded',
                (stock.gainPercent / stock.riskPercent) >= 2 ? 'bg-green-100 text-green-700' :
                (stock.gainPercent / stock.riskPercent) >= 1.5 ? 'bg-emerald-100 text-emerald-700' :
                (stock.gainPercent / stock.riskPercent) >= 1 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              )}>
                {(stock.gainPercent / stock.riskPercent) >= 2 ? 'Utmerket' :
                 (stock.gainPercent / stock.riskPercent) >= 1.5 ? 'God' :
                 (stock.gainPercent / stock.riskPercent) >= 1 ? 'OK' :
                 'Dårlig'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Tidshorisont */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-xs text-gray-400 uppercase font-semibold">TIDSHORISONT</span>
          <span className="ml-auto text-sm font-bold text-[#1E293B]">{stock.timeHorizon}</span>
        </div>
      </div>
    </Link>
  );
}
