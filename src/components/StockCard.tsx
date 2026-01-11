import { Stock } from '@/lib/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockCardProps {
  stock: Stock;
}

export default function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.change >= 0;
  const signalColor = stock.signal === 'BUY' ? 'bg-brand-emerald' : 
                     stock.signal === 'SELL' ? 'bg-brand-rose' : 
                     'bg-gray-500';

  return (
    <div className="bg-surface rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header with ticker and K-SCORE */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-brand-slate">{stock.ticker}</h3>
          <p className="text-sm text-gray-600">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-semibold ${signalColor}`}>
            {stock.signal}
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">K-SCORE</span>
            <div className="text-2xl font-bold text-brand-slate">{stock.kScore}</div>
          </div>
        </div>
      </div>

      {/* Price and change */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-brand-slate">
            {stock.market === 'OSLO' ? `${stock.price.toFixed(2)} NOK` : `$${stock.price.toFixed(2)}`}
          </span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-brand-emerald' : 'text-brand-rose'}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-semibold">
              {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className={`text-xs ${isPositive ? 'text-brand-emerald' : 'text-brand-rose'}`}>
          {isPositive ? '+' : ''}{stock.change.toFixed(2)} {stock.market === 'OSLO' ? 'NOK' : 'USD'}
        </div>
      </div>

      {/* Gain/Risk section */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Gevinst</div>
          <div className="text-lg font-bold text-brand-emerald">
            {stock.market === 'OSLO' ? `${stock.gainKr.toFixed(2)} NOK` : `$${stock.gainKr.toFixed(2)}`}
          </div>
          <div className="text-xs text-brand-emerald font-semibold">
            +{stock.gainPercent.toFixed(2)}%
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-xs text-gray-600 mb-1">Risiko</div>
          <div className="text-lg font-bold text-brand-rose">
            {stock.market === 'OSLO' ? `${stock.riskKr.toFixed(2)} NOK` : `$${stock.riskKr.toFixed(2)}`}
          </div>
          <div className="text-xs text-brand-rose font-semibold">
            -{stock.riskPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Target and Stop Loss */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <div className="text-gray-600 text-xs mb-1">Target</div>
          <div className="font-semibold text-brand-slate">
            {stock.market === 'OSLO' ? `${stock.target.toFixed(2)} NOK` : `$${stock.target.toFixed(2)}`}
          </div>
        </div>
        <div>
          <div className="text-gray-600 text-xs mb-1">Stop Loss</div>
          <div className="font-semibold text-brand-slate">
            {stock.market === 'OSLO' ? `${stock.stopLoss.toFixed(2)} NOK` : `$${stock.stopLoss.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Footer with time horizon and strategies */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Tidshorisont: <span className="font-semibold text-brand-slate">{stock.timeHorizon}</span></span>
          <div className="flex gap-1">
            {stock.strategies.map((strategy) => (
              <span key={strategy} className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                {strategy}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
