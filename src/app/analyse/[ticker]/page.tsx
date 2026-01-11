'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockStocks } from '@/lib/mock-data';
import PriceChart from '@/components/PriceChart';
import TradePlanCard from '@/components/TradePlanCard';
import NewsWidget from '@/components/NewsWidget';
import InsiderAlert from '@/components/InsiderAlert';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Zap, Shield } from 'lucide-react';
import { clsx } from 'clsx';

export default function AnalysePage() {
  const params = useParams();
  const router = useRouter();
  const ticker = params.ticker as string;
  const [activeTab, setActiveTab] = useState<'chart' | 'plan' | 'insider' | 'news'>('chart');

  const stock = useMemo(() => {
    return mockStocks.find(s => s.ticker === ticker || s.ticker === `${ticker}.OL`);
  }, [ticker]);

  // Generate mock price data for chart
  const priceData = useMemo(() => {
    if (!stock) return [];
    
    const data = [];
    const days = 90;
    const basePrice = stock.price;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * (basePrice * 0.15);
      data.push({
        date: date.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }),
        price: Number((basePrice + variation).toFixed(2))
      });
    }
    
    return data;
  }, [stock]);

  if (!stock) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Aksje ikke funnet</h1>
          <p className="text-gray-600 mb-6">Vi kunne ikke finne informasjon om {ticker}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-brand-emerald text-white rounded-xl font-semibold hover:bg-brand-emerald/90 transition-colors"
          >
            Tilbake til Dashboard
          </button>
        </div>
      </main>
    );
  }

  const tickerShort = stock.ticker.replace('.OL', '');
  const isPositive = stock.changePercent >= 0;
  
  const signalConfig = {
    BUY: { bg: 'bg-brand-emerald', text: 'KJØP' },
    SELL: { bg: 'bg-brand-rose', text: 'SELG' },
    HOLD: { bg: 'bg-gray-500', text: 'HOLD' },
  };

  const config = signalConfig[stock.signal];

  return (
    <main className="min-h-screen p-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-brand-slate mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Tilbake til oversikt</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-5xl font-extrabold text-brand-slate tracking-tight mb-2">
              {tickerShort}
            </h1>
            <p className="text-xl text-gray-600">{stock.name}</p>
          </div>
          <div className={clsx('px-6 py-3 rounded-2xl text-white font-bold text-lg', config.bg)}>
            {config.text}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-surface rounded-xl p-4 border border-surface-border">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
              Nåværende Pris
            </div>
            <div className="text-2xl font-extrabold text-brand-slate mb-1">
              {stock.price.toFixed(2)} NOK
            </div>
            <div className={clsx('text-sm font-semibold flex items-center gap-1', 
              isPositive ? 'text-brand-emerald' : 'text-brand-rose'
            )}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-xl p-4 text-white">
            <div className="text-xs opacity-75 uppercase tracking-wide font-semibold mb-2">
              K-SCORE
            </div>
            <div className="text-3xl font-extrabold mb-1">{stock.kScore}</div>
            <div className="text-xs opacity-75">
              {stock.kScore >= 75 ? 'Utmerket' : stock.kScore >= 60 ? 'God' : 'Moderat'}
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-surface-border">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
              Gevinst Potensial
            </div>
            <div className="text-2xl font-extrabold text-brand-emerald mb-1">
              +{stock.gainPercent.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">+{stock.gainKr.toFixed(2)} kr</div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-surface-border">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
              Risiko (SL)
            </div>
            <div className="text-2xl font-extrabold text-brand-rose mb-1">
              -{stock.riskPercent.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-600">-{stock.riskKr.toFixed(2)} kr</div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-surface-border">
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">
              Tidshorisont
            </div>
            <div className="text-xl font-extrabold text-brand-slate mb-1">
              {stock.timeHorizon}
            </div>
            <div className="text-xs text-gray-600">Estimat</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chart')}
          className={clsx(
            'px-6 py-3 font-bold text-sm transition-all rounded-t-xl',
            activeTab === 'chart'
              ? 'bg-brand-slate text-white'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          📈 Graf & Analyse
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={clsx(
            'px-6 py-3 font-bold text-sm transition-all rounded-t-xl',
            activeTab === 'plan'
              ? 'bg-brand-slate text-white'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          📋 Handelsplan
        </button>
        <button
          onClick={() => setActiveTab('insider')}
          className={clsx(
            'px-6 py-3 font-bold text-sm transition-all rounded-t-xl',
            activeTab === 'insider'
              ? 'bg-brand-slate text-white'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          👤 Innsidehandel
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={clsx(
            'px-6 py-3 font-bold text-sm transition-all rounded-t-xl',
            activeTab === 'news'
              ? 'bg-brand-slate text-white'
              : 'text-gray-600 hover:bg-gray-50'
          )}
        >
          📰 Nyheter
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'chart' && (
            <div className="space-y-6">
              <PriceChart 
                data={priceData}
                target={stock.target}
                stopLoss={stock.stopLoss}
                currentPrice={stock.price}
              />
              
              <div className="bg-surface rounded-2xl p-6 border border-surface-border">
                <h3 className="text-xl font-bold text-brand-slate mb-4">🔍 Teknisk Analyse</h3>
                
                {stock.signal === 'BUY' && (
                  <div className="bg-brand-emerald/10 border-2 border-brand-emerald rounded-xl p-4">
                    <h4 className="font-bold text-brand-emerald mb-2 flex items-center gap-2">
                      <span className="text-2xl">✓</span>
                      Kjøpssignal identifisert for {tickerShort}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Aksjen oppfyller alle kriterier for et kjøpssignal. K-Score på {stock.kScore} 
                      indikerer god momentum og teknisk styrke. Pris er over viktige glidende gjennomsnitt 
                      og RSI viser rom for oppside.
                    </p>
                  </div>
                )}

                {stock.signal === 'HOLD' && (
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-2xl">◉</span>
                      Hold/Avvent for {tickerShort}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Aksjen mangler klar retning. Noen, men ikke alle kriterier er oppfylt. 
                      Avvent bekreftet breakout før du handler.
                    </p>
                  </div>
                )}

                {stock.signal === 'SELL' && (
                  <div className="bg-brand-rose/10 border-2 border-brand-rose rounded-xl p-4">
                    <h4 className="font-bold text-brand-rose mb-2 flex items-center gap-2">
                      <span className="text-2xl">⚠</span>
                      Salgssignal identifisert for {tickerShort}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Tekniske indikatorer viser svakhet. RSI kan være overkjøpt eller pris har brutt 
                      under viktige støttenivåer. Vurder å ta profit eller stramme inn stop loss.
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-brand-slate uppercase tracking-wide mb-3">
                    Nøkkelindikatorer
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center justify-between">
                      <span>Target Price:</span>
                      <span className="font-bold text-brand-emerald">{stock.target.toFixed(2)} NOK</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Stop Loss:</span>
                      <span className="font-bold text-brand-rose">{stock.stopLoss.toFixed(2)} NOK</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Risk/Reward Ratio:</span>
                      <span className="font-bold text-brand-slate">1:{(stock.gainKr / stock.riskKr).toFixed(2)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && <TradePlanCard stock={stock} />}
          {activeTab === 'insider' && <InsiderAlert ticker={tickerShort} />}
          {activeTab === 'news' && <NewsWidget ticker={tickerShort} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Strategy Tags */}
          <div className="bg-surface rounded-2xl p-6 border border-surface-border">
            <h3 className="text-sm font-bold text-brand-slate uppercase tracking-wide mb-4">
              Strategier
            </h3>
            <div className="flex flex-wrap gap-2">
              {stock.strategies.map((strategy) => (
                <div
                  key={strategy}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-slate text-white rounded-xl text-sm font-bold"
                >
                  {strategy === 'MOMENTUM' && <Zap className="w-4 h-4" />}
                  {strategy === 'BUFFETT' && <Shield className="w-4 h-4" />}
                  {strategy === 'TVEITEREID' && <TrendingUp className="w-4 h-4" />}
                  {strategy}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
            <h3 className="text-sm font-bold opacity-90 uppercase tracking-wide mb-4">
              Rask Statistikk
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-75">Marked:</span>
                <span className="font-bold">{stock.market === 'OSLO' ? '🇳🇴 Oslo Børs' : '🇺🇸 US Markets'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-75">Siste endring:</span>
                <span className="font-bold">{isPositive ? '+' : ''}{stock.change.toFixed(2)} NOK</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-75">K-Score Rank:</span>
                <span className="font-bold">#{mockStocks.findIndex(s => s.ticker === stock.ticker) + 1} / {mockStocks.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
