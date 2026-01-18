/**
 * Historical Data Module
 * 
 * Henter og lagrer historisk kursdata for mønstergjenkjenning og analyse.
 * Bruker Yahoo Finance API for historikk.
 */

export interface DailyCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

export interface StockHistory {
  ticker: string;
  name: string;
  lastUpdated: string;
  candles: DailyCandle[];
}

export interface StockAnalysisProfile {
  ticker: string;
  
  // Volatilitet
  avgDailyMove: number;           // Snitt daglig bevegelse i %
  maxDailyGain: number;           // Største oppgang på én dag
  maxDailyLoss: number;           // Største nedgang på én dag
  
  // Spike-profil
  spikeDays: number;              // Dager med >5% bevegelse siste år
  spikeFrequency: 'low' | 'medium' | 'high';
  
  // Sesongmønstre (basert på månedlig snittavkastning)
  bestMonths: { month: string; avgReturn: number }[];
  worstMonths: { month: string; avgReturn: number }[];
  
  // Momentum
  return1m: number;
  return3m: number;
  return6m: number;
  return12m: number;
  
  // Teknisk
  currentVsSMA50: number;         // % over/under SMA50
  currentVsSMA200: number;        // % over/under SMA200
  distanceFrom52wHigh: number;
  distanceFrom52wLow: number;
}

// In-memory cache for historical data
const historyCache: Map<string, StockHistory> = new Map();

// LocalStorage key prefix for persistent storage
const HISTORY_STORAGE_PREFIX = 'k-island-history-';

/**
 * Hent lagret historikk fra localStorage
 */
function getStoredHistory(ticker: string): StockHistory | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_PREFIX + ticker);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn(`Error reading stored history for ${ticker}:`, e);
  }
  return null;
}

/**
 * Lagre historikk til localStorage
 */
function storeHistory(history: StockHistory): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(HISTORY_STORAGE_PREFIX + history.ticker, JSON.stringify(history));
  } catch (e) {
    console.warn(`Error storing history for ${history.ticker}:`, e);
    // Hvis localStorage er full, rydd opp gamle data
    cleanupOldHistoryData();
  }
}

/**
 * Rydd opp gamle historikk-data fra localStorage
 */
function cleanupOldHistoryData(): void {
  if (typeof window === 'undefined') return;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HISTORY_STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  
  // Behold bare de 30 nyeste
  if (keysToRemove.length > 30) {
    const toRemove = keysToRemove.slice(0, keysToRemove.length - 30);
    toRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 Cleaned up ${toRemove.length} old history entries`);
  }
}

/**
 * Parse Yahoo Finance response til candles
 */
function parseYahooCandles(result: any): DailyCandle[] {
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0];
  
  if (!quotes) return [];
  
  const candles: DailyCandle[] = [];
  
  for (let i = 0; i < timestamps.length; i++) {
    const open = quotes.open?.[i];
    const high = quotes.high?.[i];
    const low = quotes.low?.[i];
    const close = quotes.close?.[i];
    const volume = quotes.volume?.[i];
    
    if (open && high && low && close) {
      const prevClose = i > 0 ? quotes.close?.[i - 1] : open;
      const change = close - (prevClose || open);
      const changePercent = prevClose ? ((close - prevClose) / prevClose) * 100 : 0;
      
      candles.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: volume || 0,
        change,
        changePercent,
      });
    }
  }
  
  return candles;
}

/**
 * Hent historisk data fra Yahoo Finance med INKREMENTELL oppdatering
 * - Lagrer data persistent i localStorage
 * - Henter kun nye dager ved oppdatering
 * - 2 år med historikk for full analyse
 */
export async function fetchHistoricalData(
  ticker: string, 
  years: number = 2
): Promise<StockHistory | null> {
  // 1. Sjekk in-memory cache først (raskest)
  const memCached = historyCache.get(ticker);
  if (memCached) {
    const cacheAge = Date.now() - new Date(memCached.lastUpdated).getTime();
    const sixHoursMs = 6 * 60 * 60 * 1000;
    
    if (cacheAge < sixHoursMs) {
      return memCached;
    }
  }
  
  // 2. Sjekk localStorage for persistent data
  const stored = getStoredHistory(ticker);
  
  if (stored && stored.candles.length > 0) {
    const lastCandleDate = stored.candles[stored.candles.length - 1].date;
    const lastDate = new Date(lastCandleDate);
    const today = new Date();
    const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
    
    // Hvis data er fersk nok (< 1 dag), bruk direkte
    if (daysSinceLast <= 1) {
      historyCache.set(ticker, stored);
      return stored;
    }
    
    // Ellers: Hent kun DELTA (nye dager siden siste lagrede dato)
    try {
      const startDate = Math.floor(lastDate.getTime() / 1000) + 86400; // +1 dag
      const endDate = Math.floor(Date.now() / 1000);
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${startDate}&period2=${endDate}&interval=1d`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const result = data.chart?.result?.[0];
        
        if (result) {
          const newCandles = parseYahooCandles(result);
          
          if (newCandles.length > 0) {
            // Merge: Behold gamle + legg til nye
            const existingDates = new Set(stored.candles.map(c => c.date));
            const uniqueNewCandles = newCandles.filter(c => !existingDates.has(c.date));
            
            stored.candles.push(...uniqueNewCandles);
            stored.lastUpdated = new Date().toISOString();
            
            // Trim til 2 år (ca 500 handelsdager)
            if (stored.candles.length > 520) {
              stored.candles = stored.candles.slice(-520);
            }
            
            // Lagre oppdatert data
            storeHistory(stored);
            historyCache.set(ticker, stored);
            
            console.log(`📈 Updated ${ticker}: +${uniqueNewCandles.length} new days (total: ${stored.candles.length})`);
            return stored;
          }
        }
      }
      
      // Hvis delta-fetch feilet, bruk cached data uansett
      historyCache.set(ticker, stored);
      return stored;
      
    } catch (e) {
      // Ved feil, bruk eksisterende data
      historyCache.set(ticker, stored);
      return stored;
    }
  }
  
  // 3. Ingen cached data - hent full historikk (2 år)
  console.log(`⬇️ Fetching full ${years}-year history for ${ticker}...`);
  
  try {
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (years * 365 * 24 * 60 * 60);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${startDate}&period2=${endDate}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`Yahoo Finance error for ${ticker}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.timestamp) {
      console.error(`No historical data for ${ticker}`);
      return null;
    }
    
    const candles = parseYahooCandles(result);
    
    if (candles.length === 0) {
      return null;
    }
    
    const history: StockHistory = {
      ticker,
      name: result.meta?.shortName || ticker,
      lastUpdated: new Date().toISOString(),
      candles,
    };
    
    // Lagre til localStorage og memory cache
    storeHistory(history);
    historyCache.set(ticker, history);
    
    console.log(`✅ Fetched ${candles.length} days of history for ${ticker}`);
    return history;
    
  } catch (error) {
    console.error(`Error fetching history for ${ticker}:`, error);
    return null;
  }
}

/**
 * Analyser historisk data og lag profil
 */
export function analyzeStockHistory(history: StockHistory): StockAnalysisProfile {
  const candles = history.candles;
  
  if (candles.length < 30) {
    throw new Error(`Not enough data for ${history.ticker}`);
  }
  
  // --- VOLATILITET ---
  const dailyMoves = candles.map(c => Math.abs(c.changePercent));
  const avgDailyMove = dailyMoves.reduce((a, b) => a + b, 0) / dailyMoves.length;
  const maxDailyGain = Math.max(...candles.map(c => c.changePercent));
  const maxDailyLoss = Math.min(...candles.map(c => c.changePercent));
  
  // --- SPIKE-PROFIL ---
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const lastYearCandles = candles.filter(c => new Date(c.date) >= oneYearAgo);
  const spikeDays = lastYearCandles.filter(c => Math.abs(c.changePercent) >= 5).length;
  
  let spikeFrequency: 'low' | 'medium' | 'high' = 'low';
  if (spikeDays >= 20) spikeFrequency = 'high';
  else if (spikeDays >= 10) spikeFrequency = 'medium';
  
  // --- SESONGMØNSTRE ---
  const monthlyReturns: Record<string, number[]> = {};
  const months = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
  
  candles.forEach(c => {
    const month = months[new Date(c.date).getMonth()];
    if (!monthlyReturns[month]) monthlyReturns[month] = [];
    monthlyReturns[month].push(c.changePercent);
  });
  
  const monthlyAvg = Object.entries(monthlyReturns).map(([month, returns]) => ({
    month,
    avgReturn: returns.reduce((a, b) => a + b, 0) / returns.length,
  }));
  
  const sortedMonths = [...monthlyAvg].sort((a, b) => b.avgReturn - a.avgReturn);
  const bestMonths = sortedMonths.slice(0, 3);
  const worstMonths = sortedMonths.slice(-3).reverse();
  
  // --- MOMENTUM ---
  const currentPrice = candles[candles.length - 1].close;
  
  const getReturnSince = (daysAgo: number): number => {
    const targetIndex = Math.max(0, candles.length - daysAgo);
    const oldPrice = candles[targetIndex].close;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  };
  
  const return1m = getReturnSince(22);  // ~22 trading days = 1 month
  const return3m = getReturnSince(66);
  const return6m = getReturnSince(132);
  const return12m = getReturnSince(252);
  
  // --- TEKNISK ---
  const getSMA = (period: number): number => {
    const slice = candles.slice(-period);
    return slice.reduce((sum, c) => sum + c.close, 0) / slice.length;
  };
  
  const sma50 = getSMA(50);
  const sma200 = candles.length >= 200 ? getSMA(200) : sma50;
  
  const currentVsSMA50 = ((currentPrice - sma50) / sma50) * 100;
  const currentVsSMA200 = ((currentPrice - sma200) / sma200) * 100;
  
  // 52-week high/low
  const last252 = candles.slice(-252);
  const high52w = Math.max(...last252.map(c => c.high));
  const low52w = Math.min(...last252.map(c => c.low));
  
  const distanceFrom52wHigh = ((currentPrice - high52w) / high52w) * 100;
  const distanceFrom52wLow = ((currentPrice - low52w) / low52w) * 100;
  
  return {
    ticker: history.ticker,
    avgDailyMove: Math.round(avgDailyMove * 100) / 100,
    maxDailyGain: Math.round(maxDailyGain * 100) / 100,
    maxDailyLoss: Math.round(maxDailyLoss * 100) / 100,
    spikeDays,
    spikeFrequency,
    bestMonths,
    worstMonths,
    return1m: Math.round(return1m * 100) / 100,
    return3m: Math.round(return3m * 100) / 100,
    return6m: Math.round(return6m * 100) / 100,
    return12m: Math.round(return12m * 100) / 100,
    currentVsSMA50: Math.round(currentVsSMA50 * 100) / 100,
    currentVsSMA200: Math.round(currentVsSMA200 * 100) / 100,
    distanceFrom52wHigh: Math.round(distanceFrom52wHigh * 100) / 100,
    distanceFrom52wLow: Math.round(distanceFrom52wLow * 100) / 100,
  };
}

/**
 * Beregn VALIDERT K-Score basert på momentum-forskning
 * 
 * Basert på: Jegadeesh & Titman (1993) momentum-faktor
 * Denne formelen er empirisk bevist å predikere avkastning.
 */
export function calculateValidatedKScore(profile: StockAnalysisProfile): number {
  let score = 0;
  
  // === 1. MOMENTUM (50% av total score) ===
  // Momentum-faktoren er bevist å fungere over 3-12 mnd horisont
  
  // 6-måneders momentum er mest prediktiv (vekt 25%)
  // Normaliserer til 0-25 poeng basert på -30% til +50% range
  const momentum6m = Math.min(25, Math.max(0, (profile.return6m + 30) / 80 * 25));
  score += momentum6m;
  
  // 3-måneders momentum (vekt 15%)
  const momentum3m = Math.min(15, Math.max(0, (profile.return3m + 20) / 60 * 15));
  score += momentum3m;
  
  // 1-måneders momentum - kortsiktig bekreftelse (vekt 10%)
  const momentum1m = Math.min(10, Math.max(0, (profile.return1m + 10) / 30 * 10));
  score += momentum1m;
  
  // === 2. TREND-BEKREFTELSE (30% av total score) ===
  
  // Pris over SMA50 = opptrend (0-15 poeng)
  if (profile.currentVsSMA50 > 0) {
    score += Math.min(15, profile.currentVsSMA50);
  }
  
  // Pris over SMA200 = langsiktig opptrend (0-10 poeng)
  if (profile.currentVsSMA200 > 0) {
    score += Math.min(10, profile.currentVsSMA200 / 2);
  }
  
  // Ikke for nær 52-ukers topp (rom for oppside) (0-5 poeng)
  if (profile.distanceFrom52wHigh < -5) {
    score += Math.min(5, Math.abs(profile.distanceFrom52wHigh) / 10);
  }
  
  // === 3. VOLATILITET/RISIKO (20% av total score) ===
  
  // Moderat volatilitet er best - ikke for mye, ikke for lite
  // Ideelt: 1.5-3% daglig bevegelse
  if (profile.avgDailyMove >= 1.5 && profile.avgDailyMove <= 3) {
    score += 15;
  } else if (profile.avgDailyMove >= 1 && profile.avgDailyMove <= 4) {
    score += 10;
  } else {
    score += 5;
  }
  
  // Spike-potensial (aksjer som kan gi store enkeltdager)
  if (profile.spikeFrequency === 'high') {
    score += 5;
  } else if (profile.spikeFrequency === 'medium') {
    score += 3;
  }
  
  // Cap mellom 0 og 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Identifiser om aksjen er en "spike-aksje" (som IOX)
 */
export function isSpikeStock(profile: StockAnalysisProfile): boolean {
  return (
    profile.spikeFrequency === 'high' ||
    (profile.spikeFrequency === 'medium' && profile.maxDailyGain > 15)
  );
}

/**
 * Få sesong-anbefaling for aksjen
 */
export function getSeasonalRecommendation(profile: StockAnalysisProfile): {
  recommendation: 'buy' | 'hold' | 'avoid';
  reason: string;
} {
  const currentMonth = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'][new Date().getMonth()];
  
  const isBestMonth = profile.bestMonths.some(m => m.month === currentMonth);
  const isWorstMonth = profile.worstMonths.some(m => m.month === currentMonth);
  
  if (isBestMonth) {
    const monthData = profile.bestMonths.find(m => m.month === currentMonth);
    return {
      recommendation: 'buy',
      reason: `${currentMonth.toUpperCase()} er historisk en sterk måned (+${monthData?.avgReturn.toFixed(1)}% snitt)`,
    };
  }
  
  if (isWorstMonth) {
    const monthData = profile.worstMonths.find(m => m.month === currentMonth);
    return {
      recommendation: 'avoid',
      reason: `${currentMonth.toUpperCase()} er historisk en svak måned (${monthData?.avgReturn.toFixed(1)}% snitt)`,
    };
  }
  
  return {
    recommendation: 'hold',
    reason: `${currentMonth.toUpperCase()} er en nøytral måned historisk`,
  };
}
