'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { SBLevelsAnalysis } from '@/lib/analysis/sb-levels';
import { clsx } from 'clsx';
import { TrendingUp, RefreshCcw, Ban } from 'lucide-react';

interface ChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SBLevelsChartProps {
  candles: ChartCandle[];
  analysis: SBLevelsAnalysis;
}

export default function SBLevelsChart({ candles, analysis }: SBLevelsChartProps) {
  // Transform candles for chart
  const chartData = useMemo(() => {
    return candles.slice(-60).map((candle) => ({
      date: new Date(candle.date).toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }),
      close: candle.close,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      volume: candle.volume,
    }));
  }, [candles]);

  // Calculate Y-axis domain with padding
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];
    
    const allValues = [
      ...chartData.flatMap(d => [d.high, d.low]),
      analysis.primaryResistance,
      analysis.primarySupport,
      analysis.scenarioA.tradingPlan?.target2 ?? analysis.primaryResistance,
      analysis.scenarioB.tradingPlan?.stopLoss ?? analysis.primarySupport,
    ];
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.15;
    
    return [min - padding, max + padding];
  }, [chartData, analysis]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">{label}</p>
          <div className="space-y-0.5 text-gray-600 dark:text-gray-300">
            <p>Åpning: {data.open?.toFixed(2)}</p>
            <p>Høy: {data.high?.toFixed(2)}</p>
            <p>Lav: {data.low?.toFixed(2)}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Lukk: {data.close?.toFixed(2)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get scenario description
  const getScenarioDescription = () => {
    if (analysis.activeScenario === 'A') {
      return 'Vurder breakout';
    }
    if (analysis.activeScenario === 'B') {
      return 'Vurder pullback-kjøp';
    }
    if (analysis.activeScenario === 'C') {
      return 'Vent på bedre posisjonering';
    }
    return 'Analyserer...';
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              SB-Levels Analyse
            </h3>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Pris</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 rounded bg-green-100 border border-green-300"></div>
              <span className="text-gray-600 dark:text-gray-400">Scenario A (Impuls)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span className="text-gray-600 dark:text-gray-400">Scenario B (Pullback)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 rounded bg-red-100 border border-red-300"></div>
              <span className="text-gray-600 dark:text-gray-400">Scenario C (NO TRADE)</span>
            </div>
          </div>
        </div>
        
        {/* Active Scenario Banner */}
        <div className={clsx(
          'mt-4 px-4 py-2 rounded-lg flex items-center gap-2',
          analysis.activeScenario === 'A' && 'bg-green-50 dark:bg-green-900/20',
          analysis.activeScenario === 'B' && 'bg-blue-50 dark:bg-blue-900/20',
          analysis.activeScenario === 'C' && 'bg-red-50 dark:bg-red-900/20',
          !analysis.activeScenario && 'bg-gray-50 dark:bg-gray-800',
        )}>
          <span className="font-medium text-gray-700 dark:text-gray-300">Aktivt Scenario:</span>
          <div className="flex items-center gap-2">
            {analysis.activeScenario === 'A' && <span className="text-lg">🚀</span>}
            {analysis.activeScenario === 'B' && <span className="text-lg">🔄</span>}
            {analysis.activeScenario === 'C' && <span className="text-lg">⛔</span>}
            <span className={clsx(
              'font-bold',
              analysis.activeScenario === 'A' && 'text-green-700 dark:text-green-400',
              analysis.activeScenario === 'B' && 'text-blue-700 dark:text-blue-400',
              analysis.activeScenario === 'C' && 'text-red-700 dark:text-red-400',
            )}>
              Scenario {analysis.activeScenario} ({analysis.activeScenario === 'A' ? 'Impuls' : analysis.activeScenario === 'B' ? 'Pullback' : 'NO TRADE'})
            </span>
            <span className="text-gray-600 dark:text-gray-400">- {getScenarioDescription()}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                domain={yDomain}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => value.toFixed(2)}
                width={50}
              />
              
              <Tooltip content={<CustomTooltip />} />

              {/* NO TRADE Zone - Scenario C */}
              <ReferenceArea
                y1={analysis.primarySupport + (analysis.atr * 0.3)}
                y2={analysis.primaryResistance - (analysis.atr * 0.3)}
                fill="rgba(239, 68, 68, 0.08)"
                stroke="rgba(239, 68, 68, 0.3)"
                strokeDasharray="5 5"
              />

              {/* Scenario A - Breakout Zone */}
              <ReferenceArea
                y1={analysis.primaryResistance}
                y2={analysis.primaryResistance + analysis.atr * 0.5}
                fill="rgba(34, 197, 94, 0.1)"
                stroke="rgba(34, 197, 94, 0.4)"
                strokeDasharray="3 3"
              />

              {/* Scenario B - Pullback Zone */}
              <ReferenceArea
                y1={analysis.primarySupport - analysis.atr * 0.3}
                y2={analysis.primarySupport + analysis.atr * 0.3}
                fill="rgba(59, 130, 246, 0.1)"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeDasharray="3 3"
              />

              {/* Primary Resistance Line */}
              <ReferenceLine
                y={analysis.primaryResistance}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `Motstand ${analysis.primaryResistance.toFixed(2)}`,
                  position: 'right',
                  fill: '#22c55e',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />

              {/* Primary Support Line */}
              <ReferenceLine
                y={analysis.primarySupport}
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `Støtte ${analysis.primarySupport.toFixed(2)}`,
                  position: 'right',
                  fill: '#3b82f6',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />

              {/* Current Price Line */}
              <ReferenceLine
                y={analysis.currentPrice}
                stroke="#f59e0b"
                strokeWidth={2}
                label={{
                  value: `Nå ${analysis.currentPrice.toFixed(2)}`,
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
              />

              {/* Target lines for Scenario A */}
              {analysis.scenarioA.tradingPlan && (
                <>
                  <ReferenceLine
                    y={analysis.scenarioA.tradingPlan.target1}
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    label={{
                      value: `T1 ${analysis.scenarioA.tradingPlan.target1.toFixed(2)}`,
                      position: 'right',
                      fill: '#10b981',
                      fontSize: 10,
                    }}
                  />
                  {analysis.scenarioA.tradingPlan.target2 && (
                    <ReferenceLine
                      y={analysis.scenarioA.tradingPlan.target2}
                      stroke="#10b981"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      label={{
                        value: `T2 ${analysis.scenarioA.tradingPlan.target2.toFixed(2)}`,
                        position: 'right',
                        fill: '#10b981',
                        fontSize: 10,
                      }}
                    />
                  )}
                </>
              )}

              {/* NO TRADE label in middle of chart */}
              {analysis.scenarioC.isActive && (
                <ReferenceLine
                  y={(analysis.primaryResistance + analysis.primarySupport) / 2}
                  stroke="transparent"
                  label={{
                    value: '⛔ NO TRADE',
                    position: 'center',
                    fill: '#ef4444',
                    fontSize: 12,
                    fontWeight: 'bold',
                  }}
                />
              )}

              {/* Price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 border-t border-gray-200 dark:border-gray-700">
        <div className="p-4 border-r border-gray-200 dark:border-gray-700">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Motstand</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analysis.primaryResistance.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {((analysis.primaryResistance - analysis.currentPrice) / analysis.currentPrice * 100).toFixed(1)}% over
          </div>
        </div>
        
        <div className="p-4 border-r border-gray-200 dark:border-gray-700">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Støtte</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analysis.primarySupport.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {((analysis.currentPrice - analysis.primarySupport) / analysis.currentPrice * 100).toFixed(1)}% under
          </div>
        </div>
        
        <div className="p-4 border-r border-gray-200 dark:border-gray-700">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">ATR (14)</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analysis.atr.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {analysis.atrPercent.toFixed(1)}% volatilitet
          </div>
        </div>
        
        <div className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">Markedsstruktur</div>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {analysis.marketStructure === 'uptrend' && '📈'}
              {analysis.marketStructure === 'downtrend' && '📉'}
              {analysis.marketStructure === 'range' && '↔️'}
              {analysis.marketStructure === 'breakout' && '🚀'}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
              {analysis.marketStructure === 'uptrend' && 'Opptrend'}
              {analysis.marketStructure === 'downtrend' && 'Nedtrend'}
              {analysis.marketStructure === 'range' && 'Sideveis'}
              {analysis.marketStructure === 'breakout' && 'Breakout'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
