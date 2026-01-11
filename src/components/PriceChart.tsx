'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceChartProps {
  data: Array<{
    date: string;
    price: number;
  }>;
  target: number;
  stopLoss: number;
  currentPrice: number;
}

export default function PriceChart({ data, target, stopLoss, currentPrice }: PriceChartProps) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface-border">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-brand-slate mb-2">Prisutvikling & Volum</h3>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-brand-emerald"></div>
            <span className="text-gray-600">Pris</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-green-400 border-2 border-green-400"></div>
            <span className="text-gray-600">Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-400 border-2 border-red-400"></div>
            <span className="text-gray-600">Stop Loss</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickLine={false}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <ReferenceLine 
            y={target} 
            stroke="#22c55e" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'Target', position: 'right', fill: '#22c55e', fontSize: 12 }}
          />
          <ReferenceLine 
            y={stopLoss} 
            stroke="#ef4444" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'Stop', position: 'right', fill: '#ef4444', fontSize: 12 }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
