/**
 * Article Tips Store
 * 
 * Lagrer artikler, tips og nevnelser fra:
 * - Investtech nyhetsbrev
 * - E24, DN, Finansavisen
 * - Analytiker-anbefalinger
 * 
 * Kobler artikler til aksjer for å vise på analyse-siden.
 */

export type ArticleSource = 'Investtech' | 'Investornytt' | 'E24' | 'DN' | 'Finansavisen' | 'Newsweb' | 'Nordnet' | 'Annet';
export type MentionType = 'insider_buy' | 'insider_sell' | 'analyst_upgrade' | 'analyst_downgrade' | 'technical_signal' | 'news' | 'tip';

export interface ArticleTip {
  id: string;
  title: string;
  source: ArticleSource;
  url?: string;
  publishedDate: string;
  summary: string;
  fullText?: string; // Full artikkel-tekst (valgfritt, for referanse)
  
  // Aksjer nevnt i artikkelen
  mentions: StockMention[];
  
  // Meta
  createdAt: string;
  tags: string[];
}

export interface StockMention {
  ticker: string;
  stockName: string;
  mentionType: MentionType;
  sentiment: 'positive' | 'negative' | 'neutral';
  highlight: string; // Kort utdrag/oppsummering for denne aksjen
  isTopPick?: boolean; // Om aksjen er fremhevet som særlig interessant
}

const STORAGE_KEY = 'k-man-article-tips';

// ============ CRUD Operations ============

export function getArticleTips(): ArticleTip[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getArticle(id: string): ArticleTip | undefined {
  return getArticleTips().find(a => a.id === id);
}

export function saveArticleTip(article: Omit<ArticleTip, 'id' | 'createdAt'>): ArticleTip {
  const articles = getArticleTips();
  
  const newArticle: ArticleTip = {
    ...article,
    id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  articles.unshift(newArticle); // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  
  // Dispatch event for å oppdatere nyhetsstrømmen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('article-tips-updated'));
  }
  
  return newArticle;
}

export function updateArticleTip(id: string, updates: Partial<ArticleTip>): void {
  const articles = getArticleTips();
  const index = articles.findIndex(a => a.id === id);
  
  if (index !== -1) {
    articles[index] = { ...articles[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
    
    // Dispatch event for å oppdatere nyhetsstrømmen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('article-tips-updated'));
    }
  }
}

export function deleteArticleTip(id: string): void {
  const articles = getArticleTips().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  
  // Dispatch event for å oppdatere nyhetsstrømmen
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('article-tips-updated'));
  }
}

// ============ Query Functions ============

/**
 * Hent alle artikler som nevner en spesifikk aksje
 */
export function getArticlesForStock(ticker: string): ArticleTip[] {
  return getArticleTips().filter(article => 
    article.mentions.some(m => 
      m.ticker === ticker || 
      m.ticker === ticker.replace('.OL', '') ||
      m.ticker + '.OL' === ticker
    )
  );
}

/**
 * Hent mention-info for en aksje fra alle artikler
 */
export function getMentionsForStock(ticker: string): Array<{
  article: ArticleTip;
  mention: StockMention;
}> {
  const articles = getArticleTips();
  const results: Array<{ article: ArticleTip; mention: StockMention }> = [];

  for (const article of articles) {
    const mention = article.mentions.find(m => 
      m.ticker === ticker || 
      m.ticker === ticker.replace('.OL', '') ||
      m.ticker + '.OL' === ticker
    );
    
    if (mention) {
      results.push({ article, mention });
    }
  }

  return results.sort((a, b) => 
    new Date(b.article.publishedDate).getTime() - new Date(a.article.publishedDate).getTime()
  );
}

/**
 * Hent siste X artikler
 */
export function getRecentArticles(limit: number = 10): ArticleTip[] {
  return getArticleTips()
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, limit);
}

/**
 * Hent artikler etter kilde
 */
export function getArticlesBySource(source: ArticleSource): ArticleTip[] {
  return getArticleTips().filter(a => a.source === source);
}

/**
 * Hent alle aksjer som er nevnt som "top pick" nylig
 */
export function getRecentTopPicks(daysBack: number = 30): StockMention[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const topPicks: StockMention[] = [];

  for (const article of getArticleTips()) {
    if (new Date(article.publishedDate) >= cutoffDate) {
      for (const mention of article.mentions) {
        if (mention.isTopPick) {
          topPicks.push(mention);
        }
      }
    }
  }

  return topPicks;
}

// ============ Quick Add Helpers ============

/**
 * Rask måte å legge til Investtech ukentlig liste
 */
export function addInvesttechInsiderList(data: {
  date: string;
  title: string;
  url?: string;
  summary: string;
  stocks: Array<{
    ticker: string;
    name: string;
    highlight?: string;
    isTopPick?: boolean;
  }>;
}): ArticleTip {
  const mentions: StockMention[] = data.stocks.map(s => ({
    ticker: s.ticker.toUpperCase().replace('.OL', ''),
    stockName: s.name,
    mentionType: 'insider_buy' as MentionType,
    sentiment: 'positive' as const,
    highlight: s.highlight || 'Maksimalt positiv på Investtechs innsidehandelrangering',
    isTopPick: s.isTopPick,
  }));

  return saveArticleTip({
    title: data.title,
    source: 'Investtech',
    url: data.url,
    publishedDate: data.date,
    summary: data.summary,
    mentions,
    tags: ['insider', 'ukentlig'],
  });
}

/**
 * Rask måte å legge til en analytiker-anbefaling
 */
export function addAnalystRecommendation(data: {
  source: ArticleSource;
  date: string;
  analyst: string;
  ticker: string;
  stockName: string;
  recommendation: 'upgrade' | 'downgrade' | 'initiate' | 'reiterate';
  targetPrice?: number;
  summary: string;
  url?: string;
}): ArticleTip {
  const mentionType: MentionType = data.recommendation === 'downgrade' 
    ? 'analyst_downgrade' 
    : 'analyst_upgrade';

  return saveArticleTip({
    title: `${data.analyst}: ${data.recommendation === 'upgrade' ? 'Oppjusterer' : 
            data.recommendation === 'downgrade' ? 'Nedjusterer' : 
            data.recommendation === 'initiate' ? 'Starter dekning av' : 
            'Gjentar'} ${data.stockName}`,
    source: data.source,
    url: data.url,
    publishedDate: data.date,
    summary: data.summary,
    mentions: [{
      ticker: data.ticker.toUpperCase().replace('.OL', ''),
      stockName: data.stockName,
      mentionType,
      sentiment: data.recommendation === 'downgrade' ? 'negative' : 'positive',
      highlight: data.targetPrice 
        ? `Kursmål: ${data.targetPrice} kr. ${data.summary}`
        : data.summary,
    }],
    tags: ['analyst', data.analyst.toLowerCase()],
  });
}

// ============ Statistics ============

export interface ArticleStats {
  totalArticles: number;
  totalMentions: number;
  bySource: Record<ArticleSource, number>;
  mostMentioned: Array<{ ticker: string; count: number }>;
  recentTopPicks: number;
}

export function getArticleStats(): ArticleStats {
  const articles = getArticleTips();
  
  const bySource: Record<string, number> = {};
  const mentionCount: Record<string, number> = {};
  let totalMentions = 0;

  for (const article of articles) {
    bySource[article.source] = (bySource[article.source] || 0) + 1;
    
    for (const mention of article.mentions) {
      mentionCount[mention.ticker] = (mentionCount[mention.ticker] || 0) + 1;
      totalMentions++;
    }
  }

  const mostMentioned = Object.entries(mentionCount)
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalArticles: articles.length,
    totalMentions,
    bySource: bySource as Record<ArticleSource, number>,
    mostMentioned,
    recentTopPicks: getRecentTopPicks(30).length,
  };
}
