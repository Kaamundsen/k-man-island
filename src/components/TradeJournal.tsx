'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  ChevronRight, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import { Trade } from '@/lib/types';
import { 
  getJournalEntries, 
  saveJournalEntry, 
  updateJournalEntry,
  generateAIAnalysis,
  calculateJournalStats,
  type TradeJournalEntry,
  type JournalStats
} from '@/lib/store/trade-journal';
import { getTrades } from '@/lib/store/local-store';

export default function TradeJournal() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TradeJournalEntry | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setEntries(getJournalEntries().sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
    setStats(calculateJournalStats());
    setTrades(getTrades());
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-700 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'D': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'F': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const emotionalStateEmoji = {
    confident: '😎',
    nervous: '😰',
    fomo: '🏃',
    greedy: '🤑',
    fearful: '😨',
    neutral: '😐',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-slate dark:text-white">Trade Journal</h2>
            <p className="text-gray-500 dark:text-dark-muted">Logg og lær av dine trades</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl font-semibold hover:bg-brand-emerald/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ny logg
        </button>
      </div>

      {/* Stats Overview */}
      {stats && stats.totalTrades > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-surface-border dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-dark-muted mb-1">Trades logget</div>
            <div className="text-2xl font-bold text-brand-slate dark:text-white">{stats.totalTrades}</div>
          </div>
          <div className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-surface-border dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-dark-muted mb-1">Win Rate</div>
            <div className={clsx(
              'text-2xl font-bold',
              stats.winRate >= 50 ? 'text-green-500' : 'text-red-500'
            )}>
              {stats.winRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-surface-border dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-dark-muted mb-1">Snitt avkastning</div>
            <div className={clsx(
              'text-2xl font-bold',
              stats.avgReturn >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {stats.avgReturn >= 0 ? '+' : ''}{stats.avgReturn.toFixed(1)}%
            </div>
          </div>
          <div className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-surface-border dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-dark-muted mb-1">Snitt karakter</div>
            <div className={clsx(
              'text-2xl font-bold',
              stats.avgGrade === 'A' || stats.avgGrade === 'B' ? 'text-green-500' :
              stats.avgGrade === 'C' ? 'text-yellow-500' : 'text-red-500'
            )}>
              {stats.avgGrade}
            </div>
          </div>
          <div className="bg-surface dark:bg-dark-surface rounded-2xl p-4 border border-surface-border dark:border-dark-border">
            <div className="text-xs text-gray-500 dark:text-dark-muted mb-1">Plan-følging</div>
            <div className={clsx(
              'text-2xl font-bold',
              stats.planFollowingRate >= 80 ? 'text-green-500' :
              stats.planFollowingRate >= 50 ? 'text-yellow-500' : 'text-red-500'
            )}>
              {stats.planFollowingRate.toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Common Mistakes */}
      {stats && stats.commonMistakes.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-6 border border-red-200 dark:border-red-900">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-red-700 dark:text-red-400">Vanligste feil</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {stats.commonMistakes.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <span className="font-bold">{m.count}x</span>
                <span>{m.mistake}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal Entries */}
      <div className="bg-surface dark:bg-dark-surface rounded-2xl border border-surface-border dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-surface-border dark:border-dark-border">
          <h3 className="font-bold text-brand-slate dark:text-white">Journal-logg</h3>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 dark:text-dark-muted mb-2">Ingen trades logget ennå</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-brand-emerald hover:underline"
            >
              Logg din første trade →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {entries.map(entry => (
              <div 
                key={entry.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors cursor-pointer"
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Grade */}
                    {entry.aiAnalysis && (
                      <span className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border',
                        getGradeColor(entry.aiAnalysis.grade)
                      )}>
                        {entry.aiAnalysis.grade}
                      </span>
                    )}

                    {/* Ticker & Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-slate dark:text-white">
                          {entry.ticker.replace('.OL', '')}
                        </span>
                        <span className="text-lg">{emotionalStateEmoji[entry.emotionalState]}</span>
                        {entry.followedPlan && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-muted">
                        {new Date(entry.entryDate).toLocaleDateString('nb-NO')} · {entry.entryReason.slice(0, 50)}...
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {entry.returnPercent !== undefined && (
                      <div className={clsx(
                        'text-lg font-bold',
                        entry.returnPercent >= 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {entry.returnPercent >= 0 ? '+' : ''}{entry.returnPercent.toFixed(1)}%
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddJournalModal 
          trades={trades}
          onClose={() => setShowAddModal(false)}
          onSave={loadData}
        />
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <JournalDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdate={loadData}
        />
      )}
    </div>
  );
}

// ============ Add Journal Modal ============

function AddJournalModal({ 
  trades, 
  onClose, 
  onSave 
}: { 
  trades: Trade[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    tradeId: '',
    entryReason: '',
    emotionalState: 'neutral' as TradeJournalEntry['emotionalState'],
    followedPlan: true,
    tags: '',
  });

  const activeTrades = trades.filter(t => !t.exitPrice);

  const handleSubmit = () => {
    const trade = trades.find(t => t.id === formData.tradeId);
    if (!trade) return;

    const entry = saveJournalEntry({
      tradeId: trade.id,
      ticker: trade.ticker,
      stockName: trade.ticker,
      entryDate: trade.entryDate instanceof Date ? trade.entryDate.toISOString() : (trade.entryDate as any),
      entryPrice: trade.entryPrice,
      quantity: trade.quantity,
      entryReason: formData.entryReason,
      emotionalState: formData.emotionalState,
      followedPlan: formData.followedPlan,
      kScoreAtEntry: 60, // TODO: Get actual value
      rsiAtEntry: 50,
      signalAtEntry: 'HOLD',
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
    });

    // Generate AI analysis
    const aiAnalysis = generateAIAnalysis(entry);
    updateJournalEntry(entry.id, { aiAnalysis });

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-bold text-brand-slate dark:text-white">Ny journal-logg</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Trade Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Velg trade
            </label>
            <select
              value={formData.tradeId}
              onChange={(e) => setFormData(f => ({ ...f, tradeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
            >
              <option value="">Velg en trade...</option>
              {activeTrades.map(t => (
                <option key={t.id} value={t.id}>
                  {t.ticker.replace('.OL', '')} - {t.quantity} stk @ {t.entryPrice} kr
                </option>
              ))}
            </select>
          </div>

          {/* Entry Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Hvorfor kjøpte du?
            </label>
            <textarea
              value={formData.entryReason}
              onChange={(e) => setFormData(f => ({ ...f, entryReason: e.target.value }))}
              className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white resize-none"
              placeholder="Beskriv din analyse og begrunnelse..."
            />
          </div>

          {/* Emotional State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Emosjonell tilstand ved kjøp
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['confident', 'nervous', 'fomo', 'greedy', 'fearful', 'neutral'] as const).map(state => (
                <button
                  key={state}
                  onClick={() => setFormData(f => ({ ...f, emotionalState: state }))}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                    formData.emotionalState === state
                      ? 'bg-brand-emerald text-white border-brand-emerald'
                      : 'bg-white dark:bg-dark-bg border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:border-brand-emerald'
                  )}
                >
                  {state === 'confident' && '😎 Trygg'}
                  {state === 'nervous' && '😰 Nervøs'}
                  {state === 'fomo' && '🏃 FOMO'}
                  {state === 'greedy' && '🤑 Grådig'}
                  {state === 'fearful' && '😨 Redd'}
                  {state === 'neutral' && '😐 Nøytral'}
                </button>
              ))}
            </div>
          </div>

          {/* Followed Plan */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="followedPlan"
              checked={formData.followedPlan}
              onChange={(e) => setFormData(f => ({ ...f, followedPlan: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-300"
            />
            <label htmlFor="followedPlan" className="text-sm text-gray-700 dark:text-dark-text">
              Jeg fulgte min handelsplan
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Tags (kommaseparert)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(f => ({ ...f, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              placeholder="swing, momentum, breakout"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg"
          >
            Avbryt
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.tradeId || !formData.entryReason}
            className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-lg font-semibold hover:bg-brand-emerald/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            Lagre & Analyser
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Journal Detail Modal ============

function JournalDetailModal({
  entry,
  onClose,
  onUpdate,
}: {
  entry: TradeJournalEntry;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-700';
      case 'B': return 'bg-blue-100 text-blue-700';
      case 'C': return 'bg-yellow-100 text-yellow-700';
      case 'D': return 'bg-orange-100 text-orange-700';
      case 'F': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-4">
            {entry.aiAnalysis && (
              <span className={clsx(
                'w-14 h-14 rounded-xl flex items-center justify-center font-bold text-2xl',
                getGradeColor(entry.aiAnalysis.grade)
              )}>
                {entry.aiAnalysis.grade}
              </span>
            )}
            <div>
              <h2 className="text-xl font-bold text-brand-slate dark:text-white">
                {entry.ticker.replace('.OL', '')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-muted">
                {new Date(entry.entryDate).toLocaleDateString('nb-NO')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Trade Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-dark-muted">Entry</div>
              <div className="font-bold text-brand-slate dark:text-white">{entry.entryPrice} kr</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-dark-muted">Antall</div>
              <div className="font-bold text-brand-slate dark:text-white">{entry.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-dark-muted">K-Score</div>
              <div className="font-bold text-brand-slate dark:text-white">{entry.kScoreAtEntry}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-dark-muted">Signal</div>
              <div className="font-bold text-brand-slate dark:text-white">{entry.signalAtEntry}</div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="font-bold text-brand-slate dark:text-white mb-2">Begrunnelse</h3>
            <p className="text-gray-600 dark:text-dark-muted bg-gray-50 dark:bg-dark-bg p-4 rounded-xl">
              {entry.entryReason}
            </p>
          </div>

          {/* AI Analysis */}
          {entry.aiAnalysis && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <h3 className="font-bold text-brand-slate dark:text-white">AI-analyse</h3>
              </div>

              {/* Strengths */}
              {entry.aiAnalysis.strengths.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">✅ Styrker</h4>
                  <ul className="space-y-1">
                    {entry.aiAnalysis.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-green-600 dark:text-green-400">{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mistakes */}
              {entry.aiAnalysis.mistakes.length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">⚠️ Feil</h4>
                  <ul className="space-y-1">
                    {entry.aiAnalysis.mistakes.map((m, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-400">{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lessons */}
              {entry.aiAnalysis.lessons.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">📚 Lærdommer</h4>
                  <ul className="space-y-1">
                    {entry.aiAnalysis.lessons.map((l, i) => (
                      <li key={i} className="text-sm text-blue-600 dark:text-blue-400">{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
