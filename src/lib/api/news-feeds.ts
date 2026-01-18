/**
 * News Feed Aggregator
 * 
 * Henter nyheter fra:
 * - Newsweb (Oslo Børs offisielle meldinger) - GRATIS
 * - RSS feeds fra E24, DN, Finansavisen (overskrifter)
 * - Google News (aggregert)
 * 
 * Vi respekterer betalingsmurer og henter kun:
 * - Overskrifter
 * - Ingresser/sammendrag
 * - Meta-beskrivelser
 */

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  tickers: string[]; // Aksjer nevnt i nyheten
  category: 'insider' | 'earnings' | 'analyst' | 'general' | 'announcement';
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface NewswedMessage {
  id: string;
  issuer: string;
  ticker: string;
  title: string;
  category: string;
  publishedAt: Date;
  url: string;
}

// ============ Newsweb (Oslo Børs) ============
// Dette er den mest verdifulle kilden - offisielle børsmeldinger

const NEWSWEB_BASE = 'https://newsweb.oslobors.no';

/**
 * Henter siste meldinger fra Newsweb for en spesifikk aksje
 * Newsweb er gratis og inneholder alle offisielle meldinger
 */
export async function fetchNewswebMessages(ticker: string): Promise<NewswedMessage[]> {
  // Newsweb har ikke et åpent API, men vi kan bruke søke-URL
  // I en produksjonsversjon ville vi brukt server-side scraping
  
  // For nå, returner en URL brukeren kan besøke
  const cleanTicker = ticker.replace('.OL', '').replace('.CO', '');
  
  return [{
    id: `newsweb-link-${cleanTicker}`,
    issuer: cleanTicker,
    ticker: cleanTicker,
    title: `Se alle børsmeldinger for ${cleanTicker} på Newsweb`,
    category: 'link',
    publishedAt: new Date(),
    url: `${NEWSWEB_BASE}/search?issuer=${cleanTicker}`,
  }];
}

// ============ RSS Feed URLs ============

export const RSS_FEEDS = {
  // E24 - Børs og finans
  E24_BORS: 'https://e24.no/rss2/?seksjon=boers-og-finans',
  E24_NYHETER: 'https://e24.no/rss2/',
  
  // DN - Krever ofte innlogging, men RSS er ofte tilgjengelig
  DN_BORS: 'https://www.dn.no/rss/bors',
  
  // Finansavisen
  FINANSAVISEN: 'https://finansavisen.no/rss',
  
  // Google News - Kan filtreres på søkeord
  GOOGLE_NEWS: (query: string) => 
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+site:e24.no+OR+site:dn.no+OR+site:finansavisen.no&hl=no&gl=NO&ceid=NO:no`,
};

// ============ RSS Parser ============

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  content?: string;
}

/**
 * Parser en RSS feed XML string
 */
export function parseRSSFeed(xmlString: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Enkel regex-basert parsing (for client-side)
  // I produksjon ville vi brukt en ordentlig XML-parser på server
  const itemMatches = xmlString.match(/<item>([\s\S]*?)<\/item>/g) || [];
  
  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || 
                  itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[2] || '';
    const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] ||
                       itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[2] || '';
    const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    
    if (title && link) {
      items.push({
        title: decodeHTMLEntities(title),
        link,
        description: decodeHTMLEntities(description),
        pubDate,
      });
    }
  }
  
  return items;
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ''); // Fjern HTML-tags
}

// ============ Ticker Detection ============

// Liste over kjente Oslo Børs-tickers for matching
const KNOWN_TICKERS = [
  'AKER', 'AKRBP', 'AKSO', 'AKA', 'AMSC', 'ATEA', 'AUTO', 'BAKKA', 'BEWI', 'BORR',
  'BWE', 'CRAYN', 'DNB', 'DNO', 'EQNR', 'FLNG', 'FRONTLINE', 'GOGL', 'HAFNIA', 'HEX',
  'KIT', 'KOG', 'MOWI', 'MPC', 'NEL', 'NHY', 'NOD', 'NRC', 'OET', 'OKEA',
  'ORK', 'ORKLA', 'PARB', 'PGS', 'PROTCT', 'RECSI', 'SALM', 'SATS', 'SCATC', 'SCHA',
  'SDRL', 'SNI', 'SRBANK', 'STB', 'SUBC', 'TEL', 'TGS', 'VAR', 'VEI', 'VOW',
  'WSTEP', 'XXL', 'YAR', 'ZENA',
];

// Vanlige aksjenavn for matching
const TICKER_ALIASES: Record<string, string[]> = {
  'EQNR': ['Equinor', 'Statoil'],
  'DNB': ['DNB Bank', 'DnB'],
  'NHY': ['Norsk Hydro', 'Hydro'],
  'TEL': ['Telenor'],
  'ORK': ['Orkla'],
  'MOWI': ['Marine Harvest'],
  'YAR': ['Yara'],
  'AKER': ['Aker ASA'],
  'AKRBP': ['Aker BP'],
  'SALM': ['SalMar'],
  'VAR': ['Vår Energi'],
  'KOG': ['Kongsberg'],
  'SCHA': ['Schibsted'],
  'BAKKA': ['Bakkafrost'],
};

/**
 * Finner aksje-tickers nevnt i en tekst
 */
export function findTickersInText(text: string): string[] {
  const upperText = text.toUpperCase();
  const foundTickers: string[] = [];
  
  // Direkte ticker-match
  for (const ticker of KNOWN_TICKERS) {
    if (upperText.includes(ticker) || upperText.includes(ticker + '.OL')) {
      foundTickers.push(ticker);
    }
  }
  
  // Alias-match (selskapsnavn)
  for (const [ticker, aliases] of Object.entries(TICKER_ALIASES)) {
    for (const alias of aliases) {
      if (text.toLowerCase().includes(alias.toLowerCase())) {
        if (!foundTickers.includes(ticker)) {
          foundTickers.push(ticker);
        }
      }
    }
  }
  
  return foundTickers;
}

// ============ Sentiment Detection ============

const POSITIVE_WORDS = [
  'oppgang', 'stiger', 'øker', 'positiv', 'oppjusterer', 'kjøp', 'anbefaler',
  'sterk', 'vekst', 'rekord', 'gevinst', 'overskudd', 'utbytte', 'kontrakt',
  'avtale', 'ekspansjon', 'investerer', 'optimist', 'lønnsom',
];

const NEGATIVE_WORDS = [
  'nedgang', 'faller', 'synker', 'negativ', 'nedjusterer', 'selg', 'advarer',
  'svak', 'tap', 'underskudd', 'kutter', 'permitterer', 'konkurs', 'fare',
  'bekymring', 'risiko', 'usikker', 'pessimist',
];

/**
 * Enkel sentiment-analyse basert på nøkkelord
 */
export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  for (const word of POSITIVE_WORDS) {
    if (lowerText.includes(word)) positiveScore++;
  }
  
  for (const word of NEGATIVE_WORDS) {
    if (lowerText.includes(word)) negativeScore++;
  }
  
  if (positiveScore > negativeScore + 1) return 'positive';
  if (negativeScore > positiveScore + 1) return 'negative';
  return 'neutral';
}

// ============ News Category Detection ============

export function detectCategory(text: string): NewsItem['category'] {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('innsidehandel') || lowerText.includes('insider')) {
    return 'insider';
  }
  if (lowerText.includes('kvartalsrapport') || lowerText.includes('resultat') || lowerText.includes('earnings')) {
    return 'earnings';
  }
  if (lowerText.includes('analytiker') || lowerText.includes('kursmål') || lowerText.includes('anbefaling')) {
    return 'analyst';
  }
  if (lowerText.includes('børsmelding') || lowerText.includes('flagging') || lowerText.includes('meldepliktig')) {
    return 'announcement';
  }
  
  return 'general';
}

// ============ Full News Fetch (API Route) ============

/**
 * Denne funksjonen er ment å kalles fra en API-route
 * fordi CORS blokkerer direkte kall fra browser
 */
export async function fetchNewsForTicker(ticker: string): Promise<NewsItem[]> {
  const cleanTicker = ticker.replace('.OL', '').replace('.CO', '');
  const news: NewsItem[] = [];
  
  // Generer Google News søke-URL for denne aksjen
  const aliases = TICKER_ALIASES[cleanTicker] || [cleanTicker];
  const searchQuery = aliases.join(' OR ');
  
  // I en API-route ville vi hentet og parset RSS her
  // For nå returnerer vi tomme resultater + lenker brukeren kan besøke
  
  return news;
}

// ============ External Links Generator ============

export interface ExternalNewsLinks {
  newsweb: string;
  e24: string;
  dn: string;
  finansavisen: string;
  investornytt: string;
  googleNews: string;
}

/**
 * Genererer lenker til eksterne nyhetskilder for en aksje
 */
export function getExternalNewsLinks(ticker: string): ExternalNewsLinks {
  const cleanTicker = ticker.replace('.OL', '').replace('.CO', '');
  const aliases = TICKER_ALIASES[cleanTicker] || [];
  const searchTerm = aliases[0] || cleanTicker;
  
  return {
    newsweb: `https://newsweb.oslobors.no/search?issuer=${cleanTicker}`,
    e24: `https://e24.no/sok?q=${encodeURIComponent(searchTerm)}`,
    dn: `https://www.dn.no/sok/?query=${encodeURIComponent(searchTerm)}`,
    finansavisen: `https://finansavisen.no/sok?q=${encodeURIComponent(searchTerm)}`,
    investornytt: `https://www.investornytt.no/?s=${encodeURIComponent(searchTerm)}`,
    googleNews: `https://news.google.com/search?q=${encodeURIComponent(searchTerm + ' aksje')}&hl=no&gl=NO`,
  };
}
