'use client';

import { Stock } from '@/lib/types';
import { TrendingUp, Shield, Zap, ArrowUpCircle, Users, CircleCheck, CircleX, Bell, StickyNote } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

interface StockCardProps {
  stock: Stock;
  rank?: number;
  reminder?: string;  // ISO date string for påminnelse
  hasNote?: boolean;  // Om aksjen har et notat
}

export default function StockCard({ stock, rank, reminder, hasNote }: StockCardProps) {
  const isPositive = stock.changePercent >= 0;
  const currency = stock.market === 'USA' ? 'USD' : 'NOK';
  
  const signalConfig = {
    BUY: { bg: 'bg-brand-emerald', text: 'KJØP', badgeBg: 'bg-white/20', badgeText: 'text-white' },
    SELL: { bg: 'bg-brand-rose', text: 'SELL', badgeBg: 'bg-white/20', badgeText: 'text-white' },
    HOLD: { bg: 'bg-gray-500', text: 'WATCH', badgeBg: 'bg-white/20', badgeText: 'text-white' },
  };

  const config = signalConfig[stock.signal];
  const kScoreColor = stock.kScore >= 75 ? 'bg-brand-emerald' : stock.kScore >= 60 ? 'bg-yellow-500' : 'bg-gray-400';
  const tickerShort = stock.ticker.replace('.OL', '');

  return (
    <Link 
      href={`/analyse/${stock.ticker}`}
      className="block bg-card rounded-3xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 stock-card"
    >
      {/* Header */}
      <div className={clsx('p-6 pb-5', config.bg)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {rank && (
                <span className="text-white font-extrabold text-xl">
                  #{rank}
                </span>
              )}
              <div className={clsx('inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold', config.badgeBg, config.badgeText)}>
                {config.text}
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">{tickerShort}</h3>
            <p className="text-sm text-white/70 mt-1">{stock.name}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Strategy Icons */}
            <div className="flex gap-1.5">
              {/* Momentum: Alltid hvit på kortet */}
              {(stock.strategies.includes('MOMENTUM_TREND') || stock.strategies.includes('MOMENTUM_ASYM') || stock.strategies.includes('MOMENTUM')) && (
                <div 
                  className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center" 
                  title={
                    stock.strategies.includes('MOMENTUM_TREND') && stock.strategies.includes('MOMENTUM_ASYM') 
                      ? "Momentum (Trend + Asym)" 
                      : stock.strategies.includes('MOMENTUM_ASYM') 
                        ? "Momentum Asym" 
                        : "Momentum Trend"
                  }
                >
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {stock.strategies.includes('BUFFETT') && (
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center" title="Buffett">
                  <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {stock.strategies.includes('TVEITEREID') && (
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center" title="Tveitereid">
                  <TrendingUp className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {stock.strategies.includes('REBOUND') && (
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center" title="Rebound">
                  <ArrowUpCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {stock.strategies.includes('INSIDER') && (
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center" title="Insider Kjøp">
                  <Users className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {/* Note icon */}
              {hasNote && !reminder && (
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center" title="Har notat">
                  <StickyNote className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              {/* Reminder icon with date */}
              {reminder && (
                <div 
                  className="w-7 h-7 rounded-lg bg-amber-400/30 flex items-center justify-center" 
                  title={`Påminnelse: ${new Date(reminder).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })}${new Date(reminder).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) !== '00:00' ? ' kl. ' + new Date(reminder).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' }) : ''}`}
                >
                  <Bell className="w-4 h-4 text-amber-300 fill-amber-300" strokeWidth={2.5} />
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {/* Price */}
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">PRIS</div>
            <div className="text-3xl font-extrabold text-foreground">
              {stock.price.toFixed(2)} <span className="text-lg text-muted-foreground">{currency}</span>
            </div>
          </div>
          <div className="text-right">
            <div className={clsx('text-lg font-bold', isPositive ? 'text-brand-emerald' : 'text-brand-rose')}>
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* K-SCORE */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">K-SCORE</span>
            <span className="text-2xl font-extrabold text-foreground">{stock.kScore}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div 
              className={clsx('h-full rounded-full k-score-bar', kScoreColor)}
              style={{ width: `${stock.kScore}%` }}
            ></div>
          </div>
        </div>

        {/* RSI */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">RSI</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">{stock.rsi.toFixed(1)}</span>
              <span className={clsx(
                'text-xs font-semibold px-2 py-0.5 rounded',
                stock.rsi >= 30 && stock.rsi <= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                OK
              </span>
            </div>
          </div>
        </div>

        {/* Risk/Reward Ratio - Grafisk */}
        <div className="mb-5">
          {/* Grafisk bar - Gevinst først (venstre/grønn), Risiko sist (høyre/rød) */}
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-muted mb-3">
            <div 
              className="bg-emerald-500"
              style={{ width: `${((stock.gainPercent / stock.riskPercent) / (1 + (stock.gainPercent / stock.riskPercent))) * 100}%` }}
            ></div>
            <div 
              className="bg-rose-400"
              style={{ width: `${(1 / (1 + (stock.gainPercent / stock.riskPercent))) * 100}%` }}
            ></div>
          </div>
          
          {/* Gevinst, Ratio og Risiko på samme linje */}
          <div className="grid grid-cols-3 gap-2 items-start">
            {/* Gevinst */}
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">GEVINST</div>
              <div className="text-base font-bold text-brand-emerald">+{stock.gainKr.toFixed(2)} kr</div>
              <div className="text-xs text-brand-emerald font-semibold">+{stock.gainPercent.toFixed(0)}%</div>
            </div>
            
            {/* Ratio i senter */}
            <div className="text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">RATIO</div>
              <div className="text-base font-semibold text-muted-foreground">
                1:{(stock.gainPercent / stock.riskPercent).toFixed(2)}
              </div>
            </div>
            
            {/* Risiko */}
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">RISIKO</div>
              <div className="text-base font-bold text-brand-rose">-{stock.riskKr.toFixed(2)} kr</div>
              <div className="text-xs text-brand-rose font-semibold">-{stock.riskPercent.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">TIDSHORISONT</span>
          <span className="text-base font-bold text-brand-emerald">{stock.timeHorizon}</span>
        </div>
      </div>
    </Link>
  );
}
