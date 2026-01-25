'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Bar,
} from 'recharts';
import { SBLevelsAnalysis } from '@/lib/analysis/sb-levels';

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
      // For candlestick-like display
      range: [candle.low, candle.high],
      body: candle.close >= candle.open 
        ? [candle.open, candle.close] 
        : [candle.close, candle.open],
      isUp: candle.close >= candle.open,
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
    const padding = (max - min) * 0.1;
    
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

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          SB-Levels Kursgraf
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Motstand</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Støtte</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500/30 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">No Trade Zone</span>
          </div>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            
            <YAxis 
              domain={yDomain}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            
            <Tooltip content={<CustomTooltip />} />

            {/* Scenario A - Breakout Zone */}
            {analysis.scenarioA.isActive && (
              <ReferenceArea
                y1={analysis.primaryResistance}
                y2={analysis.primaryResistance + analysis.atr * 0.5}
                fill="rgba(34, 197, 94, 0.15)"
                stroke="rgba(34, 197, 94, 0.5)"
                strokeDasharray="3 3"
              />
            )}

            {/* Scenario B - Pullback Zone */}
            {analysis.scenarioB.isActive && (
              <ReferenceArea
                y1={analysis.primarySupport - analysis.atr * 0.5}
                y2={analysis.primarySupport + analysis.atr * 0.5}
                fill="rgba(59, 130, 246, 0.15)"
                stroke="rgba(59, 130, 246, 0.5)"
                strokeDasharray="3 3"
              />
            )}

            {/* Scenario C - No Trade Zone */}
            {analysis.scenarioC.isActive && (
              <ReferenceArea
                y1={analysis.primarySupport + analysis.atr * 0.5}
                y2={analysis.primaryResistance - analysis.atr * 0.5}
                fill="rgba(239, 68, 68, 0.1)"
                stroke="rgba(239, 68, 68, 0.3)"
                strokeDasharray="5 5"
              />
            )}

            {/* Primary Resistance Line */}
            <ReferenceLine
              y={analysis.primaryResistance}
              stroke="#22c55e"
              strokeWidth={2}
              strokeDasharray="5 5"
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
              strokeDasharray="5 5"
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
                position: 'left',
                fill: '#f59e0b',
                fontSize: 11,
                fontWeight: 'bold',
              }}
            />

            {/* Target lines for active scenario */}
            {analysis.activeScenario === 'A' && analysis.scenarioA.tradingPlan && (
              <>
                <ReferenceLine
                  y={analysis.scenarioA.tradingPlan.target1}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: `T1 ${analysis.scenarioA.tradingPlan.target1.toFixed(2)}`,
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={analysis.scenarioA.tradingPlan.stopLoss}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: `Stop ${analysis.scenarioA.tradingPlan.stopLoss.toFixed(2)}`,
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
              </>
            )}

            {analysis.activeScenario === 'B' && analysis.scenarioB.tradingPlan && (
              <>
                <ReferenceLine
                  y={analysis.scenarioB.tradingPlan.target1}
                  stroke="#10b981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: `T1 ${analysis.scenarioB.tradingPlan.target1.toFixed(2)}`,
                    position: 'right',
                    fill: '#10b981',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={analysis.scenarioB.tradingPlan.stopLoss}
                  stroke="#ef4444"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: `Stop ${analysis.scenarioB.tradingPlan.stopLoss.toFixed(2)}`,
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
              </>
            )}

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for current scenario */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Posisjon i range: </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {analysis.rangePosition.toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">ATR: </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {analysis.atr.toFixed(2)} ({analysis.atrPercent.toFixed(1)}%)
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Struktur: </span>
            <span className="font-bold text-gray-900 dark:text-gray-100 capitalize">
              {analysis.marketStructure}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
