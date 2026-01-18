'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  PieChart, 
  Activity,
  ChevronRight,
  Info,
  Download
} from 'lucide-react';
import { clsx } from 'clsx';
import { Trade, Stock } from '@/lib/types';
import { 
  calculatePortfolioRisk, 
  calculatePositionSize,
  exportPortfolioToCSV,
  type PortfolioRiskMetrics,
  type PositionSizing
} from '@/lib/analysis/risk-metrics';
import { getTrades } from '@/lib/store/local-store';
import { SECTORS, type SectorId } from '@/lib/data/sectors';

interface RiskDashboardProps {
  stocks: Stock[];
}

export default function RiskDashboard({ stocks }: RiskDashboardProps) {
  const [metrics, setMetrics] = useState<PortfolioRiskMetrics | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showPositionCalc, setShowPositionCalc] = useState(false);
  const [positionParams, setPositionParams] = useState({
    ticker: '',
    currentPrice: 0,
    stopLoss: 0,
    target: 0,
    maxRiskPercent: 2,
  });
  const [positionResult, setPositionResult] = useState<PositionSizing | null>(null);

  useEffect(() => {
    const allTrades = getTrades();
    setTrades(allTrades);
    
    const portfolioValue = allTrades
      .filter(t => !t.exitPrice)
      .reduce((sum, t) => {
        const stock = stocks.find(s => s.ticker === t.ticker);
        return sum + (stock?.price || t.entryPrice) * t.quantity;
      }, 0);

    const riskMetrics = calculatePortfolioRisk(allTrades, stocks, portfolioValue);
    setMetrics(riskMetrics);
  }, [stocks]);

  const handleCalculatePosition = () => {
    if (!metrics || positionParams.currentPrice <= 0) return;
    
    const result = calculatePositionSize({
      ...positionParams,
      portfolioValue: metrics.totalValue || 100000,
    });
    setPositionResult(result);
  };

  const handleExport = () => {
    exportPortfolioToCSV(trades, stocks);
  };

  const getRiskLevelColor = (level: PortfolioRiskMetrics['overallRiskLevel']) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'very_high': return 'text-red-600 bg-red-100';
    }
  };

  if (!metrics) {
    return (
      <div className="bg-surface dark:bg-dark-surface rounded-2xl p-8 border border-surface-border dark:border-dark-border text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
        <p className="text-gray-500 dark:text-dark-muted">Beregner risikometrikker...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-slate dark:text-white">Risk Dashboard</h2>
            <p className="text-gray-500 dark:text-dark-muted">Porteføljerisiko og analyse</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-dark-border text-gray-700 dark:text-dark-text rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Eksporter CSV
        </button>
      </div>

      {/* Risk Level Banner */}
      <div className={clsx(
        'rounded-2xl p-6 flex items-center justify-between',
        getRiskLevelColor(metrics.overallRiskLevel)
      )}>
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-8 h-8" />
          <div>
            <h3 className="text-xl font-bold capitalize">
              {metrics.overallRiskLevel === 'very_high' ? 'Veldig Høy' : 
               metrics.overallRiskLevel === 'high' ? 'Høy' :
               metrics.overallRiskLevel === 'medium' ? 'Medium' : 'Lav'} Risiko
            </h3>
            <p className="text-sm opacity-80">
              {metrics.riskWarnings.length > 0 ? metrics.riskWarnings[0] : 'Porteføljen er godt diversifisert'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {metrics.valueAtRisk1DayPercent.toFixed(1)}%
          </div>
          <div className="text-sm opacity-80">1-dags VaR</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-5 border border-surface-border dark:border-dark-border">
          <div className="text-sm text-gray-500 dark:text-dark-muted mb-1">Portfolio Beta</div>
          <div className={clsx(
            'text-2xl font-bold',
            metrics.portfolioBeta > 1.2 ? 'text-red-500' :
            metrics.portfolioBeta > 1 ? 'text-yellow-500' : 'text-green-500'
          )}>
            {metrics.portfolioBeta.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {metrics.portfolioBeta > 1 ? 'Mer volatil enn markedet' : 'Mindre volatil'}
          </div>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-5 border border-surface-border dark:border-dark-border">
          <div className="text-sm text-gray-500 dark:text-dark-muted mb-1">Value at Risk (1d)</div>
          <div className="text-2xl font-bold text-red-500">
            -{metrics.valueAtRisk1Day.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </div>
          <div className="text-xs text-gray-400 mt-1">
            95% konfidens
          </div>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-5 border border-surface-border dark:border-dark-border">
          <div className="text-sm text-gray-500 dark:text-dark-muted mb-1">Max Drawdown</div>
          <div className={clsx(
            'text-2xl font-bold',
            metrics.maxDrawdown > 15 ? 'text-red-500' :
            metrics.maxDrawdown > 8 ? 'text-yellow-500' : 'text-green-500'
          )}>
            -{metrics.maxDrawdown.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Verste posisjon
          </div>
        </div>

        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-5 border border-surface-border dark:border-dark-border">
          <div className="text-sm text-gray-500 dark:text-dark-muted mb-1">Sharpe Ratio</div>
          <div className={clsx(
            'text-2xl font-bold',
            metrics.sharpeRatio > 1 ? 'text-green-500' :
            metrics.sharpeRatio > 0.5 ? 'text-yellow-500' : 'text-red-500'
          )}>
            {metrics.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {metrics.sharpeRatio > 1 ? 'God risikojustert avk.' : 'Kan forbedres'}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Concentration */}
        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-brand-slate dark:text-dark-text" />
            <h3 className="font-bold text-brand-slate dark:text-white">Sektorkonsentrasjon</h3>
          </div>
          
          <div className="space-y-3">
            {metrics.sectorConcentration.map(sector => {
              // Finn sektor-info basert på norsk navn
              const sectorInfo = Object.values(SECTORS).find(s => s.nameNo === sector.sector);
              const icon = sectorInfo?.icon || '❓';
              const color = sectorInfo?.color || '#9ca3af';
              
              return (
                <div key={sector.sector}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-6 h-6 rounded flex items-center justify-center text-sm"
                        style={{ backgroundColor: color + '20' }}
                      >
                        {icon}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-dark-text">{sector.sector}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        sector.risk === 'high' ? 'bg-red-100 text-red-700' :
                        sector.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {sector.weight.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-dark-border rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, sector.weight)}%`,
                        backgroundColor: sector.risk === 'high' ? '#ef4444' : 
                                        sector.risk === 'medium' ? '#eab308' : color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warnings & Suggestions */}
        <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-brand-slate dark:text-dark-text" />
            <h3 className="font-bold text-brand-slate dark:text-white">Advarsler & Tips</h3>
          </div>

          {metrics.riskWarnings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-red-600 mb-2">⚠️ Advarsler</h4>
              <ul className="space-y-1">
                {metrics.riskWarnings.map((warning, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-dark-muted flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {metrics.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-600 mb-2">💡 Forslag</h4>
              <ul className="space-y-1">
                {metrics.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-sm text-gray-600 dark:text-dark-muted flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {metrics.riskWarnings.length === 0 && metrics.suggestions.length === 0 && (
            <p className="text-gray-500 dark:text-dark-muted text-center py-4">
              ✅ Ingen advarsler - porteføljen ser bra ut!
            </p>
          )}
        </div>
      </div>

      {/* Position Sizing Calculator */}
      <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
        <button
          onClick={() => setShowPositionCalc(!showPositionCalc)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors"
        >
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-brand-slate dark:text-dark-text" />
            <h3 className="font-bold text-brand-slate dark:text-white">Position Sizing Calculator</h3>
          </div>
          <ChevronRight className={clsx(
            'w-5 h-5 text-gray-400 transition-transform',
            showPositionCalc && 'rotate-90'
          )} />
        </button>

        {showPositionCalc && (
          <div className="px-6 pb-6 pt-0 border-t border-surface-border dark:border-dark-border">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-dark-muted mb-1">Ticker</label>
                <input
                  type="text"
                  value={positionParams.ticker}
                  onChange={(e) => setPositionParams(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
                  placeholder="NHY.OL"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-dark-muted mb-1">Nåpris</label>
                <input
                  type="number"
                  value={positionParams.currentPrice || ''}
                  onChange={(e) => setPositionParams(p => ({ ...p, currentPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
                  placeholder="100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-dark-muted mb-1">Stop-Loss</label>
                <input
                  type="number"
                  value={positionParams.stopLoss || ''}
                  onChange={(e) => setPositionParams(p => ({ ...p, stopLoss: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
                  placeholder="95"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-dark-muted mb-1">Target</label>
                <input
                  type="number"
                  value={positionParams.target || ''}
                  onChange={(e) => setPositionParams(p => ({ ...p, target: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
                  placeholder="115"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-dark-muted mb-1">Max Risiko %</label>
                <input
                  type="number"
                  value={positionParams.maxRiskPercent}
                  onChange={(e) => setPositionParams(p => ({ ...p, maxRiskPercent: parseFloat(e.target.value) || 2 }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={handleCalculatePosition}
              className="mt-4 px-6 py-2 bg-brand-emerald text-white rounded-xl font-semibold hover:bg-brand-emerald/90 transition-colors"
            >
              Beregn posisjonsstørrelse
            </button>

            {positionResult && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted">Anbefalt antall</div>
                  <div className="text-xl font-bold text-brand-slate dark:text-white">
                    {positionResult.recommendedShares} aksjer
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted">Posisjonsverdi</div>
                  <div className="text-xl font-bold text-brand-slate dark:text-white">
                    {positionResult.recommendedValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted">Max tap</div>
                  <div className="text-xl font-bold text-red-500">
                    -{positionResult.maxLoss.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted">Risk/Reward</div>
                  <div className={clsx(
                    'text-xl font-bold',
                    positionResult.riskRewardRatio >= 2 ? 'text-green-500' : 'text-yellow-500'
                  )}>
                    1:{positionResult.riskRewardRatio.toFixed(1)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
