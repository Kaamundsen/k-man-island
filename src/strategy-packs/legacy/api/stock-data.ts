import { Stock } from '@/lib/types';

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

// Topp 50 mest likvide aksjer på Oslo Børs (OBX + store OSEBX)
const WATCHLIST = [
  // OBX - 25 største
  'EQNR.OL',      // Equinor
  'DNB.OL',       // DNB
  'MOWI.OL',      // Mowi
  'TEL.OL',       // Telenor
  'YAR.OL',       // Yara
  'ORK.OL',       // Orkla
  'NHY.OL',       // Norsk Hydro
  'SALM.OL',      // SalMar
  'STB.OL',       // Storebrand
  'BAKKA.OL',     // Aker BP
  'SUBC.OL',      // Subsea 7
  'KOG.OL',       // Kongsberg Gruppen
  'SCATC.OL',     // Scatec
  'GJF.OL',       // Gjensidige
  'NSKOG.OL',     // Norsk Skog
  'AKSO.OL',      // Aker Solutions
  'MPCC.OL',      // MPC Container Ships
  'TGS.OL',       // TGS
  'PGS.OL',       // PGS
  'REC.OL',       // REC Silicon
  'AKRBP.OL',     // Aker BP (duplicate check)
  'NAPA.OL',      // Napier Energy
  'XXL.OL',       // XXL
  'AURG.OL',      // Aurubis
  'BEWI.OL',      // Bewi
  
  // Andre store OSEBX-aksjer med høy omsetning
  'VAR.OL',       // Vår Energi
  'OKEA.OL',      // OKEA
  'NEL.OL',       // Nel
  'AFK.OL',       // Africa Energy
  'AKER.OL',      // Aker
  'AASB.OL',      // Aker Seafoods
  'BWO.OL',       // BW Offshore
  'FLNG.OL',      // Flex LNG
  'GOGL.OL',      // Golden Ocean
  'HAFNI.OL',     // Hafnia
  'HAVI.OL',      // Havila Shipping
  'KAHOT.OL',     // Kahoot
  'LSG.OL',       // Lerøy Seafood
  'MULTI.OL',     // Multiconsult
  'NAS.OL',       // Norwegian Air Shuttle
  'NONG.OL',      // Noreco
  'NOD.OL',       // Nordic Semiconductor
  'NRS.OL',       // Norsk Renewables
  'PARB.OL',      // Pareto Bank
  'RECSI.OL',     // REC Silicon
  'SDRL.OL',      // Seadrill
  'SOFF.OL',      // Schibsted
  'SPARSE.OL',    // Sparebank 1
  'WSTEP.OL',     // Wallenius Wilhelmsen
  'WAWI.OL',      // Wallenius Wilhelmsen (alt ticker)
];

/**
 * Hent aksjedata fra Yahoo Finance med bedre error handling
 */
async function fetchYahooFinanceData(symbols: string[]): Promise<YahooQuote[]> {
  const results: YahooQuote[] = [];
  
  // Fetch each symbol individually for better reliability
  for (const symbol of symbols) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        cache: 'no-store', // Always fetch fresh data
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
      
      console.log(`Fetched ${symbol}: ${currentPrice} NOK (${changePercent.toFixed(2)}%)`);
    } catch (error) {
      console.error(`Error fetching ${symbol}:`, error);
    }
  }
  
  return results;
}

/**
 * Beregn tekniske indikatorer og signaler
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
  
  // Price position in 52w range (0-100)
  const pricePosition = ((price - low52) / (high52 - low52)) * 100;
  
  // Simplified RSI beregning basert på price action
  const rsi = Math.max(30, Math.min(70, 50 + (changePercent * 5)));
  
  // K-Score beregning - mer granulær med desimaler
  let kScore = 40; // Start litt lavere
  
  // 1. Momentum (0-30 poeng) - gradvis basert på changePercent
  const momentumScore = Math.min(30, Math.max(-10, changePercent * 3));
  kScore += momentumScore;
  
  // 2. RSI (0-25 poeng) - best rundt 45-55
  const rsiOptimal = 50;
  const rsiDistance = Math.abs(rsi - rsiOptimal);
  const rsiScore = Math.max(0, 25 - (rsiDistance * 0.8));
  kScore += rsiScore;
  
  // 3. Price position in 52w range (0-20 poeng)
  const positionScore = (pricePosition / 100) * 20;
  kScore += positionScore;
  
  // 4. Volatility bonus (0-15 poeng) - høyere range = mer potensial
  const volatilityRange = (high52 - low52) / price;
  const volatilityScore = Math.min(15, volatilityRange * 10);
  kScore += volatilityScore;
  
  // Cap mellom 30 og 95
  kScore = Math.max(30, Math.min(95, kScore));
  
  // Target og Stop Loss (ATR-basert) - beregn først!
  const atrEstimate = (high52 - low52) / 20; // Simplified ATR
  const target = price + (atrEstimate * 2);
  const stopLoss = price - (atrEstimate * 1);
  
  const gainKr = target - price;
  const gainPercent = (gainKr / price) * 100;
  const riskKr = price - stopLoss;
  const riskPercent = (riskKr / price) * 100;
  const riskRewardRatio = gainKr / riskKr;
  
  // Signal - fokus på Risk/Reward og kvalitet
  let signal: 'BUY' | 'HOLD' | 'SELL';
  if (kScore >= 70 && rsi < 60 && changePercent > -1 && riskRewardRatio >= 1.5) {
    // BUY: God K-Score, ikke overkjøpt, akseptabel endring, OG god Risk/Reward (minst 1.5:1)
    signal = 'BUY';
  } else if (rsi > 70 || changePercent < -3 || kScore < 40 || riskRewardRatio < 1) {
    // SELL: Overkjøpt, stor nedgang, svak K-Score, ELLER dårlig Risk/Reward
    signal = 'SELL';
  } else {
    signal = 'HOLD';
  }
  
  return {
    rsi: Math.round(rsi * 10) / 10,
    kScore: Math.round(kScore), // Keep as whole number for display
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
 * Konverter Yahoo data til vårt Stock format
 */
function convertToStock(quote: YahooQuote): Stock {
  const indicators = calculateTechnicalIndicators(quote);
  const isOslo = quote.symbol.endsWith('.OL');
  
  // Strategies basert på signal og karakteristikker
  const strategies: ('MOMENTUM_TREND' | 'MOMENTUM_ASYM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND')[] = [];
  
  // Beregn volatilitet for ASYM-vurdering
  const volatilityPercent = ((quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow) / quote.regularMarketPrice) * 100;
  const distanceTo52High = ((quote.fiftyTwoWeekHigh - quote.regularMarketPrice) / quote.regularMarketPrice) * 100;
  
  // MOMENTUM_TREND: Trygg trend-følging
  if (indicators.signal === 'BUY' && indicators.kScore >= 70 && indicators.rsi < 65) {
    strategies.push('MOMENTUM_TREND');
  }
  
  // MOMENTUM_ASYM: Høy volatilitet + stor oppside (asym R/R)
  if (indicators.kScore >= 60 && volatilityPercent > 30 && distanceTo52High > 15 && indicators.rsi < 70) {
    strategies.push('MOMENTUM_ASYM');
  }
  
  // BUFFETT: High quality (K-Score) regardless of short-term movement
  if (indicators.kScore >= 70) {
    strategies.push('BUFFETT');
  }
  
  // TVEITEREID: High volume liquidity
  if (quote.regularMarketVolume > 1000000) {
    strategies.push('TVEITEREID');
  }
  
  // REBOUND: Oversold bounce candidate (lav RSI + positiv trend forming)
  const pricePosition = ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) * 100;
  if (indicators.rsi < 45 && pricePosition < 40 && quote.regularMarketChangePercent > -2) {
    strategies.push('REBOUND');
  }
  
  return {
    ticker: quote.symbol,
    name: getStockName(quote.symbol),
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
    strategies: strategies.length > 0 ? strategies : ['MOMENTUM_TREND'],
  };
}

/**
 * Get stock display name
 */
function getStockName(symbol: string): string {
  const names: Record<string, string> = {
    // OBX
    'EQNR.OL': 'Equinor ASA',
    'DNB.OL': 'DNB Bank ASA',
    'MOWI.OL': 'Mowi ASA',
    'TEL.OL': 'Telenor ASA',
    'YAR.OL': 'Yara International',
    'ORK.OL': 'Orkla ASA',
    'NHY.OL': 'Norsk Hydro ASA',
    'SALM.OL': 'SalMar ASA',
    'STB.OL': 'Storebrand ASA',
    'BAKKA.OL': 'Aker BP ASA',
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
    'AKRBP.OL': 'Aker BP ASA',
    'NAPA.OL': 'Napier Energy',
    'XXL.OL': 'XXL ASA',
    'AURG.OL': 'Aurubis AG',
    'BEWI.OL': 'Bewi ASA',
    
    // Andre store OSEBX
    'VAR.OL': 'Vår Energi ASA',
    'OKEA.OL': 'OKEA ASA',
    'NEL.OL': 'Nel ASA',
    'AFK.OL': 'Africa Energy Corp',
    'AKER.OL': 'Aker ASA',
    'AASB.OL': 'Aker Seafoods',
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
    'SPARSE.OL': 'SpareBank 1',
    'WSTEP.OL': 'Wallenius Wilhelmsen',
    'WAWI.OL': 'Wallenius Wilhelmsen ASA',
  };
  return names[symbol] || symbol;
}

/**
 * Hent alle aksjer med live data
 */
export async function fetchLiveStockData(): Promise<Stock[]> {
  try {
    const quotes = await fetchYahooFinanceData(WATCHLIST);
    
    if (quotes.length === 0) {
      console.warn('No data from Yahoo Finance, using fallback');
      // Return empty array - caller should handle fallback
      return [];
    }
    
    const stocks = quotes
      .filter(q => q.regularMarketPrice > 0)
      .map(convertToStock)
      .sort((a, b) => b.kScore - a.kScore);
    
    return stocks;
  } catch (error) {
    console.error('Error in fetchLiveStockData:', error);
    return [];
  }
}

/**
 * Check if market is open (Oslo time 9:00-16:20)
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const day = osloTime.getDay();
  const hours = osloTime.getHours();
  const minutes = osloTime.getMinutes();
  
  // Weekend
  if (day === 0 || day === 6) return false;
  
  // Market hours (9:00 - 16:20)
  const currentMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60;
  const marketClose = 16 * 60 + 20;
  
  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}
