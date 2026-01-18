'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface StockAnalysisProfile {
  ticker: string;
  avgDailyMove: number;
  maxDailyGain: number;
  maxDailyLoss: number;
  spikeDays: number;
  spikeFrequency: 'low' | 'medium' | 'high';
  bestMonths: { month: string; avgReturn: number }[];
  worstMonths: { month: string; avgReturn: number }[];
  return1m: number;
  return3m: number;
  return6m: number;
  return12m: number;
  currentVsSMA50: number;
  currentVsSMA200: number;
  distanceFrom52wHigh: number;
  distanceFrom52wLow: number;
}

interface AnalysisResult {
  ticker: string;
  name: string;
  profile: StockAnalysisProfile;
  kScore: number;
  isSpikeStock: boolean;
  seasonal: {
    recommendation: 'buy' | 'hold' | 'avoid';
    reason: string;
  };
  lastUpdated: string;
}

interface StockProfileSectionProps {
  ticker: string;
}

export default function StockProfileSection({ ticker }: StockProfileSectionProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analysis/${ticker}`);
        if (!response.ok) {
          throw new Error('Kunne ikke hente analyse');
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ukjent feil');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
            <div className="h-24 bg-gray-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="text-center text-gray-500 py-8">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p>{error || 'Ingen data tilgjengelig'}</p>
          <p className="text-sm mt-2">Historisk analyse krever minst 50 dagers data</p>
        </div>
      </div>
    );
  }

  const { profile, kScore, isSpikeStock, seasonal } = analysis;

  const seasonalColor = {
    buy: 'bg-green-100 text-green-800 border-green-200',
    hold: 'bg-gray-100 text-gray-800 border-gray-200',
    avoid: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="space-y-6">
      {/* K-Score & Spike Status */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Aksje-profil</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* K-Score */}
          <div className="bg-gradient-to-br from-brand-emerald to-emerald-600 rounded-xl p-4 text-white">
            <p className="text-sm opacity-80">K-Score</p>
            <p className="text-3xl font-bold">{kScore}</p>
            <p className="text-xs opacity-70">av 100</p>
          </div>
          
          {/* Spike Status */}
          <div className={clsx(
            'rounded-xl p-4',
            isSpikeStock ? 'bg-orange-100' : 'bg-gray-100'
          )}>
            <p className="text-sm text-gray-600">Spike-aksje</p>
            <div className="flex items-center gap-2 mt-1">
              {isSpikeStock ? (
                <>
                  <Zap className="w-6 h-6 text-orange-500" />
                  <span className="font-bold text-orange-700">JA</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">📊</span>
                  <span className="font-bold text-gray-700">Nei</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{profile.spikeDays} spike-dager/år</p>
          </div>
          
          {/* Avg Daily Move */}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Snitt daglig</p>
            <p className="text-2xl font-bold text-blue-700">±{profile.avgDailyMove}%</p>
            <p className="text-xs text-gray-500">volatilitet</p>
          </div>
          
          {/* Max Spike */}
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-gray-600">Maks enkeltdag</p>
            <p className="text-2xl font-bold text-green-600">+{profile.maxDailyGain}%</p>
            <p className="text-xs text-red-500">{profile.maxDailyLoss}%</p>
          </div>
        </div>

        {/* Seasonal */}
        <div className={clsx(
          'rounded-xl p-4 border',
          seasonalColor[seasonal.recommendation]
        )}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5" />
            <span className="font-semibold">Sesong-anbefaling</span>
          </div>
          <p className="text-sm">{seasonal.reason}</p>
        </div>
      </div>

      {/* Momentum */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Momentum</h3>
        
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '1 mnd', value: profile.return1m },
            { label: '3 mnd', value: profile.return3m },
            { label: '6 mnd', value: profile.return6m },
            { label: '12 mnd', value: profile.return12m },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-sm text-gray-500">{label}</p>
              <p className={clsx(
                'text-xl font-bold',
                value >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {value >= 0 ? '+' : ''}{value}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Trend-indikatorer</h3>
        
        <div className="space-y-3">
          {/* SMA50 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Pris vs SMA50</span>
            <div className="flex items-center gap-2">
              {profile.currentVsSMA50 > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={clsx(
                'font-semibold',
                profile.currentVsSMA50 >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {profile.currentVsSMA50 >= 0 ? '+' : ''}{profile.currentVsSMA50}%
              </span>
            </div>
          </div>
          
          {/* SMA200 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Pris vs SMA200</span>
            <div className="flex items-center gap-2">
              {profile.currentVsSMA200 > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className={clsx(
                'font-semibold',
                profile.currentVsSMA200 >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {profile.currentVsSMA200 >= 0 ? '+' : ''}{profile.currentVsSMA200}%
              </span>
            </div>
          </div>
          
          {/* 52w High */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Fra 52-ukers høy</span>
            <span className="font-semibold text-gray-700">{profile.distanceFrom52wHigh}%</span>
          </div>
          
          {/* 52w Low */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Fra 52-ukers lav</span>
            <span className="font-semibold text-green-600">+{profile.distanceFrom52wLow}%</span>
          </div>
        </div>
      </div>

      {/* Best/Worst Months */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Sesongmønstre</h3>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Best Months */}
          <div>
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Beste måneder
            </p>
            <div className="space-y-2">
              {profile.bestMonths.map(m => (
                <div key={m.month} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-green-800 uppercase">{m.month}</span>
                  <span className="text-green-600 font-bold">+{m.avgReturn.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Worst Months */}
          <div>
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Svakeste måneder
            </p>
            <div className="space-y-2">
              {profile.worstMonths.map(m => (
                <div key={m.month} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-red-800 uppercase">{m.month}</span>
                  <span className="text-red-600 font-bold">{m.avgReturn.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
