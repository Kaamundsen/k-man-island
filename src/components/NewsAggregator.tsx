'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Tag,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import { type NewsItem } from '@/lib/api/news-feeds';
import { getArticleTips, type ArticleTip } from '@/lib/store/article-tips';

// 🎨 Kilde-branding (farger basert på logoer)
const SOURCE_BRANDING: Record<string, { color: string; bgColor: string; darkBg: string; name: string; textStyle?: string }> = {
  'E24': { 
    color: 'text-gray-900', 
    bgColor: 'bg-[#f5f0eb]',  // Lys beige som logo
    darkBg: 'dark:bg-black dark:text-white',  // Sort bakgrunn, hvit tekst i dark mode
    name: 'E24',
    textStyle: 'font-black',
  },
  'DN': { 
    color: 'text-white', 
    bgColor: 'bg-[#1e1e5c]',  // Mørk navy blå (Dine Penger-stil)
    darkBg: 'dark:bg-[#1e1e5c] dark:text-white',
    name: 'DN',
  },
  'Dine Penger': { 
    color: 'text-white', 
    bgColor: 'bg-[#1e1e5c]',  // Mørk navy blå
    darkBg: 'dark:bg-[#1e1e5c] dark:text-white',
    name: 'Dine Penger',
  },
  'Finansavisen': { 
    color: 'text-white', 
    bgColor: 'bg-[#2b5797]',  // Blå som logo
    darkBg: 'dark:bg-[#2b5797] dark:text-white',
    name: 'Finansavisen',
    textStyle: 'font-bold',
  },
  'Investornytt': { 
    color: 'text-[#3d3d5c]', 
    bgColor: 'bg-[#f5f0eb]',  // Lys beige
    darkBg: 'dark:bg-[#2a2a3d] dark:text-gray-200',  // Mørk bakgrunn i dark mode
    name: 'Investornytt',
    textStyle: 'font-semibold',
  },
  'Investtech': { 
    color: 'text-[#5a5a5a]',  // Grå som "invest" 
    bgColor: 'bg-[#f5f5f5]',  // Lys grå bakgrunn
    darkBg: 'dark:bg-[#3a3a4a] dark:text-gray-200',  // Mørk bakgrunn i dark mode
    name: 'Investtech',
    textStyle: 'font-semibold',
    // Logo: grå + oransje (#e86c1f)
  },
  'Newsweb': { 
    color: 'text-white', 
    bgColor: 'bg-[#003366]',  // Oslo Børs mørk blå
    darkBg: 'dark:bg-[#003366] dark:text-white',
    name: 'Newsweb',
  },
  'Nordnet': { 
    color: 'text-white', 
    bgColor: 'bg-[#0046be]',  // Nordnet blå
    darkBg: 'dark:bg-[#0046be] dark:text-white',
    name: 'Nordnet',
  },
  'Annet': { 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-200', 
    darkBg: 'dark:bg-gray-700 dark:text-gray-300',
    name: 'Annet',
  },
};

// Kombiner RSS-nyheter med manuelle artikler
interface CombinedNewsItem extends NewsItem {
  isManual?: boolean;
  fullSummary?: string;
  articleId?: string;
}

interface NewsAggregatorProps {
  ticker?: string; // Valgfritt - filter på spesifikk aksje
  showLinks?: boolean;
  compact?: boolean;
  maxItems?: number;
}

export function NewsAggregator({ 
  ticker, 
  showLinks = true, 
  compact = false,
  maxItems = 15 
}: NewsAggregatorProps) {
  const [news, setNews] = useState<CombinedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  
  
  // Tilgjengelige kilder basert på nyheter vi har
  const availableSources = Array.from(new Set(news.map(n => n.source))).sort();
  
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  
  const fetchNews = useCallback(async (forceRefresh: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Hent RSS-nyheter
      const params = new URLSearchParams();
      if (ticker) params.set('ticker', ticker.replace('.OL', ''));
      if (forceRefresh) params.set('refresh', 'true');
      
      const response = await fetch(`/api/news-aggregator?${params.toString()}`);
      const data = await response.json();
      
      let allNews: CombinedNewsItem[] = [];
      
      // Legg til RSS-nyheter
      if (data.news) {
        allNews = data.news.map((item: NewsItem) => ({
          ...item,
          isManual: false,
        }));
      }
      
      // Legg til manuelle artikler fra localStorage
      const manualArticles = getArticleTips();
      const manualNews: CombinedNewsItem[] = manualArticles
        .filter(article => {
          // Filtrer på ticker hvis spesifisert
          if (ticker) {
            const cleanTicker = ticker.replace('.OL', '').toUpperCase();
            return article.mentions.some(m => 
              m.ticker.toUpperCase() === cleanTicker ||
              m.ticker.toUpperCase() + '.OL' === ticker.toUpperCase()
            );
          }
          return true;
        })
        .map(article => ({
          id: article.id,
          title: article.title,
          summary: article.summary.slice(0, 150) + (article.summary.length > 150 ? '...' : ''),
          fullSummary: article.summary,
          source: article.source,
          url: article.url || '',
          publishedAt: new Date(article.publishedDate),
          tickers: article.mentions.map(m => m.ticker),
          category: 'general' as const,
          sentiment: article.mentions[0]?.sentiment || 'neutral',
          isManual: true,
          articleId: article.id,
        }));
      
      // Kombiner RSS og manuelle artikler
      const combined = [...allNews, ...manualNews];
      
      // 🔄 Dedupliser basert på tittel-likhet (fjern RSS hvis manuell finnes)
      const deduped: CombinedNewsItem[] = [];
      const seenTitles = new Set<string>();
      
      // Prioriter manuelle artikler (de har ofte bedre sammendrag)
      const sortedByManual = combined.sort((a, b) => {
        // Manuelle først, så etter dato
        if (a.isManual && !b.isManual) return -1;
        if (!a.isManual && b.isManual) return 1;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
      
      for (const item of sortedByManual) {
        // Normaliser tittel for sammenligning (lowercase, fjern spesialtegn)
        const normalizedTitle = item.title.toLowerCase()
          .replace(/[^a-zæøå0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Sjekk om lignende tittel allerede finnes (første 50 tegn)
        const titleKey = normalizedTitle.slice(0, 50);
        
        if (!seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          deduped.push(item);
        }
      }
      
      // Sorter etter dato
      deduped.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      setNews(deduped);
      setLastUpdated(new Date());
      
    } catch (e) {
      console.error('News fetch error:', e);
      setError('Feil ved henting av nyheter');
    } finally {
      setLoading(false);
    }
  }, [ticker]);
  
  useEffect(() => {
    fetchNews(false);
    
    // Lytt etter endringer i localStorage (når nye artikler legges til)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'k-man-article-tips') {
        fetchNews(false);
      }
    };
    
    // Lytt også etter custom event fra samme vindu
    const handleArticleUpdate = () => {
      fetchNews(false);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('article-tips-updated', handleArticleUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('article-tips-updated', handleArticleUpdate);
    };
  }, [fetchNews]);
  
  // 🔧 useMemo for å sikre korrekt filtrering ved state-endringer
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      // Kategori-filter
      if (filter !== 'all') {
        if (filter === 'manual' && !item.isManual) return false;
        if (filter !== 'manual' && item.category !== filter) return false;
      }
      // Kilde-filter (eksakt match på source)
      if (sourceFilter !== 'all') {
        if (item.source !== sourceFilter) {
          return false;
        }
      }
      return true;
    }).slice(0, maxItems);
  }, [news, filter, sourceFilter, maxItems]);
  
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      insider: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      earnings: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      analyst: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      announcement: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      general: 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400',
    };
    
    const labels: Record<string, string> = {
      insider: 'Innsidehandel',
      earnings: 'Resultat',
      analyst: 'Analytiker',
      announcement: 'Børsmelding',
      general: 'Nyhet',
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[category] || colors.general}`}>
        {labels[category] || category}
      </span>
    );
  };
  
  // 🎨 Kilde-badge med branding
  const getSourceBadge = (source: string, isManual?: boolean) => {
    const branding = SOURCE_BRANDING[source] || SOURCE_BRANDING['Annet'];
    
    // Spesialhåndtering for Investtech (tofarget tekst som logo)
    if (source === 'Investtech') {
      return (
        <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full font-semibold
          ${branding.bgColor} ${branding.darkBg}`}>
          <span className="text-[#5a5a5a]">invest</span>
          <span className="text-[#e86c1f]">tech</span>
          {isManual && (
            <span title="Manuelt lagt inn"><User className="h-3 w-3 ml-1" /></span>
          )}
        </span>
      );
    }
    
    return (
      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full
        ${branding.bgColor} ${branding.color} ${branding.darkBg} ${branding.textStyle || 'font-medium'}`}>
        <span>{branding.name}</span>
        {isManual && (
          <span title="Manuelt lagt inn"><User className="h-3 w-3 ml-1" /></span>
        )}
      </span>
    );
  };
  
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Akkurat nå';
    if (diffHours < 24) return `${diffHours}t siden`;
    if (diffDays < 7) return `${diffDays}d siden`;
    return d.toLocaleDateString('no-NO', { day: 'numeric', month: 'short' });
  };
  
  if (compact) {
    return (
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-blue-500" />
            Siste Nyheter
          </h3>
          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="p-1.5 rounded hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {loading && news.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">Laster nyheter...</div>
        ) : error ? (
          <div className="text-center py-4 text-red-500 text-sm">{error}</div>
        ) : filteredNews.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">Ingen nyheter funnet</div>
        ) : (
          <div className="space-y-2">
            {filteredNews.slice(0, 5).map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-start gap-2">
                  {getSentimentIcon(item.sentiment)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground group-hover:text-blue-600 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.source} • {formatDate(item.publishedAt)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Newspaper className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                Nyhetsaggregator
              </h2>
              <p className="text-sm text-muted-foreground">
                {ticker ? `Nyheter om ${ticker}` : 'Siste finansnyheter'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Oppdatert {formatDate(lastUpdated)}
              </span>
            )}
            <button
              onClick={() => fetchNews(true)}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'Alle', icon: '📰' },
            { id: 'manual', label: 'Mine tips', icon: '📝' },
            { id: 'insider', label: 'Innsidehandel', icon: '🔒' },
            { id: 'earnings', label: 'Resultat', icon: '📊' },
            { id: 'analyst', label: 'Analytiker', icon: '💼' },
            { id: 'announcement', label: 'Børsmelding', icon: '📢' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                ${filter === tab.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Source Filter */}
      {showLinks && availableSources.length > 0 && (
        <div className="p-3 bg-gray-50 dark:bg-dark-bg border-b border-gray-100 dark:border-dark-border">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-all ${
                sourceFilter === 'all'
                  ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800 shadow-sm ring-2 ring-offset-1 ring-gray-400'
                  : 'bg-white dark:bg-dark-surface text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-gray-400'
              }`}
            >
              Alle ({news.length})
            </button>
            {availableSources.map(source => {
              const branding = SOURCE_BRANDING[source] || SOURCE_BRANDING['Annet'];
              const count = news.filter(n => n.source === source).length;
              const isActive = sourceFilter === source;
              
              const handleClick = () => {
                setSourceFilter(isActive ? 'all' : source);
              };
              
              // Spesialhåndtering for Investtech (tofarget tekst)
              if (source === 'Investtech') {
                return (
                  <button
                    key={source}
                    onClick={handleClick}
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded transition-all font-semibold ${
                      isActive
                        ? 'bg-[#f5f5f5] shadow-sm ring-2 ring-offset-1 ring-[#e86c1f]'
                        : 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:border-gray-400'
                    }`}
                  >
                    <span className="text-[#5a5a5a]">invest</span>
                    <span className="text-[#e86c1f]">tech</span>
                    <span className={`ml-1 text-gray-500 ${isActive ? 'opacity-70' : 'opacity-50'}`}>({count})</span>
                  </button>
                );
              }
              
              // E24 needs special handling for dark mode active state
              if (source === 'E24') {
                return (
                  <button
                    key={source}
                    onClick={handleClick}
                    type="button"
                    className={`px-3 py-1.5 text-xs rounded transition-all ${branding.textStyle || 'font-medium'} ${
                      isActive
                        ? 'bg-black text-white shadow-sm ring-2 ring-offset-1 ring-gray-500'
                        : 'bg-white dark:bg-dark-surface text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-gray-400'
                    }`}
                  >
                    {source}
                    <span className={`ml-1 ${isActive ? 'opacity-70' : 'opacity-50'}`}>({count})</span>
                  </button>
                );
              }
              
              return (
                <button
                  key={source}
                  onClick={handleClick}
                  type="button"
                  className={`px-3 py-1.5 text-xs rounded transition-all ${branding.textStyle || 'font-medium'} ${
                    isActive
                      ? `${branding.bgColor} ${branding.color} ${branding.darkBg} shadow-sm ring-2 ring-offset-1 ring-blue-400`
                      : 'bg-white dark:bg-dark-surface text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-gray-400'
                  }`}
                >
                  {source}
                  <span className={`ml-1 ${isActive ? 'opacity-70' : 'opacity-50'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Filter status */}
      {sourceFilter !== 'all' && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800/30 text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between">
          <span>Viser {filteredNews.length} artikler fra <strong>{sourceFilter}</strong></span>
          <button 
            type="button"
            onClick={() => setSourceFilter('all')}
            className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
          >
            Vis alle
          </button>
        </div>
      )}
      
      {/* News List - key for force re-render on filter change */}
      <div key={`${filter}-${sourceFilter}`} className="divide-y divide-gray-100 dark:divide-dark-border">
        {loading && news.length === 0 ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-300 dark:text-gray-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-500 dark:text-dark-muted">Henter nyheter...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchNews}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Prøv igjen
            </button>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="p-8 text-center">
            <Newspaper className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-dark-muted">
              {filter === 'all' ? 'Ingen nyheter funnet' : `Ingen ${filter}-nyheter funnet`}
            </p>
          </div>
        ) : (
          filteredNews.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getSentimentIcon(item.sentiment)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {getSourceBadge(item.source, item.isManual)}
                    {!item.isManual && getCategoryBadge(item.category)}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  {/* Sammendrag med expand/collapse */}
                  {item.summary && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-dark-muted">
                        {expandedItems.has(item.id) 
                          ? (item.fullSummary || item.summary)
                          : item.summary.slice(0, 120) + (item.summary.length > 120 ? '...' : '')
                        }
                      </p>
                      
                      {/* Expand-knapp - mer synlig for manuelle artikler */}
                      {(item.summary.length > 120 || item.fullSummary || item.isManual) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleExpand(item.id);
                          }}
                          className={`inline-flex items-center gap-1 text-xs mt-1.5 font-medium rounded px-2 py-0.5 transition-colors ${
                            item.isManual
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                              : 'text-blue-600 dark:text-blue-400 hover:underline'
                          }`}
                        >
                          {expandedItems.has(item.id) ? (
                            <>Vis mindre <ChevronUp className="h-3 w-3" /></>
                          ) : (
                            <>{item.isManual ? '📖 Les oppsummering' : 'Les mer'} <ChevronDown className="h-3 w-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400 dark:text-dark-muted flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.publishedAt)}
                    </span>
                    
                    {item.tickers.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Tag className="h-3 w-3 text-gray-400" />
                        {item.tickers.slice(0, 5).map(t => {
                          // Sjekk om det er Oslo Børs (korte tickers med store bokstaver)
                          // Eksterne har ofte lengre navn med mellomrom
                          const isOsloBors = /^[A-Z]{2,6}$/.test(t) || t.includes('.OL');
                          
                          return (
                            <span
                              key={t}
                              className={`text-xs px-1.5 py-0.5 rounded ${
                                isOsloBors 
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 bg-transparent'
                              }`}
                            >
                              {t}
                            </span>
                          );
                        })}
                        {item.tickers.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{item.tickers.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <ExternalLink className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 mt-1 flex-shrink-0" />
              </div>
            </a>
          ))
        )}
      </div>
      
      {/* Info footer */}
      <div className="p-3 bg-gray-50 dark:bg-dark-bg border-t border-gray-100 dark:border-dark-border">
        <p className="text-xs text-gray-500 dark:text-dark-muted text-center">
          💡 Overskrifter og sammendrag fra RSS. Klikk for å lese hele artikkelen.
        </p>
      </div>
    </div>
  );
}

