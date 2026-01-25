/**
 * stock-data.ts - CANONICAL SOURCE for live stock list fetching
 * 
 * Single source of truth for fetching stock lists from Yahoo Finance.
 * See docs/00_SOURCE_OF_TRUTH.md
 */

import { Stock, StockStrategy } from '../types';

// Re-export K-Momentum specific functions from legacy (for backward compat)
export { fetchAllStocksWithKMomentum } from "@/strategy-packs/legacy/api/stock-data-v2";

interface YahooQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

// Watchlist - topp 50 mest likvide aksjer på Oslo Børs
const WATCHLIST = [
  // OBX - 25 største
  'EQNR.OL', 'DNB.OL', 'MOWI.OL', 'TEL.OL', 'YAR.OL',
  'ORK.OL', 'NHY.OL', 'SALM.OL', 'STB.OL', 'AKRBP.OL',
  'SUBC.OL', 'KOG.OL', 'SCATC.OL', 'GJF.OL', 'NSKOG.OL',
  'AKSO.OL', 'MPCC.OL', 'TGS.OL', 'PGS.OL', 'REC.OL',
  'NAPA.OL', 'XXL.OL', 'AURG.OL', 'BEWI.OL',
  // Andre store OSEBX-aksjer med høy omsetning
  'VAR.OL', 'OKEA.OL', 'NEL.OL', 'AFK.OL', 'AKER.OL',
  'BWO.OL', 'FLNG.OL', 'GOGL.OL', 'HAFNI.OL', 'HAVI.OL',
  'KAHOT.OL', 'LSG.OL', 'MULTI.OL', 'NAS.OL', 'NONG.OL',
  'NOD.OL', 'NRS.OL', 'PARB.OL', 'RECSI.OL', 'SDRL.OL',
  'SOFF.OL', 'WSTEP.OL', 'WAWI.OL',
];

const STOCK_NAMES: Record<string, string> = {
  'EQNR.OL': 'Equinor ASA',
  'DNB.OL': 'DNB Bank ASA',
  'MOWI.OL': 'Mowi ASA',
  'TEL.OL': 'Telenor ASA',
  'YAR.OL': 'Yara International',
  'ORK.OL': 'Orkla ASA',
  'NHY.OL': 'Norsk Hydro ASA',
  'SALM.OL': 'SalMar ASA',
  'STB.OL': 'Storebrand ASA',
  'AKRBP.OL': 'Aker BP ASA',
  'SUBC.OL': 'Subsea 7 SA',
  'KOG.OL': 'Kongsberg Gruppen',
  'SCATC.OL': 'Scatec ASA',
  'GJF.OL': 'Gjensidige Forsikring',
  'NSKOG.OL': 'Norsk Skog ASA',
  'AKSO.OL': 'Aker Solutions ASA',
  'MPCC.OL': 'MPC Container Ships',
  'TGS.OL': 'TGS ASA',
  'PGS.OL': 'PGS ASA',
  'REC.OL': 'REC Silicon ASA',
  'NAPA.OL': 'Napier Energy',
  'XXL.OL': 'XXL ASA',
  'AURG.OL': 'Aurubis AG',
  'BEWI.OL': 'Bewi ASA',
  'VAR.OL': 'Vår Energi ASA',
  'OKEA.OL': 'OKEA ASA',
  'NEL.OL': 'Nel ASA',
  'AFK.OL': 'Africa Energy Corp',
  'AKER.OL': 'Aker ASA',
  'BWO.OL': 'BW Offshore',
  'FLNG.OL': 'Flex LNG',
  'GOGL.OL': 'Golden Ocean Group',
  'HAFNI.OL': 'Hafnia Limited',
  'HAVI.OL': 'Havila Shipping',
  'KAHOT.OL': 'Kahoot! ASA',
  'LSG.OL': 'Lerøy Seafood Group',
  'MULTI.OL': 'Multiconsult ASA',
  'NAS.OL': 'Norwegian Air Shuttle',
  'NONG.OL': 'Noreco ASA',
  'NOD.OL': 'Nordic Semiconductor',
  'NRS.OL': 'Norsk Renewables',
  'PARB.OL': 'Pareto Bank ASA',
  'RECSI.OL': 'REC Silicon ASA',
  'SDRL.OL': 'Seadrill Limited',
  'SOFF.OL': 'Schibsted ASA',
  'WSTEP.OL': 'Wallenius Wilhelmsen',
  'WAWI.OL': 'Wallenius Wilhelmsen ASA',
};

/**
 * Fetch stock data from Yahoo Finance
 */
async function fetchYahooFinanceData(symbols: string[]): Promise<YahooQuote[]> {
  const results: YahooQuote[] = [];
  
  for (const symbol of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        console.warn(`Yahoo Finance error for ${symbol}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const quote = data.chart?.result?.[0];
      
      if (!quote || !quote.meta) {
        console.warn(`No data for ${symbol}`);
        continue;
      }

      const meta = quote.meta;
      const currentPrice = meta.regularMarketPrice || meta.previousClose;
      const previousClose = meta.chartPreviousClose || meta.previousClose;
      const change = currentPrice - previousClose;
      const changePercent = (change / previousClose) * 100;

      results.push({
        symbol: symbol,
        regularMarketPrice: currentPrice,
        regularMarketChange: change,
        regularMarketChangePercent: changePercent,
        regularMarketVolume: meta.regularMarketVolume || 0,
        regularMarketPreviousClose: previousClose,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || currentPrice * 1.2,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow || currentPrice * 0.8,
      });
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }
  
  return results;
}

/**
 * Calculate technical indicators from Yahoo quote data
 */
function calculateTechnicalIndicators(quote: YahooQuote): {
  rsi: number;
  kScore: number;
  signal: 'BUY' | 'HOLD' | 'SELL';
  target: number;
  stopLoss: number;
  gainKr: number;
  gainPercent: number;
  riskKr: number;
  riskPercent: number;
} {
  const price = quote.regularMarketPrice;
  const changePercent = quote.regularMarketChangePercent;
  const high52 = quote.fiftyTwoWeekHigh;
  const low52 = quote.fiftyTwoWeekLow;
  
  const pricePosition = ((price - low52) / (high52 - low52)) * 100;
  const rsi = Math.max(30, Math.min(70, 50 + (changePercent * 5)));
  
  // K-Score calculation
  let kScore = 40;
  const momentumScore = Math.min(30, Math.max(-10, changePercent * 3));
  kScore += momentumScore;
  
  const rsiOptimal = 50;
  const rsiDistance = Math.abs(rsi - rsiOptimal);
  const rsiScore = Math.max(0, 25 - (rsiDistance * 0.8));
  kScore += rsiScore;
  
  const positionScore = (pricePosition / 100) * 20;
  kScore += positionScore;
  
  const volatilityRange = (high52 - low52) / price;
  const volatilityScore = Math.min(15, volatilityRange * 10);
  kScore += volatilityScore;
  
  kScore = Math.max(30, Math.min(95, kScore));
  
  // Target and Stop Loss
  const atrEstimate = (high52 - low52) / 20;
  const target = price + (atrEstimate * 2);
  const stopLoss = price - (atrEstimate * 1);
  
  const gainKr = target - price;
  const gainPercent = (gainKr / price) * 100;
  const riskKr = price - stopLoss;
  const riskPercent = (riskKr / price) * 100;
  const riskRewardRatio = gainKr / riskKr;
  
  // Signal determination
  let signal: 'BUY' | 'HOLD' | 'SELL';
  if (kScore >= 70 && rsi < 60 && changePercent > -1 && riskRewardRatio >= 1.5) {
    signal = 'BUY';
  } else if (rsi > 70 || changePercent < -3 || kScore < 40 || riskRewardRatio < 1) {
    signal = 'SELL';
  } else {
    signal = 'HOLD';
  }
  
  return {
    rsi: Math.round(rsi * 10) / 10,
    kScore: Math.round(kScore),
    signal,
    target: Math.round(target * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    gainKr: Math.round(gainKr * 100) / 100,
    gainPercent: Math.round(gainPercent * 10) / 10,
    riskKr: Math.round(riskKr * 100) / 100,
    riskPercent: Math.round(riskPercent * 10) / 10,
  };
}

/**
 * Convert Yahoo quote to Stock type
 */
function convertToStock(quote: YahooQuote): Stock {
  const indicators = calculateTechnicalIndicators(quote);
  const isOslo = quote.symbol.endsWith('.OL');
  
  const strategies: StockStrategy[] = [];
  
  if (indicators.signal === 'BUY' && quote.regularMarketChangePercent > 1) {
    strategies.push('MOMENTUM');
  }
  if (indicators.kScore >= 70) {
    strategies.push('BUFFETT');
  }
  if (quote.regularMarketVolume > 1000000) {
    strategies.push('TVEITEREID');
  }
  
  const pricePosition = ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / 
    (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100;
  if (indicators.rsi < 45 && pricePosition < 40 && quote.regularMarketChangePercent > -2) {
    strategies.push('REBOUND');
  }
  
  // Note: Quick analysis from Yahoo 1d data has limited history
  // Full analysis should use /api/analysis/[ticker] endpoint
  return {
    ticker: quote.symbol,
    name: STOCK_NAMES[quote.symbol] || quote.symbol,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    kScore: indicators.kScore,
    rsi: indicators.rsi,
    signal: indicators.signal,
    target: indicators.target,
    stopLoss: indicators.stopLoss,
    gainKr: indicators.gainKr,
    gainPercent: indicators.gainPercent,
    riskKr: indicators.riskKr,
    riskPercent: indicators.riskPercent,
    timeHorizon: indicators.signal === 'BUY' ? '2-6 uker' : '4-8 uker',
    market: isOslo ? 'OSLO' : 'USA',
    strategies: strategies.length > 0 ? strategies : ['MOMENTUM'],
    // Data quality flags - quick scan has limited data
    dataSource: 'yahoo',
    historyDays: 1, // Only 1 day of data in quick scan
    insufficientHistory: true, // Quick scan always has insufficient history for full analysis
  };
}

/**
 * CANONICAL: Fetch live stock data for the full watchlist
 * Returns sorted list by K-Score
 * 
 * @param limit - Optional limit on number of stocks to return (default: all)
 */
export async function fetchLiveStockData(limit?: number): Promise<Stock[]> {
  try {
    console.log(`🔄 Fetching live stock data from Yahoo Finance (watchlist: ${WATCHLIST.length})...`);
    
    const quotes = await fetchYahooFinanceData(WATCHLIST);
    
    if (quotes.length === 0) {
      console.warn('⚠️ No data from Yahoo Finance');
      return [];
    }
    
    const stocks = quotes
      .filter(q => q.regularMarketPrice > 0)
      .map(convertToStock)
      .sort((a, b) => b.kScore - a.kScore);
    
    console.log(`✅ Fetched ${stocks.length} stocks from Yahoo Finance`);
    
    if (limit && limit > 0) {
      return stocks.slice(0, limit);
    }
    
    return stocks;
  } catch (error) {
    console.error('Error in fetchLiveStockData:', error);
    return [];
  }
}

/**
 * Get the default watchlist symbols
 */
export function getWatchlist(): string[] {
  return [...WATCHLIST];
}

/**
 * Check if Oslo market is open (9:00-16:20 CET)
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const day = osloTime.getDay();
  const hours = osloTime.getHours();
  const minutes = osloTime.getMinutes();
  
  if (day === 0 || day === 6) return false;
  
  const currentMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60;
  const marketClose = 16 * 60 + 20;
  
  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

/**
 * Fetch data for a single stock by ticker
 * Returns Stock object or null if not found
 */
export async function fetchSingleStockData(ticker: string): Promise<Stock | null> {
  try {
    const quotes = await fetchYahooFinanceData([ticker]);
    
    if (quotes.length === 0) {
      return null;
    }
    
    const quote = quotes[0];
    if (!quote || quote.regularMarketPrice <= 0) {
      return null;
    }
    
    return convertToStock(quote);
  } catch (error) {
    console.error(`Error fetching single stock ${ticker}:`, error);
    return null;
  }
}
