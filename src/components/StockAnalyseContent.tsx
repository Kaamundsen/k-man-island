'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stock } from '@/lib/types';
import PriceChart from '@/components/PriceChart';
import TradePlanCard from '@/components/TradePlanCard';
import NewsWidget from '@/components/NewsWidget';
import InsiderAlert from '@/components/InsiderAlert';
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Zap, Shield, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartData {
  ticker: string;
  source: 'yahoo' | 'finnhub' | 'fallback' | 'error';
  candles: ChartCandle[];
  count: number;
  totalAvailable: number;
  lastUpdated: string;
  insufficientHistory: boolean;
  error?: string;
}

interface StockAnalyseContentProps {
  stock: Stock;
  allStocks: Stock[];
}

export default function StockAnalyseContent({ stock, allStocks }: StockAnalyseContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'chart' | 'plan' | 'insider' | 'news'>('chart');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Fetch real historical data from API
  useEffect(() => {
    async function loadChartData() {
      setChartLoading(true);
      setChartError(null);
      
      try {
        const response = await fetch(`/api/chart/${stock.ticker}?days=180`);
        const data: ChartData = await response.json();
        
        if (data.candles && data.candles.length > 0) {
          setChartData(data);
        } else if (data.error) {
          setChartError(data.error);
        } else {
          setChartError('Ingen historisk data tilgjengelig');
        }
      } catch (err) {
        console.error('Failed to load chart data:', err);
        setChartError('Kunne ikke laste graf-data');
      } finally {
        setChartLoading(false);
      }
    }
    
    loadChartData();
  }, [stock.ticker]);

  // Transform candle data for chart component
  const priceData = chartData?.candles.map(candle => ({
    date: new Date(candle.date).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }),
    price: candle.close,
  })) || [];

  const tickerShort = stock.ticker.replace('.OL', '');
  const isPositive = stock.changePercent >= 0;
  
  const signalConfig = {
    BUY: { bg: 'bg-brand-emerald', text: 'KJØP' },
    SELL: { bg: 'bg-brand-rose', text: 'SELL' },
    HOLD: { bg: 'bg-gray-500', text: 'WATCH' },
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
              {/* Data Source Warning */}
              {chartData && (
                <div className={clsx(
                  'rounded-xl p-3 text-sm',
                  chartData.source === 'yahoo' ? 'bg-green-50 text-green-800' :
                  chartData.source === 'finnhub' ? 'bg-blue-50 text-blue-800' :
                  'bg-amber-50 text-amber-800'
                )}>
                  <div className="flex items-center justify-between">
                    <span>
                      <strong>Datakilde:</strong> {chartData.source === 'yahoo' ? 'Yahoo Finance' : 
                        chartData.source === 'finnhub' ? 'Finnhub' : 'Fallback'}
                      {' | '}{chartData.count} dager
                    </span>
                    {chartData.insufficientHistory && (
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Utilstrekkelig historikk for full analyse
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Loading State */}
              {chartLoading && (
                <div className="bg-surface rounded-2xl p-12 border border-surface-border flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
                  <span className="ml-3 text-gray-600">Laster historisk data...</span>
                </div>
              )}
              
              {/* Error State */}
              {chartError && !chartLoading && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{chartError}</span>
                  </div>
                  <p className="text-sm text-red-600 mt-2">
                    Grafen kan ikke vises uten historisk data. Strategisignaler kan være upålitelige.
                  </p>
                </div>
              )}
              
              {/* Chart */}
              {!chartLoading && !chartError && priceData.length > 0 && (
                <PriceChart 
                  data={priceData}
                  target={stock.target}
                  stopLoss={stock.stopLoss}
                  currentPrice={stock.price}
                />
              )}
              
              <div className="bg-surface rounded-2xl p-6 border border-surface-border">
                <h3 className="text-xl font-bold text-brand-slate mb-4">🔍 Teknisk Analyse</h3>
                
                {/* Insufficient History Warning */}
                {chartData?.insufficientHistory && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 mb-4">
                    <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Begrenset Analyse
                    </h4>
                    <p className="text-sm text-amber-700">
                      Kun {chartData.count} dager med historikk tilgjengelig (anbefalt: 500+ dager).
                      Signaler og K-Score kan være mindre pålitelige.
                    </p>
                  </div>
                )}
                
                {/* BUY with sufficient history */}
                {stock.signal === 'BUY' && !chartData?.insufficientHistory && (
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
                
                {/* BUY with INSUFFICIENT history - show warning */}
                {stock.signal === 'BUY' && chartData?.insufficientHistory && (
                  <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4">
                    <h4 className="font-bold text-amber-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Mulig Kjøpssignal - Begrenset Data
                    </h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Tekniske indikatorer antyder et kjøpssignal, men analysen er basert på kun {chartData.count} dager historikk.
                      <strong className="block mt-2">Anbefaling: Bekreft signalet med andre kilder før handling.</strong>
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
                <span className="font-bold">#{allStocks.findIndex(s => s.ticker === stock.ticker) + 1} / {allStocks.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
