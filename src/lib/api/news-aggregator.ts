// Nyhets-aggregator som samler nyheter fra flere kilder

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  tickers?: string[];
}

export interface NewsSource {
  name: string;
  baseUrl: string;
  searchUrl: (ticker: string) => string;
}

// Tilgjengelige nyhetskilder
export const NEWS_SOURCES: NewsSource[] = [
  {
    name: 'Newsweb (Oslo Børs)',
    baseUrl: 'https://newsweb.oslobors.no',
    searchUrl: (ticker) => `https://newsweb.oslobors.no/search?issuer=${ticker.replace('.OL', '')}`,
  },
  {
    name: 'E24',
    baseUrl: 'https://e24.no',
    searchUrl: (ticker) => `https://e24.no/sok?q=${ticker.replace('.OL', '')}`,
  },
  {
    name: 'Dagens Næringsliv',
    baseUrl: 'https://dn.no',
    searchUrl: (ticker) => `https://dn.no/sok/?query=${ticker.replace('.OL', '')}`,
  },
  {
    name: 'Finansavisen',
    baseUrl: 'https://finansavisen.no',
    searchUrl: (ticker) => `https://finansavisen.no/sok?q=${ticker.replace('.OL', '')}`,
  },
  {
    name: 'Nordnet Blog',
    baseUrl: 'https://www.nordnet.no/blogg',
    searchUrl: (ticker) => `https://www.nordnet.no/blogg/?s=${ticker.replace('.OL', '')}`,
  },
];

// Sentimentord for enkel analyse
const POSITIVE_WORDS = [
  'øker', 'vekst', 'rekord', 'stiger', 'oppgang', 'gevinst', 'suksess',
  'forbedring', 'positiv', 'sterk', 'overskudd', 'utbytte', 'anbefaler',
  'kjøp', 'oppjusterer', 'outperform', 'buy', 'overweight'
];

const NEGATIVE_WORDS = [
  'faller', 'nedgang', 'tap', 'krise', 'svak', 'kutt', 'nedjusterer',
  'underskudd', 'selg', 'negativ', 'risiko', 'bekymring', 'advarsel',
  'sell', 'underweight', 'reduce', 'varsel', 'permitterer'
];

export function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  POSITIVE_WORDS.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });
  
  NEGATIVE_WORDS.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}

// Beregn relevans-score basert på nøkkelord og alder
export function calculateRelevanceScore(
  article: { title: string; publishedAt: Date },
  ticker: string
): number {
  let score = 50; // Base score
  
  const title = article.title.toLowerCase();
  const tickerClean = ticker.replace('.OL', '').toLowerCase();
  
  // Ticker nevnt i tittel = høy relevans
  if (title.includes(tickerClean)) {
    score += 30;
  }
  
  // Finansielle nøkkelord
  const financialKeywords = ['resultat', 'rapport', 'kvartal', 'utbytte', 'emisjon', 'oppkjøp', 'fusjon'];
  financialKeywords.forEach(kw => {
    if (title.includes(kw)) score += 5;
  });
  
  // Alder - nyere = mer relevant
  const ageInHours = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
  if (ageInHours < 4) score += 20;
  else if (ageInHours < 24) score += 10;
  else if (ageInHours < 72) score += 5;
  else score -= 10;
  
  return Math.min(100, Math.max(0, score));
}

// Aggreger nyheter for en ticker
export function getNewsLinks(ticker: string): { source: string; url: string }[] {
  return NEWS_SOURCES.map(source => ({
    source: source.name,
    url: source.searchUrl(ticker),
  }));
}

// Generer en sammendrag-rapport av nyheter
export function generateNewsSummary(articles: NewsArticle[]): {
  totalArticles: number;
  sentimentOverview: {
    positive: number;
    negative: number;
    neutral: number;
  };
  overallSentiment: 'positive' | 'negative' | 'neutral';
  topSources: string[];
  recentHighlights: string[];
} {
  const sentimentCounts = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };
  
  const sourceCounts: Record<string, number> = {};
  
  articles.forEach(article => {
    if (article.sentiment) {
      sentimentCounts[article.sentiment]++;
    }
    sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
  });
  
  // Bestem overall sentiment
  let overallSentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (sentimentCounts.positive > sentimentCounts.negative * 1.5) {
    overallSentiment = 'positive';
  } else if (sentimentCounts.negative > sentimentCounts.positive * 1.5) {
    overallSentiment = 'negative';
  }
  
  // Topp kilder
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([source]) => source);
  
  // Nylige høydepunkter
  const recentHighlights = articles
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 5)
    .map(a => a.title);
  
  return {
    totalArticles: articles.length,
    sentimentOverview: sentimentCounts,
    overallSentiment,
    topSources,
    recentHighlights,
  };
}
