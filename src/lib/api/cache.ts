import { Stock } from '../types';

// Server-side cache for stock data
let stocksCache: Stock[] | null = null;
let cacheTimestamp: number = 0;

// Oslo Børs åpningstider: 09:00-16:30 mandag-fredag (CET/CEST)
function isOsloMarketOpen(): boolean {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  
  const day = osloTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hours = osloTime.getHours();
  const minutes = osloTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Weekend
  if (day === 0 || day === 6) {
    return false;
  }
  
  // Market hours: 09:00 - 16:30
  const marketOpen = 9 * 60; // 09:00
  const marketClose = 16 * 60 + 30; // 16:30
  
  return timeInMinutes >= marketOpen && timeInMinutes <= marketClose;
}

// Get time until next market open in milliseconds
function getTimeUntilMarketOpen(): number {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  
  const day = osloTime.getDay();
  const hours = osloTime.getHours();
  const minutes = osloTime.getMinutes();
  
  // Calculate days until next market open
  let daysUntilOpen = 0;
  if (day === 0) daysUntilOpen = 1; // Sunday -> Monday
  else if (day === 6) daysUntilOpen = 2; // Saturday -> Monday
  else if (hours >= 16 && minutes > 30) daysUntilOpen = day === 5 ? 3 : 1; // After close
  
  // Next market open at 09:00
  const nextOpen = new Date(osloTime);
  nextOpen.setDate(nextOpen.getDate() + daysUntilOpen);
  nextOpen.setHours(9, 0, 0, 0);
  
  return nextOpen.getTime() - osloTime.getTime();
}

// Cache duration based on market status
function getCacheDuration(): number {
  if (isOsloMarketOpen()) {
    // During market hours: refresh every 5 minutes
    return 5 * 60 * 1000;
  } else {
    // After market close: cache until next market open
    return getTimeUntilMarketOpen();
  }
}

export function isCacheValid(): boolean {
  if (!stocksCache || stocksCache.length === 0) {
    return false;
  }
  
  const cacheDuration = getCacheDuration();
  const cacheAge = Date.now() - cacheTimestamp;
  
  console.log(`📊 Cache status: ${stocksCache.length} stocks, age: ${Math.round(cacheAge / 1000)}s, max: ${Math.round(cacheDuration / 1000)}s`);
  console.log(`🕐 Oslo market ${isOsloMarketOpen() ? 'OPEN' : 'CLOSED'}`);
  
  return cacheAge < cacheDuration;
}

export function getCachedStocks(): Stock[] | null {
  if (isCacheValid()) {
    console.log('✅ Using cached stock data');
    return stocksCache;
  }
  return null;
}

export function setCachedStocks(stocks: Stock[]): void {
  stocksCache = stocks;
  cacheTimestamp = Date.now();
  console.log(`💾 Cached ${stocks.length} stocks at ${new Date().toLocaleTimeString('nb-NO')}`);
}

export function getMarketStatus(): { isOpen: boolean; nextUpdate: string } {
  const isOpen = isOsloMarketOpen();
  
  if (isOpen) {
    return { isOpen, nextUpdate: '5 minutter' };
  } else {
    const msUntilOpen = getTimeUntilMarketOpen();
    const hoursUntil = Math.round(msUntilOpen / (1000 * 60 * 60));
    
    if (hoursUntil > 24) {
      const days = Math.round(hoursUntil / 24);
      return { isOpen, nextUpdate: `${days} dager` };
    }
    return { isOpen, nextUpdate: `${hoursUntil} timer` };
  }
}
