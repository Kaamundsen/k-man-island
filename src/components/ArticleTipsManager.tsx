'use client';

import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Plus, 
  X, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Star,
  Calendar,
  Tag,
  Trash2,
  ChevronRight,
  Users,
  BarChart3,
  Pencil,
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  getArticleTips,
  saveArticleTip,
  updateArticleTip,
  deleteArticleTip,
  addInvesttechInsiderList,
  getArticleStats,
  type ArticleTip,
  type StockMention,
  type ArticleSource,
  type MentionType,
  type ArticleStats,
} from '@/lib/store/article-tips';

export default function ArticleTipsManager() {
  const [articles, setArticles] = useState<ArticleTip[]>([]);
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleTip | null>(null);
  const [filterSource, setFilterSource] = useState<ArticleSource | 'alle'>('alle');
  const [editingArticle, setEditingArticle] = useState<ArticleTip | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setArticles(getArticleTips());
    setStats(getArticleStats());
  };

  const handleDelete = (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne artikkelen?')) {
      deleteArticleTip(id);
      loadData();
    }
  };

  const filteredArticles = filterSource === 'alle' 
    ? articles 
    : articles.filter(a => a.source === filterSource);

  const getSentimentIcon = (sentiment: StockMention['sentiment']) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getMentionTypeLabel = (type: MentionType) => {
    switch (type) {
      case 'insider_buy': return 'Innsidekjøp';
      case 'insider_sell': return 'Innsidesalg';
      case 'analyst_upgrade': return 'Oppjustering';
      case 'analyst_downgrade': return 'Nedjustering';
      case 'technical_signal': return 'Teknisk signal';
      case 'news': return 'Nyhet';
      case 'tip': return 'Tips';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Artikkel-tips</h2>
            <p className="text-muted-foreground">Investtech, E24, analytikere</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-semibold hover:bg-purple-200 transition-colors"
          >
            <Star className="w-4 h-4" />
            Investtech-liste
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-emerald text-white rounded-xl font-semibold hover:bg-brand-emerald/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Legg til artikkel
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Artikler</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalArticles}</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Aksje-nevnelser</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalMentions}</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Topp-picks (30d)</div>
            <div className="text-2xl font-bold text-brand-emerald">{stats.recentTopPicks}</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1">Mest nevnt</div>
            <div className="text-lg font-bold text-foreground">
              {stats.mostMentioned[0]?.ticker || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {(['alle', 'Investtech', 'E24', 'DN', 'Finansavisen', 'Newsweb', 'Annet'] as const).map(source => (
          <button
            key={source}
            onClick={() => setFilterSource(source)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterSource === source
                ? source === 'E24'
                  ? 'bg-black text-white'
                  : 'bg-brand-emerald text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {source === 'alle' ? 'Alle' : source}
          </button>
        ))}
      </div>

      {/* Article List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">Ingen artikler lagt til ennå</p>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="text-brand-emerald hover:underline"
            >
              Legg til Investtech-liste →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredArticles.map(article => (
              <div 
                key={article.id}
                className="p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        article.source === 'E24' ? 'bg-[#f5f0eb] text-gray-900 dark:bg-black dark:text-white font-black' :
                        article.source === 'DN' ? 'bg-[#1e1e5c] text-white' :
                        article.source === 'Finansavisen' ? 'bg-[#2b5797] text-white font-bold' :
                        article.source === 'Investtech' ? 'bg-[#f5f5f5] text-[#5a5a5a] dark:bg-[#3a3a4a] dark:text-gray-200' :
                        article.source === 'Newsweb' ? 'bg-[#003366] text-white' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      )}>
                        {article.source}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.publishedDate).toLocaleDateString('nb-NO')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 truncate">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                    
                    {/* Mentions Preview */}
                    <div className="flex flex-wrap gap-1.5">
                      {article.mentions.slice(0, 6).map((mention, i) => (
                        <Link
                          key={i}
                          href={`/analyse/${mention.ticker}.OL`}
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors',
                            mention.isTopPick 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : mention.sentiment === 'positive'
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400'
                              : mention.sentiment === 'negative'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {mention.isTopPick && <Star className="w-3 h-3" />}
                          {mention.ticker}
                        </Link>
                      ))}
                      {article.mentions.length > 6 && (
                        <span className="text-xs text-gray-400">
                          +{article.mentions.length - 6} flere
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-gray-400 hover:text-brand-emerald"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedArticle(article)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg text-gray-400 hover:text-brand-slate dark:hover:text-white"
                      title="Vis detaljer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingArticle(article)}
                      className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-gray-400 hover:text-blue-500"
                      title="Rediger"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-500"
                      title="Slett"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Article Modal */}
      {showAddModal && (
        <AddArticleModal 
          onClose={() => setShowAddModal(false)}
          onSave={loadData}
        />
      )}

      {/* Edit Article Modal */}
      {editingArticle && (
        <AddArticleModal 
          onClose={() => setEditingArticle(null)}
          onSave={loadData}
          editArticle={editingArticle}
        />
      )}

      {/* Quick Add Investtech Modal */}
      {showQuickAdd && (
        <QuickAddInvesttechModal 
          onClose={() => setShowQuickAdd(false)}
          onSave={loadData}
        />
      )}

      {/* Article Detail Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

// ============ Add/Edit Article Modal ============

function AddArticleModal({ 
  onClose, 
  onSave, 
  editArticle 
}: { 
  onClose: () => void; 
  onSave: () => void;
  editArticle?: ArticleTip;
}) {
  // Convert existing mentions to text format for editing
  const existingMentions = editArticle?.mentions
    .map(m => `${m.ticker}: ${m.highlight}`)
    .join('\n') || '';
  
  const [formData, setFormData] = useState({
    title: editArticle?.title || '',
    source: editArticle?.source || 'E24' as ArticleSource,
    url: editArticle?.url || '',
    publishedDate: editArticle?.publishedDate || new Date().toISOString().split('T')[0],
    summary: editArticle?.summary || '',
    tags: editArticle?.tags.join(', ') || '',
    mentions: existingMentions,
  });

  const handleSubmit = () => {
    // Parse mentions
    const mentionLines = formData.mentions.split('\n').filter(l => l.trim());
    const mentions: StockMention[] = mentionLines.map(line => {
      const [ticker, ...rest] = line.split(':');
      const highlight = rest.join(':').trim();
      return {
        ticker: ticker.trim().toUpperCase().replace('.OL', ''),
        stockName: ticker.trim(),
        mentionType: 'tip' as MentionType,
        sentiment: 'positive' as const,
        highlight: highlight || 'Nevnt i artikkelen',
      };
    });

    if (editArticle) {
      // Update existing article
      updateArticleTip(editArticle.id, {
        title: formData.title,
        source: formData.source,
        url: formData.url || undefined,
        publishedDate: formData.publishedDate,
        summary: formData.summary,
        mentions,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      });
    } else {
      // Create new article
      saveArticleTip({
        title: formData.title,
        source: formData.source,
        url: formData.url || undefined,
        publishedDate: formData.publishedDate,
        summary: formData.summary,
        mentions,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      });
    }

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-bold text-brand-slate dark:text-white">
            {editArticle ? '✏️ Rediger artikkel' : '➕ Legg til artikkel'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Tittel</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              placeholder="Investtech: De sterkeste aksjene..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Kilde</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData(f => ({ ...f, source: e.target.value as ArticleSource }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              >
                <option value="Investtech">Investtech</option>
                <option value="E24">E24</option>
                <option value="DN">DN</option>
                <option value="Finansavisen">Finansavisen</option>
                <option value="Newsweb">Newsweb</option>
                <option value="Annet">Annet</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Dato</label>
              <input
                type="date"
                value={formData.publishedDate}
                onChange={(e) => setFormData(f => ({ ...f, publishedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">URL (valgfritt)</label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(f => ({ ...f, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              placeholder="https://e24.no/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Oppsummering</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(f => ({ ...f, summary: e.target.value }))}
              className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white resize-none"
              placeholder="Kort oppsummering av artikkelen..."
            />
          </div>

          {/* Full tekst - kun ved redigering */}
          {editArticle?.fullText && (
            <details className="border border-gray-200 dark:border-dark-border rounded-lg">
              <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg">
                📄 Vis full artikkel-tekst ({editArticle.fullText.length.toLocaleString()} tegn)
              </summary>
              <div className="p-3 bg-gray-50 dark:bg-dark-bg max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                  {editArticle.fullText}
                </pre>
              </div>
            </details>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Aksjer nevnt (én per linje: TICKER: highlight)
            </label>
            <textarea
              value={formData.mentions}
              onChange={(e) => setFormData(f => ({ ...f, mentions: e.target.value }))}
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white resize-none font-mono text-sm"
              placeholder="ORKLA: 5 innsidekjøp, CEO kjøpte for 1,6 mill
VOW: 14 innsidekjøp siste 12 mnd
KITRON: Maksimalt positiv på innsiderangering"
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
            disabled={!formData.title || !formData.summary}
            className="px-4 py-2 bg-brand-emerald text-white rounded-lg font-semibold hover:bg-brand-emerald/90 disabled:opacity-50"
          >
            {editArticle ? 'Oppdater' : 'Lagre'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Quick Add Investtech Modal ============

function QuickAddInvesttechModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: 'Ukens Investtech: De sterkeste aksjene på innsidehandler',
    url: '',
    summary: '',
    stockList: '',
    topPicks: '', // Kommaseparert liste over tickers som er "særdeles spennende"
  });

  const handleSubmit = () => {
    const stockLines = formData.stockList.split('\n').filter(l => l.trim());
    const topPickTickers = formData.topPicks.split(',').map(t => t.trim().toUpperCase());

    const stocks = stockLines.map(line => {
      // Format kan være "TICKER" eller "TICKER - Navn" eller "TICKER: highlight"
      const match = line.match(/^([A-ZÆØÅa-zæøå0-9]+)(?:\s*[-:]\s*(.+))?$/);
      if (match) {
        const ticker = match[1].toUpperCase();
        const rest = match[2] || '';
        return {
          ticker,
          name: rest || ticker,
          highlight: 'Maksimalt positiv på Investtechs innsidehandelrangering',
          isTopPick: topPickTickers.includes(ticker),
        };
      }
      return null;
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    addInvesttechInsiderList({
      date: formData.date,
      title: formData.title,
      url: formData.url || undefined,
      summary: formData.summary || `${stocks.length} aksjer med maksimal positiv innsidehandel-score.`,
      stocks,
    });

    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <h2 className="text-xl font-bold text-brand-slate dark:text-white">Investtech Topp-liste</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl">
            <p className="text-sm text-purple-700 dark:text-purple-400">
              Lim inn listen med aksjer som er maksimalt positive på Investtechs innsiderantering.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">Dato</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">URL (valgfritt)</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(f => ({ ...f, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Aksjeliste (én per linje)
            </label>
            <textarea
              value={formData.stockList}
              onChange={(e) => setFormData(f => ({ ...f, stockList: e.target.value }))}
              className="w-full h-48 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white resize-none font-mono text-sm"
              placeholder="Golden Energy Offshore Services ASA
Kitron
Orkla ASA
Public Property Invest
Pyrum Innovations
Saga Pure
SmartCraft
Tekna Holding ASA
Vow
Zelluna ASA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Topp-picks / særdeles spennende (kommaseparert)
            </label>
            <input
              type="text"
              value={formData.topPicks}
              onChange={(e) => setFormData(f => ({ ...f, topPicks: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white"
              placeholder="ORKLA, VOW, PPINV"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              Ekstra kommentar (valgfritt)
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData(f => ({ ...f, summary: e.target.value }))}
              className="w-full h-16 px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-brand-slate dark:text-white resize-none"
              placeholder="Ti selskaper får toppscore, tre virker særdeles spennende."
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
            disabled={!formData.stockList.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            <Star className="w-4 h-4" />
            Lagre Investtech-liste
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Article Detail Modal ============

function ArticleDetailModal({ article, onClose }: { article: ArticleTip; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {article.source}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(article.publishedDate).toLocaleDateString('nb-NO')}
              </span>
            </div>
            <h2 className="text-xl font-bold text-brand-slate dark:text-white">{article.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="font-semibold text-brand-slate dark:text-white mb-2">Oppsummering</h3>
            <p className="text-gray-600 dark:text-dark-muted">{article.summary}</p>
          </div>

          {/* Full Text */}
          {article.fullText && (
            <details className="border border-gray-200 dark:border-dark-border rounded-lg">
              <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-border rounded-lg">
                📄 Full artikkel-tekst ({article.fullText.length.toLocaleString()} tegn)
              </summary>
              <div className="p-3 bg-gray-50 dark:bg-dark-bg max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">
                  {article.fullText}
                </pre>
              </div>
            </details>
          )}

          {/* Mentions */}
          <div>
            <h3 className="font-semibold text-brand-slate dark:text-white mb-3">
              Aksjer nevnt ({article.mentions.length})
            </h3>
            <div className="space-y-2">
              {article.mentions.map((mention, i) => (
                <Link
                  key={i}
                  href={`/analyse/${mention.ticker}.OL`}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors group"
                >
                  <div className={clsx(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    mention.isTopPick ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                    mention.sentiment === 'positive' ? 'bg-green-100 dark:bg-green-900/30' :
                    mention.sentiment === 'negative' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    {mention.isTopPick ? (
                      <Star className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : mention.sentiment === 'positive' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : mention.sentiment === 'negative' ? (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-brand-slate dark:text-white group-hover:text-brand-emerald">
                        {mention.ticker}
                      </span>
                      {mention.isTopPick && (
                        <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                          Topp-pick
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{mention.stockName}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-muted">{mention.highlight}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-emerald flex-shrink-0 mt-3" />
                </Link>
              ))}
            </div>
          </div>

          {/* URL */}
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-brand-emerald hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Les hele artikkelen
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
