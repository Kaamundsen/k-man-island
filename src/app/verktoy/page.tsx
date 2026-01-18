'use client';

import { useState, useEffect } from 'react';
import { 
  Wrench,
  Shield,
  BookOpen,
  GitCompare,
  Compass,
  Crown,
  Calculator,
  Download
} from 'lucide-react';
import { clsx } from 'clsx';
import { Stock } from '@/lib/types';
import RiskDashboard from '@/components/RiskDashboard';
import TradeJournal from '@/components/TradeJournal';
import StockCompare from '@/components/StockCompare';
import SectorRotation from '@/components/SectorRotation';
import MasterScoreWidget from '@/components/MasterScoreWidget';

type TabId = 'risk' | 'journal' | 'compare' | 'rotation' | 'masterscore';

export default function VerktoyPage() {
  const [activeTab, setActiveTab] = useState<TabId>('risk');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch('/api/stocks');
      if (response.ok) {
        const data = await response.json();
        setStocks(data.stocks);
      }
    } catch (error) {
      console.error('Error fetching stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'risk' as const, label: 'Risk Dashboard', icon: Shield, color: 'from-red-500 to-orange-600' },
    { id: 'masterscore' as const, label: 'Master Score', icon: Crown, color: 'from-yellow-400 to-orange-500' },
    { id: 'journal' as const, label: 'Trade Journal', icon: BookOpen, color: 'from-purple-500 to-indigo-600' },
    { id: 'compare' as const, label: 'Sammenlign', icon: GitCompare, color: 'from-cyan-500 to-blue-600' },
    { id: 'rotation' as const, label: 'Sektorrotasjon', icon: Compass, color: 'from-indigo-500 to-purple-600' },
  ];

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-slate dark:text-white">Verktøy</h1>
            <p className="text-gray-500 dark:text-dark-muted">
              Risiko, journal, sammenligning og mer
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all',
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted hover:bg-gray-200 dark:hover:bg-slate-600'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-brand-emerald border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-dark-muted">Laster data...</p>
        </div>
      ) : (
        <>
          {/* Risk Dashboard */}
          {activeTab === 'risk' && (
            <RiskDashboard stocks={stocks} />
          )}

          {/* Master Score */}
          {activeTab === 'masterscore' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MasterScoreWidget stocks={stocks} limit={15} />
              <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
                <h3 className="text-lg font-bold text-brand-slate dark:text-white mb-4">
                  📊 Om Master Score
                </h3>
                <p className="text-gray-600 dark:text-dark-muted mb-4">
                  Master Score kombinerer flere signalkilder for å gi en helhetlig vurdering av hver aksje.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                    <span className="text-sm">K-Score (Momentum)</span>
                    <span className="font-bold text-brand-emerald">30%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                    <span className="text-sm">Investtech Score</span>
                    <span className="font-bold text-blue-500">20%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                    <span className="text-sm">Analysthus Konsensus</span>
                    <span className="font-bold text-purple-500">20%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                    <span className="text-sm">Teknisk (RSI, R/R)</span>
                    <span className="font-bold text-yellow-500">15%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                    <span className="text-sm">Fundamental (P/E, Yield)</span>
                    <span className="font-bold text-orange-500">15%</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                  <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">💡 Tips</h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Importer Investtech-scorer og analysthus-anbefalinger for mer nøyaktig Master Score.
                    Gå til Analysthus-siden for å legge inn data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trade Journal */}
          {activeTab === 'journal' && (
            <TradeJournal />
          )}

          {/* Stock Compare */}
          {activeTab === 'compare' && (
            <StockCompare stocks={stocks} />
          )}

          {/* Sector Rotation */}
          {activeTab === 'rotation' && (
            <SectorRotation stocks={stocks} />
          )}
        </>
      )}
    </main>
  );
}
