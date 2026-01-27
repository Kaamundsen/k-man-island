/**
 * stock-data.ts - CANONICAL SOURCE for live stock list fetching
 * 
 * Single source of truth for fetching stock lists from Yahoo Finance.
 * Uses Strategy Registry for V2-compliant scoring and filtering.
 * See docs/00_SOURCE_OF_TRUTH.md
 */

import { Stock, StockStrategy } from '../types';
import { 
  calculateStrategyScore, 
  passesStrategyFilters, 
  determineBestStrategy,
  StrategyId 
} from '../strategies/registry';
import { getFullUniverse } from '../store/universe-store';
import { USA_CORE_STOCKS } from '../constants';

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
  // OBX / Top 50
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
  'KOG.OL': 'Kongsberg Gruppen ASA',
  'SCATC.OL': 'Scatec ASA',
  'GJF.OL': 'Gjensidige Forsikring ASA',
  'NSKOG.OL': 'Norsk Skog ASA',
  'AKSO.OL': 'Aker Solutions ASA',
  'MPCC.OL': 'MPC Container Ships ASA',
  'TGS.OL': 'TGS ASA',
  'PGS.OL': 'PGS ASA',
  'REC.OL': 'REC Silicon ASA',
  'NAPA.OL': 'Napatech ASA',
  'XXL.OL': 'XXL ASA',
  'AURG.OL': 'Aurskog Sparebank',
  'BEWI.OL': 'BEWI ASA',
  'VAR.OL': 'Vår Energi ASA',
  'OKEA.OL': 'OKEA ASA',
  'NEL.OL': 'Nel ASA',
  'AFK.OL': 'Arendals Fossekompani ASA',
  'AKER.OL': 'Aker ASA',
  'BWO.OL': 'BW Offshore Limited',
  'FLNG.OL': 'Flex LNG Ltd',
  'GOGL.OL': 'Golden Ocean Group Ltd',
  'HAFNI.OL': 'Hafnia Limited',
  'HAVI.OL': 'Havila Shipping ASA',
  'KAHOT.OL': 'Kahoot! ASA',
  'LSG.OL': 'Lerøy Seafood Group ASA',
  'MULTI.OL': 'Multiconsult ASA',
  'NAS.OL': 'Norwegian Air Shuttle ASA',
  'NONG.OL': 'Norwegian Energy Company ASA',
  'NOD.OL': 'Nordic Semiconductor ASA',
  'NRS.OL': 'Norway Royal Salmon ASA',
  'PARB.OL': 'Pareto Bank ASA',
  'RECSI.OL': 'REC Silicon ASA',
  'SDRL.OL': 'Seadrill Limited',
  'SOFF.OL': 'Solstad Offshore ASA',
  'WSTEP.OL': 'Wallenius Wilhelmsen ASA',
  'WAWI.OL': 'Wallenius Wilhelmsen ASA',
  'BAKKA.OL': 'Bakkafrost P/F',
  'COOL.OL': 'Cool Company Ltd',
  'BORR.OL': 'Borr Drilling Limited',
  // 51-100
  'AGAS.OL': 'Avance Gas Holding Ltd',
  'ARCH.OL': 'Archer Limited',
  'AUTO.OL': 'Autostore Holdings Ltd',
  'BELCO.OL': 'Belships ASA',
  'BWLPG.OL': 'BW LPG Limited',
  'CADLR.OL': 'Cadeler ASA',
  'CRAYN.OL': 'Crayon Group Holding ASA',
  'DNO.OL': 'DNO ASA',
  'DOF.OL': 'DOF ASA',
  'ELMRA.OL': 'Elmera Group ASA',
  'EPR.OL': 'Europris ASA',
  'FJORD.OL': 'Fjordkraft Holding ASA',
  'FRO.OL': 'Frontline plc',
  'HAUTO.OL': 'Höegh Autoliners ASA',
  'HBC.OL': 'Huddlestock Fintech ASA',
  'IDEX.OL': 'IDEX Biometrics ASA',
  'INSR.OL': 'Insr Insurance Group ASA',
  'KIT.OL': 'Kitron ASA',
  'KVAER.OL': 'Kværner ASA',
  'LINK.OL': 'Link Mobility Group Holding ASA',
  'MEDI.OL': 'Medistim ASA',
  'MING.OL': 'Mowi ASA',
  'NANO.OL': 'NANO ASA',
  'NEXT.OL': 'NEXT Biometrics Group ASA',
  'NOM.OL': 'Nordic Mining ASA',
  'NRC.OL': 'NRC Group ASA',
  'OLT.OL': 'Olav Thon Eiendomsselskap ASA',
  'OTS.OL': 'Otovo ASA',
  'PHO.OL': 'Photocure ASA',
  'PLAY.OL': 'Play Magnus AS',
  'PROT.OL': 'Protector Forsikring ASA',
  'PSKY.OL': 'PetroNor E&P Ltd',
  'RAKP.OL': 'Rakkestad Sparebank',
  'RING.OL': 'SpareBank 1 Ringerike Hadeland',
  'SASNO.OL': 'SAS AB',
  'SCHB.OL': 'Sparebanken Sør',
  'SCHA.OL': 'Sparebank 1 Østlandet',
  'SNI.OL': 'Stolt-Nielsen Limited',
  'SRBNK.OL': 'SpareBank 1 SR-Bank ASA',
  'TECH.OL': 'Techstep ASA',
  'TOM.OL': 'Tomra Systems ASA',
  'ULTI.OL': 'Ultimovacs ASA',
  'VEI.OL': 'Veidekke ASA',
  'VOW.OL': 'Vow ASA',
  'WWI.OL': 'Wilh. Wilhelmsen Holding ASA',
  'ZAL.OL': 'Zalaris ASA',
  'ZWIPE.OL': 'Zwipe AS',
  'B2H.OL': 'B2Holding ASA',
  'AEGA.OL': 'Aega ASA',
  // Additional commonly traded
  'SATS.OL': 'Sats ASA',
  'TRMED.OL': 'Thor Medical ASA',
  'ENTRA.OL': 'Entra ASA',
  'ATEA.OL': 'Atea ASA',
  'AKVA.OL': 'AKVA Group ASA',
  'BOUV.OL': 'Bouvet ASA',
  'ZENA.OL': 'Zenith Energy Ltd',
};

// USA Stock Names (S&P 100 + NASDAQ 100)
const USA_STOCK_NAMES: Record<string, string> = {
  'AAPL': 'Apple Inc.',
  'ABBV': 'AbbVie Inc.',
  'ABNB': 'Airbnb Inc.',
  'ABT': 'Abbott Laboratories',
  'ACN': 'Accenture plc',
  'ADBE': 'Adobe Inc.',
  'ADI': 'Analog Devices Inc.',
  'ADP': 'Automatic Data Processing',
  'ADSK': 'Autodesk Inc.',
  'AEP': 'American Electric Power',
  'AIG': 'American International Group',
  'AMAT': 'Applied Materials Inc.',
  'AMD': 'Advanced Micro Devices',
  'AMGN': 'Amgen Inc.',
  'AMT': 'American Tower Corp.',
  'AMZN': 'Amazon.com Inc.',
  'ANSS': 'ANSYS Inc.',
  'APP': 'AppLovin Corp.',
  'ARM': 'Arm Holdings plc',
  'ASML': 'ASML Holding N.V.',
  'AVGO': 'Broadcom Inc.',
  'AXP': 'American Express Co.',
  'AZN': 'AstraZeneca PLC',
  'BA': 'Boeing Co.',
  'BAC': 'Bank of America Corp.',
  'BIIB': 'Biogen Inc.',
  'BK': 'Bank of New York Mellon',
  'BKNG': 'Booking Holdings Inc.',
  'BKR': 'Baker Hughes Co.',
  'BLK': 'BlackRock Inc.',
  'BMY': 'Bristol-Myers Squibb',
  'BRK-B': 'Berkshire Hathaway B',
  'C': 'Citigroup Inc.',
  'CAT': 'Caterpillar Inc.',
  'CCEP': 'Coca-Cola Europacific',
  'CDNS': 'Cadence Design Systems',
  'CDW': 'CDW Corp.',
  'CEG': 'Constellation Energy',
  'CHTR': 'Charter Communications',
  'CL': 'Colgate-Palmolive Co.',
  'CMCSA': 'Comcast Corp.',
  'COF': 'Capital One Financial',
  'COP': 'ConocoPhillips',
  'COST': 'Costco Wholesale Corp.',
  'CPRT': 'Copart Inc.',
  'CRM': 'Salesforce Inc.',
  'CRWD': 'CrowdStrike Holdings',
  'CSCO': 'Cisco Systems Inc.',
  'CSGP': 'CoStar Group Inc.',
  'CSX': 'CSX Corp.',
  'CTAS': 'Cintas Corp.',
  'CTSH': 'Cognizant Technology',
  'CVS': 'CVS Health Corp.',
  'CVX': 'Chevron Corp.',
  'DASH': 'DoorDash Inc.',
  'DDOG': 'Datadog Inc.',
  'DE': 'Deere & Company',
  'DHR': 'Danaher Corp.',
  'DIS': 'Walt Disney Co.',
  'DLTR': 'Dollar Tree Inc.',
  'DOW': 'Dow Inc.',
  'DUK': 'Duke Energy Corp.',
  'DXCM': 'DexCom Inc.',
  'EA': 'Electronic Arts Inc.',
  'EMR': 'Emerson Electric Co.',
  'EXC': 'Exelon Corp.',
  'F': 'Ford Motor Co.',
  'FANG': 'Diamondback Energy',
  'FAST': 'Fastenal Co.',
  'FDX': 'FedEx Corp.',
  'FTNT': 'Fortinet Inc.',
  'GD': 'General Dynamics Corp.',
  'GE': 'General Electric Co.',
  'GEHC': 'GE HealthCare Technologies',
  'GFS': 'GlobalFoundries Inc.',
  'GILD': 'Gilead Sciences Inc.',
  'GM': 'General Motors Co.',
  'GOOG': 'Alphabet Inc. Class C',
  'GOOGL': 'Alphabet Inc. Class A',
  'GS': 'Goldman Sachs Group',
  'HD': 'Home Depot Inc.',
  'HON': 'Honeywell International',
  'IBM': 'IBM Corp.',
  'IDXX': 'IDEXX Laboratories',
  'ILMN': 'Illumina Inc.',
  'INTC': 'Intel Corp.',
  'INTU': 'Intuit Inc.',
  'ISRG': 'Intuitive Surgical Inc.',
  'JNJ': 'Johnson & Johnson',
  'JPM': 'JPMorgan Chase & Co.',
  'KDP': 'Keurig Dr Pepper Inc.',
  'KHC': 'Kraft Heinz Co.',
  'KLAC': 'KLA Corp.',
  'KO': 'Coca-Cola Co.',
  'LIN': 'Linde plc',
  'LLY': 'Eli Lilly and Co.',
  'LMT': 'Lockheed Martin Corp.',
  'LOW': 'Lowe\'s Companies Inc.',
  'LRCX': 'Lam Research Corp.',
  'LULU': 'Lululemon Athletica',
  'MA': 'Mastercard Inc.',
  'MAR': 'Marriott International',
  'MCD': 'McDonald\'s Corp.',
  'MCHP': 'Microchip Technology',
  'MDB': 'MongoDB Inc.',
  'MDLZ': 'Mondelez International',
  'MDT': 'Medtronic plc',
  'MELI': 'MercadoLibre Inc.',
  'MET': 'MetLife Inc.',
  'META': 'Meta Platforms Inc.',
  'MMM': '3M Co.',
  'MNST': 'Monster Beverage Corp.',
  'MO': 'Altria Group Inc.',
  'MRK': 'Merck & Co. Inc.',
  'MRNA': 'Moderna Inc.',
  'MRVL': 'Marvell Technology',
  'MS': 'Morgan Stanley',
  'MSFT': 'Microsoft Corp.',
  'MU': 'Micron Technology Inc.',
  'NEE': 'NextEra Energy Inc.',
  'NFLX': 'Netflix Inc.',
  'NKE': 'Nike Inc.',
  'NVDA': 'NVIDIA Corp.',
  'NXPI': 'NXP Semiconductors',
  'ODFL': 'Old Dominion Freight',
  'ON': 'ON Semiconductor Corp.',
  'ORCL': 'Oracle Corp.',
  'ORLY': 'O\'Reilly Automotive',
  'PANW': 'Palo Alto Networks',
  'PAYX': 'Paychex Inc.',
  'PCAR': 'PACCAR Inc.',
  'PDD': 'PDD Holdings Inc.',
  'PEP': 'PepsiCo Inc.',
  'PFE': 'Pfizer Inc.',
  'PG': 'Procter & Gamble Co.',
  'PM': 'Philip Morris International',
  'PYPL': 'PayPal Holdings Inc.',
  'QCOM': 'Qualcomm Inc.',
  'REGN': 'Regeneron Pharmaceuticals',
  'ROST': 'Ross Stores Inc.',
  'RTX': 'RTX Corp.',
  'SBUX': 'Starbucks Corp.',
  'SCHW': 'Charles Schwab Corp.',
  'SMCI': 'Super Micro Computer',
  'SNPS': 'Synopsys Inc.',
  'SO': 'Southern Co.',
  'SPG': 'Simon Property Group',
  'T': 'AT&T Inc.',
  'TEAM': 'Atlassian Corp.',
  'TGT': 'Target Corp.',
  'TMO': 'Thermo Fisher Scientific',
  'TMUS': 'T-Mobile US Inc.',
  'TSLA': 'Tesla Inc.',
  'TTD': 'The Trade Desk Inc.',
  'TTWO': 'Take-Two Interactive',
  'TXN': 'Texas Instruments Inc.',
  'UNH': 'UnitedHealth Group Inc.',
  'UNP': 'Union Pacific Corp.',
  'UPS': 'United Parcel Service',
  'USB': 'U.S. Bancorp',
  'V': 'Visa Inc.',
  'VRSK': 'Verisk Analytics Inc.',
  'VRTX': 'Vertex Pharmaceuticals',
  'VZ': 'Verizon Communications',
  'WBA': 'Walgreens Boots Alliance',
  'WBD': 'Warner Bros. Discovery',
  'WDAY': 'Workday Inc.',
  'WFC': 'Wells Fargo & Co.',
  'WMT': 'Walmart Inc.',
  'XEL': 'Xcel Energy Inc.',
  'XOM': 'Exxon Mobil Corp.',
  'ZS': 'Zscaler Inc.',
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
 * Uses Strategy Registry for V2-compliant strategy detection
 */
function convertToStock(quote: YahooQuote): Stock {
  const indicators = calculateTechnicalIndicators(quote);
  const isOslo = quote.symbol.endsWith('.OL');
  
  // Get stock name from appropriate source
  const stockName = isOslo 
    ? (STOCK_NAMES[quote.symbol] || quote.symbol)
    : (USA_STOCK_NAMES[quote.symbol] || quote.symbol);
  
  // Create preliminary stock for strategy evaluation
  const prelimStock: Stock = {
    ticker: quote.symbol,
    name: stockName,
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
    timeHorizon: '2-6 uker',
    market: isOslo ? 'OSLO' : 'USA',
    strategies: [],
  };
  
  // V2: Use registry to determine qualifying strategies
  const strategies: StockStrategy[] = [];
  const strategyChecks: Array<{ id: StrategyId; mapped: StockStrategy }> = [
    { id: 'MOMENTUM_TREND', mapped: 'MOMENTUM_TREND' },
    { id: 'MOMENTUM_ASYM', mapped: 'MOMENTUM_ASYM' },
    { id: 'BUFFETT', mapped: 'BUFFETT' },
    { id: 'TVEITEREID', mapped: 'TVEITEREID' },
    { id: 'REBOUND', mapped: 'REBOUND' },
  ];
  
  for (const check of strategyChecks) {
    const { passed } = passesStrategyFilters(prelimStock, check.id);
    if (passed) {
      strategies.push(check.mapped);
    }
  }
  
  // V2: Use registry to determine best strategy and final signal
  const bestStrategy = determineBestStrategy(prelimStock);
  
  // Determine signal based on strategy qualification
  // If stock passes any BUY strategy with good score → BUY
  // If stock doesn't pass any strategy → HOLD
  // RSI overbought or very negative → SELL
  let finalSignal: 'BUY' | 'HOLD' | 'SELL' = indicators.signal;
  
  if (strategies.length > 0 && bestStrategy.score >= 60) {
    finalSignal = 'BUY';
  } else if (strategies.length === 0 && indicators.kScore < 50) {
    finalSignal = 'HOLD';
  }
  
  // Note: Quick analysis from Yahoo 1d data has limited history
  // Full analysis should use /api/analysis/[ticker] endpoint
  return {
    ...prelimStock,
    signal: finalSignal,
    strategies: strategies.length > 0 ? strategies : ['MOMENTUM_TREND'],
    timeHorizon: finalSignal === 'BUY' ? '2-6 uker' : '4-8 uker',
    // Data quality flags - quick scan has limited data
    dataSource: 'yahoo',
    historyDays: 1,
    insufficientHistory: true,
  };
}

// In-memory cache for stock data
let stockCache: { data: Stock[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

/**
 * CANONICAL: Fetch live stock data for the full watchlist (Oslo + USA)
 * Returns sorted list by K-Score
 * Uses in-memory cache to avoid redundant API calls
 * 
 * @param limit - Optional limit on number of stocks to return (default: all)
 * @param market - Optional filter: 'OSLO', 'USA', or undefined for all
 */
export async function fetchLiveStockData(limit?: number, market?: 'OSLO' | 'USA'): Promise<Stock[]> {
  try {
    // Check cache first (only for full fetches without market filter)
    if (!market && stockCache && (Date.now() - stockCache.timestamp) < CACHE_TTL_MS) {
      console.log(`📦 Using cached stock data (${stockCache.data.length} stocks, age: ${Math.round((Date.now() - stockCache.timestamp) / 1000)}s)`);
      const cached = stockCache.data;
      return limit && limit > 0 ? cached.slice(0, limit) : cached;
    }
    
    // Determine which lists to fetch
    const osloList = market === 'USA' ? [] : getFullUniverse();
    const usaList = market === 'OSLO' ? [] : USA_CORE_STOCKS;
    const combinedList = [...osloList, ...usaList];
    
    console.log(`🔄 Fetching live stock data from Yahoo Finance (Oslo: ${osloList.length}, USA: ${usaList.length})...`);
    
    // Fetch in batches to avoid rate limiting
    const batchSize = 50;
    const allQuotes: YahooQuote[] = [];
    
    for (let i = 0; i < combinedList.length; i += batchSize) {
      const batch = combinedList.slice(i, i + batchSize);
      const batchQuotes = await fetchYahooFinanceData(batch);
      allQuotes.push(...batchQuotes);
      
      // Small delay between batches to be nice to the API
      if (i + batchSize < combinedList.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (allQuotes.length === 0) {
      console.warn('⚠️ No data from Yahoo Finance');
      return [];
    }
    
    const stocks = allQuotes
      .filter(q => q.regularMarketPrice > 0)
      .map(convertToStock)
      .sort((a, b) => b.kScore - a.kScore);
    
    console.log(`✅ Fetched ${stocks.length} stocks from Yahoo Finance (Oslo: ${stocks.filter(s => s.market === 'OSLO').length}, USA: ${stocks.filter(s => s.market === 'USA').length})`);
    
    // Update cache (only for full fetches)
    if (!market) {
      stockCache = { data: stocks, timestamp: Date.now() };
    }
    
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
