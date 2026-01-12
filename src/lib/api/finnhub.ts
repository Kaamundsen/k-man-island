const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface FinnhubCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  v: number[]; // Volume
  t: number[]; // Timestamps
  s: string;   // Status
}

/**
 * Hent sanntidskurs for en aksje
 */
export async function getFinnhubQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      { next: { revalidate: 300 } } // Cache i 5 minutter
    );
    
    if (!response.ok) {
      console.warn(`Finnhub error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Hent historiske candlestick data
 * @param symbol - Ticker symbol (f.eks. "OKEA.OL")
 * @param days - Antall dager historikk (default: 250 for SMA200)
 */
export async function getFinnhubCandles(
  symbol: string, 
  days: number = 250
): Promise<FinnhubCandle | null> {
  try {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);
    
    const response = await fetch(
      `${BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`,
      { next: { revalidate: 1800 } } // Cache i 30 minutter
    );
    
    if (!response.ok) {
      console.warn(`Finnhub candles error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.s === 'no_data') {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    return null;
  }
}

/**
 * Beregn Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null;
  
  const relevantPrices = prices.slice(-period);
  const sum = relevantPrices.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

/**
 * Beregn Average True Range (ATR)
 */
export function calculateATR(
  highs: number[], 
  lows: number[], 
  closes: number[], 
  period: number = 14
): number | null {
  if (highs.length < period + 1) return null;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < highs.length; i++) {
    const high = highs[i];
    const low = lows[i];
    const prevClose = closes[i - 1];
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  // ATR er gjennomsnitt av siste N true ranges
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((sum, tr) => sum + tr, 0) / period;
}

/**
 * Beregn Relative Volume (siste vs. gjennomsnitt)
 */
export function calculateRelativeVolume(
  volumes: number[], 
  period: number = 20
): number {
  if (volumes.length < period + 1) return 1;
  
  const recentVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(-period - 1, -1).reduce((sum, v) => sum + v, 0) / period;
  
  return avgVolume > 0 ? recentVolume / avgVolume : 1;
}

/**
 * Finn høyeste pris i periode
 */
export function findHighest(prices: number[], period: number): number {
  const relevantPrices = prices.slice(-period);
  return Math.max(...relevantPrices);
}

/**
 * Insider Trading Data
 */
export interface InsiderTransaction {
  name: string;
  share: number; // Number of shares
  change: number; // Change in shares
  filingDate: string;
  transactionDate: string;
  transactionCode: string; // P = Purchase, S = Sale
  transactionPrice: number;
}

export async function getInsiderTransactions(
  symbol: string,
  from?: string,
  to?: string
): Promise<InsiderTransaction[]> {
  try {
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `${BASE_URL}/stock/insider-transactions?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`,
      { next: { revalidate: 3600 } } // Cache i 1 time
    );
    
    if (response.status === 429) {
      console.warn(`⚠️ Rate limit hit for ${symbol} insider data`);
      return [];
    }
    
    if (!response.ok) {
      console.warn(`Finnhub insider error for ${symbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching insider data for ${symbol}:`, error);
    return [];
  }
}

/**
 * Company News
 */
export interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export async function getCompanyNews(
  symbol: string,
  from?: string,
  to?: string
): Promise<NewsItem[]> {
  try {
    const toDate = to || new Date().toISOString().split('T')[0];
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const response = await fetch(
      `${BASE_URL}/company-news?symbol=${symbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`,
      { next: { revalidate: 1800 } } // Cache i 30 minutter
    );
    
    if (!response.ok) {
      console.warn(`Finnhub news error for ${symbol}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return (data || []).slice(0, 5); // Top 5 news
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}
