'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus,
  Upload,
  BarChart3,
  Trophy,
  AlertTriangle,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  getAnalystRecommendations,
  saveAnalystRecommendation,
  bulkImportRecommendations,
  calculateAnalystPerformance,
  getAllConsensus,
  getInvesttechScores,
  bulkUpdateInvesttechScores,
  type AnalystRecommendation,
  type AnalystSource,
  type RecommendationType,
  type ConsensusResult,
  type AnalystPerformance,
  type BulkImportData,
  type InvesttechScore,
} from '@/lib/store/analyst-store';

// ============ MAIN COMPONENT ============

export default function AnalystTracker() {
  const [activeTab, setActiveTab] = useState<'consensus' | 'recommendations' | 'performance' | 'import'>('consensus');
  const [recommendations, setRecommendations] = useState<AnalystRecommendation[]>([]);
  const [consensus, setConsensus] = useState<ConsensusResult[]>([]);
  const [performance, setPerformance] = useState<AnalystPerformance[]>([]);
  const [investtechScores, setInvesttechScores] = useState<InvesttechScore[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRecommendations(getAnalystRecommendations());
    setConsensus(getAllConsensus());
    setPerformance(calculateAnalystPerformance());
    setInvesttechScores(getInvesttechScores());
  };

  const getActionColor = (action: RecommendationType) => {
    switch (action) {
      case 'KJØP': return 'text-green-600 bg-green-50';
      case 'SELG': return 'text-red-600 bg-red-50';
      case 'HOLD':
      case 'BEHOLDES': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConsensusColor = (consensus: ConsensusResult['consensus']) => {
    switch (consensus) {
      case 'STERK_KJØP': return 'text-green-700 bg-green-100 border-green-300';
      case 'KJØP': return 'text-green-600 bg-green-50 border-green-200';
      case 'HOLD': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'SELG': return 'text-red-600 bg-red-50 border-red-200';
      case 'STERK_SELG': return 'text-red-700 bg-red-100 border-red-300';
      case 'BLANDET': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-surface-border dark:border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-slate dark:text-white">Analysthus-Tracker</h2>
              <p className="text-sm text-gray-500 dark:text-dark-muted">DNB Markets · Delphi · Investtech</p>
            </div>
          </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl font-semibold hover:bg-brand-emerald/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Importer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border dark:border-dark-border">
        {[
          { id: 'consensus', label: 'Konsensus', count: consensus.length },
          { id: 'recommendations', label: 'Anbefalinger', count: recommendations.filter(r => !r.closed).length },
          { id: 'performance', label: 'Treffsikkerhet', count: performance.length },
          { id: 'import', label: 'Investtech', count: investtechScores.length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={clsx(
              'flex-1 px-4 py-3 text-sm font-semibold transition-colors',
              activeTab === tab.id
                ? 'text-brand-emerald border-b-2 border-brand-emerald bg-green-50/50 dark:bg-green-950/20'
                : 'text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-white'
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Consensus Tab */}
        {activeTab === 'consensus' && (
          <div className="space-y-3">
            {consensus.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-dark-muted">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ingen anbefalinger importert ennå</p>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="mt-4 text-brand-emerald hover:underline"
                >
                  Importer første anbefaling →
                </button>
              </div>
            ) : (
              consensus.map(item => (
                <Link
                  key={item.ticker}
                  href={`/analyse/${item.ticker}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      'px-3 py-1.5 rounded-lg border font-bold text-sm',
                      getConsensusColor(item.consensus)
                    )}>
                      {item.consensus.replace('_', ' ')}
                    </div>
                    <div>
                      <div className="font-bold text-brand-slate dark:text-white group-hover:text-brand-emerald transition-colors">
                        {item.ticker.replace('.OL', '')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">
                        {item.stockName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-dark-muted">
                        {item.recommendations.length} kilder
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.agreementLevel.toFixed(0)}% enighet
                      </div>
                    </div>
                    {item.avgTargetPrice && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-brand-slate dark:text-white">
                          Mål: {item.avgTargetPrice.toFixed(2)} kr
                        </div>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-emerald transition-colors" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-2">
            {recommendations.filter(r => !r.closed).length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-dark-muted">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ingen aktive anbefalinger</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-dark-muted uppercase">
                      <th className="pb-3 font-medium">Kilde</th>
                      <th className="pb-3 font-medium">Aksje</th>
                      <th className="pb-3 font-medium">Signal</th>
                      <th className="pb-3 font-medium text-right">Pris ved anbef.</th>
                      <th className="pb-3 font-medium text-right">Kursmål</th>
                      <th className="pb-3 font-medium text-right">Dato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                    {recommendations.filter(r => !r.closed).map(rec => (
                      <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-dark-border">
                        <td className="py-3">
                          <span className="text-sm font-medium text-brand-slate dark:text-white">
                            {rec.source}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link 
                            href={`/analyse/${rec.ticker}`}
                            className="text-sm font-bold text-brand-slate dark:text-white hover:text-brand-emerald"
                          >
                            {rec.ticker.replace('.OL', '')}
                          </Link>
                          <div className="text-xs text-gray-500 dark:text-dark-muted">{rec.stockName}</div>
                        </td>
                        <td className="py-3">
                          <span className={clsx(
                            'px-2 py-1 rounded text-xs font-bold',
                            getActionColor(rec.action)
                          )}>
                            {rec.action}
                          </span>
                        </td>
                        <td className="py-3 text-right text-sm text-brand-slate dark:text-white">
                          {rec.priceAtRecommendation.toFixed(2)} kr
                        </td>
                        <td className="py-3 text-right text-sm text-brand-slate dark:text-white">
                          {rec.targetPrice ? `${rec.targetPrice.toFixed(2)} kr` : '-'}
                        </td>
                        <td className="py-3 text-right text-xs text-gray-500 dark:text-dark-muted">
                          {new Date(rec.dateRecommended).toLocaleDateString('nb-NO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-4">
            {performance.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-dark-muted">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Ingen lukkede anbefalinger å analysere</p>
                <p className="text-xs mt-2">Lukk anbefalinger for å se treffsikkerhet</p>
              </div>
            ) : (
              performance.map(perf => (
                <div 
                  key={perf.source}
                  className="bg-gray-50 dark:bg-dark-bg rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-brand-slate dark:text-white text-lg">
                      {perf.source}
                    </h3>
                    <div className={clsx(
                      'px-3 py-1 rounded-full text-sm font-bold',
                      perf.winRate >= 60 ? 'bg-green-100 text-green-700' :
                      perf.winRate >= 45 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {perf.winRate.toFixed(0)}% win rate
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">Anbefalinger</div>
                      <div className="text-xl font-bold text-brand-slate dark:text-white">
                        {perf.totalRecommendations}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">Vinnere / Tapere</div>
                      <div className="text-xl font-bold">
                        <span className="text-green-600">{perf.winCount}</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600">{perf.lossCount}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">Snitt avkastning</div>
                      <div className={clsx(
                        'text-xl font-bold',
                        perf.avgReturn >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {perf.avgReturn >= 0 ? '+' : ''}{perf.avgReturn.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">Snitt holdetid</div>
                      <div className="text-xl font-bold text-brand-slate dark:text-white">
                        {perf.avgHoldingDays.toFixed(0)} dager
                      </div>
                    </div>
                  </div>

                  {(perf.bestPick || perf.worstPick) && (
                    <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-dark-border">
                      {perf.bestPick && (
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                            <Trophy className="w-3 h-3" />
                            Beste pick
                          </div>
                          <div className="font-bold text-brand-slate dark:text-white">
                            {perf.bestPick.ticker.replace('.OL', '')} 
                            <span className="text-green-600 ml-2">+{perf.bestPick.return.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                      {perf.worstPick && (
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            Verste pick
                          </div>
                          <div className="font-bold text-brand-slate dark:text-white">
                            {perf.worstPick.ticker.replace('.OL', '')} 
                            <span className="text-red-600 ml-2">{perf.worstPick.return.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Investtech Tab */}
        {activeTab === 'import' && (
          <InvesttechPanel 
            scores={investtechScores} 
            onUpdate={loadData} 
          />
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal 
          onClose={() => setShowImportModal(false)} 
          onImport={loadData}
        />
      )}
    </div>
  );
}

// ============ INVESTTECH PANEL ============

function InvesttechPanel({ 
  scores, 
  onUpdate 
}: { 
  scores: InvesttechScore[];
  onUpdate: () => void;
}) {
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    try {
      setImporting(true);
      // Parse format: "TICKER,SCORE,TREND" per line
      const lines = importText.trim().split('\n').filter(l => l.trim());
      const newScores: Array<Omit<InvesttechScore, 'dateUpdated'>> = [];

      for (const line of lines) {
        const parts = line.split(/[,\t;]/).map(p => p.trim());
        if (parts.length >= 2) {
          let ticker = parts[0].toUpperCase();
          if (!ticker.endsWith('.OL')) ticker += '.OL';
          
          newScores.push({
            ticker,
            totalScore: parseInt(parts[1]) || 0,
            trend: (parts[2]?.toLowerCase() || 'sidelengs') as InvesttechScore['trend'],
            support: parts[3] ? parseFloat(parts[3]) : undefined,
            resistance: parts[4] ? parseFloat(parts[4]) : undefined,
          });
        }
      }

      if (newScores.length > 0) {
        bulkUpdateInvesttechScores(newScores);
        setImportText('');
        onUpdate();
        alert(`Importerte ${newScores.length} Investtech-scorer`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Feil ved import. Sjekk formatet.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import area */}
      <div className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4">
        <h3 className="font-bold text-brand-slate dark:text-white mb-2">
          Importer Investtech-scorer
        </h3>
        <p className="text-xs text-gray-500 dark:text-dark-muted mb-3">
          Format: TICKER, SCORE, TREND (per linje)<br/>
          Eksempel: MING, 96, stigende
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="MING, 96, stigende&#10;KID, 96, stigende&#10;VAR, 95, stigende"
          className="w-full h-32 p-3 text-sm bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg resize-none"
        />
        <button
          onClick={handleImport}
          disabled={!importText.trim() || importing}
          className="mt-3 px-4 py-2 bg-brand-emerald text-white rounded-lg font-semibold text-sm hover:bg-brand-emerald/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importerer...' : 'Importer Investtech-scorer'}
        </button>
      </div>

      {/* Scores list */}
      {scores.length > 0 && (
        <div>
          <h3 className="font-bold text-brand-slate dark:text-white mb-3">
            Investtech Toppliste ({scores.length})
          </h3>
          <div className="space-y-2">
            {scores
              .sort((a, b) => b.totalScore - a.totalScore)
              .slice(0, 20)
              .map((score, index) => (
                <Link
                  key={score.ticker}
                  href={`/analyse/${score.ticker}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-bg rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                      index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-dark-muted'
                    )}>
                      {index + 1}
                    </span>
                    <div>
                      <div className="font-bold text-brand-slate dark:text-white group-hover:text-brand-emerald transition-colors">
                        {score.ticker.replace('.OL', '')}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-muted">
                        {score.trend === 'stigende' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {score.trend === 'fallende' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {score.trend === 'sidelengs' && <Minus className="w-3 h-3 text-yellow-500" />}
                        <span className="capitalize">{score.trend}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'px-3 py-1 rounded-lg font-bold text-lg',
                      score.totalScore >= 90 ? 'bg-green-100 text-green-700' :
                      score.totalScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {score.totalScore}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-emerald transition-colors" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ IMPORT MODAL ============

function ImportModal({ 
  onClose, 
  onImport 
}: { 
  onClose: () => void;
  onImport: () => void;
}) {
  const [source, setSource] = useState<AnalystSource>('DNB Markets');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    try {
      setImporting(true);
      
      // Try to parse as JSON array first
      let recommendations: BulkImportData['recommendations'] = [];
      
      try {
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed)) {
          recommendations = parsed;
        } else if (parsed.recommendations) {
          recommendations = parsed.recommendations;
        }
      } catch {
        // If not JSON, try to parse as simple text format
        // Format: TICKER, AKSJENAVN, SIGNAL, PRIS, KURSMÅL
        const lines = jsonText.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
        
        for (const line of lines) {
          const parts = line.split(/[,\t;]/).map(p => p.trim());
          if (parts.length >= 4) {
            let ticker = parts[0].toUpperCase();
            if (!ticker.endsWith('.OL')) ticker += '.OL';
            
            recommendations.push({
              ticker,
              stockName: parts[1] || ticker,
              action: (parts[2]?.toUpperCase() || 'HOLD') as RecommendationType,
              price: parseFloat(parts[3]) || 0,
              targetPrice: parts[4] ? parseFloat(parts[4]) : undefined,
            });
          }
        }
      }

      if (recommendations.length === 0) {
        alert('Ingen anbefalinger funnet. Sjekk formatet.');
        return;
      }

      const imported = bulkImportRecommendations({
        source,
        date,
        recommendations,
      });

      alert(`Importerte ${imported} anbefalinger fra ${source}`);
      onImport();
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      alert('Feil ved import. Sjekk formatet.');
    } finally {
      setImporting(false);
    }
  };

  const exampleFormat = `# Format: TICKER, NAVN, SIGNAL, PRIS, KURSMÅL
VAR, Vår Energi, BEHOLDES, 33.71, 39.30
PROTCT, Protector, BEHOLDES, 281.50, 283.00
AKRBP, Aker BP, BEHOLDES, 219.90, 256.10
NRC, Norconsult, KJØP, 42.15, 43.50
STB, Storebrand, SELG, 121.30, 122.50`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-bold text-brand-slate dark:text-white">
            Importer Anbefalinger
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Source & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Kilde
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as AnalystSource)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              >
                <option value="DNB Markets">DNB Markets</option>
                <option value="Delphi Fondene">Delphi Fondene</option>
                <option value="Investtech">Investtech</option>
                <option value="Arctic">Arctic Securities</option>
                <option value="Carnegie">Carnegie</option>
                <option value="Pareto">Pareto Securities</option>
                <option value="ABG">ABG Sundal Collier</option>
                <option value="Annet">Annet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Dato for anbefalingene
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              />
            </div>
          </div>

          {/* Text input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Anbefalinger (CSV eller JSON)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={exampleFormat}
              className="w-full h-64 p-3 text-sm font-mono bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-dark-muted mt-2">
              Formater: TICKER, NAVN, SIGNAL, PRIS, KURSMÅL (en per linje) eller JSON-array
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg font-medium transition-colors"
          >
            Avbryt
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonText.trim() || importing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-lg font-semibold hover:bg-brand-emerald/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importerer...' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  );
}
