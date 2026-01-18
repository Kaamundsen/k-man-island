import { Stock } from '../types';
import { getFinnhubQuote, getFinnhubCandles, getInsiderTransactions, InsiderTransaction } from './finnhub';
import { analyzeKMomentum, DEFAULT_CONFIG } from './k-momentum';

// Watchlist - topp 50 mest likvide Oslo Børs aksjer
const WATCHLIST = [
  'EQNR.OL', 'DNB.OL', 'MOWI.OL', 'TEL.OL', 'YAR.OL',
  'ORK.OL', 'NHY.OL', 'SALM.OL', 'STB.OL', 'BAKKA.OL',
  'SUBC.OL', 'KOG.OL', 'SCATC.OL', 'GJF.OL', 'NSKOG.OL',
  'AKSO.OL', 'MPCC.OL', 'TGS.OL', 'PGS.OL', 'REC.OL',
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
 * Hent ALLE aksjer med K-Momentum analyse (brukes server-side)
 * Dette tar lengre tid, men gir komplett analyse
 */
export async function fetchAllStocksWithKMomentum(): Promise<Stock[]> {
  console.log('🚀 Fetching all stocks with K-Momentum analysis...');
  
  const results: Stock[] = [];
  
  // Fetch i batches for å unngå rate limiting
  const batchSize = 10;
  for (let i = 0; i < WATCHLIST.length; i += batchSize) {
    const batch = WATCHLIST.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (symbol) => {
      try {
        // Hent quote, candles og insider data parallelt
        const [quote, candles, insiderData] = await Promise.all([
          getFinnhubQuote(symbol),
          getFinnhubCandles(symbol, 250),
          getInsiderTransactions(symbol),
        ]);
        
        if (!quote || !candles) {
          console.warn(`⚠️ No data for ${symbol}`);
          return null;
        }
        
        // Kjør K-Momentum analyse
        const kmAnalysis = analyzeKMomentum(candles, quote.c, DEFAULT_CONFIG);
        
        // Kun inkluder hvis passed filters
        if (!kmAnalysis.passed) {
          console.log(`❌ ${symbol} failed: ${kmAnalysis.failedFilters.join(', ')}`);
          return null;
        }
        
        // Analyser insider-aktivitet
        const insiderAnalysis = analyzeInsiderActivity(insiderData || []);
        
        if (insiderAnalysis.buys > 0) {
          console.log(`🔍 ${symbol}: Insider data - ${insiderAnalysis.buys} kjøp, ${insiderAnalysis.sells} salg, Score: ${insiderAnalysis.score}, Netto: ${insiderAnalysis.netShares} aksjer`);
        }
        
        // Beregn RSI én gang
        const rsi = calculateRSI(candles.c, 14);
        
        console.log(`✅ ${symbol}: K-Score ${kmAnalysis.score}, R/R ${kmAnalysis.riskRewardRatio}, RSI ${rsi.toFixed(1)}, Insider ${insiderAnalysis.score}`);
        
        // Determine strategies - distinkte for forskjellige avkastningsmål
        const strategies: ('MOMENTUM' | 'BUFFETT' | 'TVEITEREID' | 'REBOUND' | 'INSIDER')[] = [];
        const riskRewardRatio = kmAnalysis.riskRewardRatio;
        const dailyVolume = quote.c * (candles.v[candles.v.length - 1] || 0);
        
        // MOMENTUM: For 100-200%+ avkastning - AGGRESSIV VEKST
        // Kriterier: Høy K-Score ELLER best Risk/Reward
        if (kmAnalysis.score >= 75 || riskRewardRatio >= 2.5) {
          strategies.push('MOMENTUM');
        }
        
        // BUFFETT: For stabil 20-50% avkastning - KVALITET
        // Kriterier: God K-Score, balansert RSI, moderat R/R
        if (kmAnalysis.score >= 70 && rsi >= 35 && rsi <= 65 && riskRewardRatio >= 1.5) {
          strategies.push('BUFFETT');
        }
        
        // TVEITEREID: For sikker 15-40% avkastning - LIKVIDITET
        // Kriterier: Høy omsetning, lett å handle
        if (dailyVolume > 8000000 && kmAnalysis.score >= 70) {
          strategies.push('TVEITEREID');
        }
        
        // INSIDER: For 30-80% avkastning - INSIDER EDGE
        // Kriterier: Betydelig innsidekjøp
        if (insiderAnalysis.score >= 40) {
          strategies.push('INSIDER');
          console.log(`📊 ${symbol} qualified for INSIDER strategy (score: ${insiderAnalysis.score})`);
        }
        
        // Fallback: Minst én strategi for alle aksjer
        if (strategies.length === 0) {
          strategies.push('BUFFETT'); // Default til BUFFETT
        }
        
        // Build Stock object
        const stock: Stock = {
          ticker: symbol,
          name: STOCK_NAMES[symbol] || symbol,
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
          kScore: kmAnalysis.score,
          rsi: rsi,
          signal: 'BUY', // All passed = BUY
          target: kmAnalysis.suggestedTarget,
          stopLoss: kmAnalysis.suggestedStop,
          gainKr: kmAnalysis.suggestedTarget - quote.c,
          gainPercent: ((kmAnalysis.suggestedTarget - quote.c) / quote.c) * 100,
          riskKr: quote.c - kmAnalysis.suggestedStop,
          riskPercent: ((quote.c - kmAnalysis.suggestedStop) / quote.c) * 100,
          timeHorizon: `${DEFAULT_CONFIG.timeLimitDays} dager`,
          market: 'OSLO',
          strategies,
          insiderScore: insiderAnalysis.score,
          insiderBuys: insiderAnalysis.buys,
          insiderNetShares: insiderAnalysis.netShares,
        };
        
        return stock;
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((s): s is Stock => s !== null));
    
    // Small delay between batches to avoid rate limiting (økt til 2s for insider-data)
    if (i + batchSize < WATCHLIST.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Sort by K-Momentum score
  results.sort((a, b) => b.kScore - a.kScore);
  
  console.log(`✨ Found ${results.length} K-Momentum candidates`);
  
  return results;
}

/**
 * Helper: Calculate RSI
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / period;
  const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / period;
  
  if (losses === 0) return 100;
  
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}

/**
 * Analyser insider-aktivitet og gi score
 */
interface InsiderAnalysis {
  score: number;       // 0-100 score
  buys: number;        // Antall kjøp
  sells: number;       // Antall salg
  netShares: number;   // Netto aksjer (kjøp - salg)
}

function analyzeInsiderActivity(transactions: InsiderTransaction[]): InsiderAnalysis {
  if (transactions.length === 0) {
    return { score: 0, buys: 0, sells: 0, netShares: 0 };
  }

  const buys = transactions.filter(t => t.transactionCode === 'P');
  const sells = transactions.filter(t => t.transactionCode === 'S');
  
  const buyCount = buys.length;
  const sellCount = sells.length;
  
  const buyShares = buys.reduce((sum, t) => sum + Math.abs(t.change), 0);
  const sellShares = sells.reduce((sum, t) => sum + Math.abs(t.change), 0);
  const netShares = buyShares - sellShares;
  
  // Score calculation (0-100)
  let score = 0;
  
  // 1. Buy-to-Sell ratio (0-40 points)
  if (buyCount + sellCount > 0) {
    const buyRatio = buyCount / (buyCount + sellCount);
    score += buyRatio * 40;
  }
  
  // 2. Net shares positive (0-30 points)
  if (netShares > 0) {
    // More net shares = higher score, capped at 30
    score += Math.min(30, (netShares / 10000) * 10);
  }
  
  // 3. Recent activity bonus (0-30 points)
  const recentBuys = buys.filter(t => {
    const daysSince = (Date.now() - new Date(t.transactionDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30; // Last 30 days
  });
  
  if (recentBuys.length > 0) {
    score += Math.min(30, recentBuys.length * 10);
  }
  
  return {
    score: Math.round(Math.min(100, score)),
    buys: buyCount,
    sells: sellCount,
    netShares: Math.round(netShares),
  };
}
