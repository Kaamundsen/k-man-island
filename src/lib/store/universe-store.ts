// Universe Store - Manages configurable stock universe and custom tickers
// Supports 50/100/150/200 stock universes with dynamic additions via search
// Supports both Oslo and USA markets

import { 
  OSLO_STOCKS_50, 
  OSLO_STOCKS_100, 
  OSLO_STOCKS_150, 
  OSLO_STOCKS_200, 
  OSLO_STOCKS_FULL,
  USA_CORE_STOCKS,
  USA_INDEX_MEMBERSHIP,
  type USAIndexMembership,
} from '@/lib/constants';

export type UniverseSize = 50 | 100 | 150 | 200 | 'full';
export type MarketType = 'OSLO' | 'USA';

interface UniverseConfig {
  size: UniverseSize;
  customTickers: string[];
  // USA custom tickers stored separately
  usaCustomTickers: string[];
}

const STORAGE_KEY = 'k-man-universe-config';

const DEFAULT_CONFIG: UniverseConfig = {
  size: 100,
  customTickers: [],
  usaCustomTickers: [],
};

// Get the base universe based on size
export function getBaseUniverse(size: UniverseSize): string[] {
  switch (size) {
    case 50:
      return OSLO_STOCKS_50;
    case 100:
      return OSLO_STOCKS_100;
    case 150:
      return OSLO_STOCKS_150;
    case 200:
      return OSLO_STOCKS_200;
    case 'full':
      return OSLO_STOCKS_FULL;
    default:
      return OSLO_STOCKS_100;
  }
}

// Load config from localStorage
function loadConfig(): UniverseConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_CONFIG;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
      };
    }
  } catch (error) {
    console.error('Failed to load universe config:', error);
  }
  
  return DEFAULT_CONFIG;
}

// Save config to localStorage
function saveConfig(config: UniverseConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save universe config:', error);
  }
}

// Get current universe size
export function getUniverseSize(): UniverseSize {
  return loadConfig().size;
}

// Set universe size
export function setUniverseSize(size: UniverseSize): void {
  const config = loadConfig();
  config.size = size;
  saveConfig(config);
}

// Get custom tickers (normalize and deduplicate)
export function getCustomTickers(): string[] {
  const config = loadConfig();
  
  // Normalize: ensure all tickers have .OL suffix and are uppercase
  const normalized = config.customTickers.map(t => {
    const upper = t.toUpperCase();
    return upper.endsWith('.OL') ? upper : `${upper}.OL`;
  });
  
  // Deduplicate
  const unique = Array.from(new Set(normalized));
  
  // If there were changes, save back
  if (unique.length !== config.customTickers.length || 
      !unique.every((t, i) => t === config.customTickers[i])) {
    config.customTickers = unique;
    saveConfig(config);
  }
  
  return unique;
}

// Add a custom ticker (returns true if added, false if already exists)
export function addCustomTicker(ticker: string): boolean {
  const config = loadConfig();
  const upperTicker = ticker.toUpperCase();
  
  // Determine if this is a USA or Oslo ticker
  const isUSA = USA_CORE_STOCKS.includes(upperTicker) || 
                USA_CORE_STOCKS.includes(upperTicker.replace('.OL', ''));
  
  // Normalize ticker based on market
  let normalizedTicker: string;
  if (upperTicker.endsWith('.OL')) {
    // Already has .OL suffix - check if it's actually a USA ticker mistakenly suffixed
    const withoutSuffix = upperTicker.replace('.OL', '');
    if (USA_CORE_STOCKS.includes(withoutSuffix)) {
      normalizedTicker = withoutSuffix; // Remove .OL for USA stocks
    } else {
      normalizedTicker = upperTicker;
    }
  } else if (isUSA) {
    normalizedTicker = upperTicker; // USA stocks don't have suffix
  } else {
    normalizedTicker = `${upperTicker}.OL`; // Oslo stocks need .OL suffix
  }
  
  // Check if already in custom tickers (case-insensitive)
  const alreadyInCustom = config.customTickers.some(
    t => t.toUpperCase() === normalizedTicker.toUpperCase()
  );
  
  if (alreadyInCustom) {
    return false;
  }
  
  // Add to custom tickers
  config.customTickers.push(normalizedTicker);
  saveConfig(config);
  
  console.log(`✅ Added ${normalizedTicker} to Mine list`);
  return true;
}

// Remove a custom ticker (returns true if removed, false if not found)
export function removeCustomTicker(ticker: string): boolean {
  const config = loadConfig();
  
  // Normalize ticker for comparison
  const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.OL`;
  
  // Also check without .OL suffix
  const tickerWithoutSuffix = normalizedTicker.replace('.OL', '');
  
  const originalLength = config.customTickers.length;
  
  // Filter out the ticker (case-insensitive, handle both with and without .OL)
  config.customTickers = config.customTickers.filter(t => {
    const tUpper = t.toUpperCase();
    const tWithoutSuffix = tUpper.replace('.OL', '');
    return tUpper !== normalizedTicker && tWithoutSuffix !== tickerWithoutSuffix;
  });
  
  if (config.customTickers.length < originalLength) {
    saveConfig(config);
    console.log(`✅ Removed ${normalizedTicker} from Mine list`);
    return true;
  }
  
  return false;
}

// Check if a ticker is in the custom list
export function isCustomTicker(ticker: string): boolean {
  const customTickers = getCustomTickers();
  const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.OL`;
  
  return customTickers.some(t => t.toUpperCase() === normalizedTicker.toUpperCase());
}

// Get full universe (base + custom tickers)
export function getFullUniverse(): string[] {
  const config = loadConfig();
  const base = getBaseUniverse(config.size);
  const custom = getCustomTickers();
  
  // Combine and deduplicate
  const combined = new Set([...base, ...custom]);
  return Array.from(combined);
}

// Check if ticker exists in base universe
export function isInBaseUniverse(ticker: string): boolean {
  const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.OL`;
  
  return OSLO_STOCKS_FULL.some(t => t.toUpperCase() === normalizedTicker.toUpperCase());
}

// ============================================
// USA UNIVERSE FUNCTIONS
// ============================================

/**
 * Get the USA Core universe (S&P 100 + NASDAQ 100 combined)
 */
export function getUSAUniverse(): string[] {
  return USA_CORE_STOCKS;
}

/**
 * Get USA custom tickers
 */
export function getUSACustomTickers(): string[] {
  const config = loadConfig();
  return config.usaCustomTickers || [];
}

/**
 * Add a custom USA ticker
 */
export function addUSACustomTicker(ticker: string): boolean {
  const config = loadConfig();
  const normalizedTicker = ticker.toUpperCase();
  
  // Check if already in custom tickers
  const alreadyInCustom = (config.usaCustomTickers || []).some(
    t => t.toUpperCase() === normalizedTicker
  );
  
  if (alreadyInCustom) {
    return false;
  }
  
  // Check if already in USA_CORE_STOCKS
  if (USA_CORE_STOCKS.includes(normalizedTicker)) {
    return false;
  }
  
  config.usaCustomTickers = [...(config.usaCustomTickers || []), normalizedTicker];
  saveConfig(config);
  
  console.log(`✅ Added ${normalizedTicker} to USA custom list`);
  return true;
}

/**
 * Remove a custom USA ticker
 */
export function removeUSACustomTicker(ticker: string): boolean {
  const config = loadConfig();
  const normalizedTicker = ticker.toUpperCase();
  
  const originalLength = (config.usaCustomTickers || []).length;
  config.usaCustomTickers = (config.usaCustomTickers || []).filter(
    t => t.toUpperCase() !== normalizedTicker
  );
  
  if (config.usaCustomTickers.length < originalLength) {
    saveConfig(config);
    console.log(`✅ Removed ${normalizedTicker} from USA custom list`);
    return true;
  }
  
  return false;
}

/**
 * Get full USA universe (base + custom tickers)
 */
export function getFullUSAUniverse(): string[] {
  const custom = getUSACustomTickers();
  const combined = new Set([...USA_CORE_STOCKS, ...custom]);
  return Array.from(combined);
}

/**
 * Check if a ticker is in the USA universe
 */
export function isInUSAUniverse(ticker: string): boolean {
  const normalizedTicker = ticker.toUpperCase();
  return USA_CORE_STOCKS.includes(normalizedTicker);
}

/**
 * Get index membership for a USA stock
 * Returns 'SP100', 'NDX100', 'BOTH', or undefined if not in USA universe
 */
export function getUSAIndexMembership(ticker: string): USAIndexMembership | undefined {
  const normalizedTicker = ticker.toUpperCase();
  return USA_INDEX_MEMBERSHIP[normalizedTicker];
}

/**
 * Detect market from ticker
 * .OL suffix = Oslo, otherwise assume USA
 */
export function detectMarket(ticker: string): MarketType {
  return ticker.toUpperCase().endsWith('.OL') ? 'OSLO' : 'USA';
}

/**
 * Get universe by market
 */
export function getUniverseByMarket(market: MarketType): string[] {
  if (market === 'USA') {
    return getFullUSAUniverse();
  }
  return getFullUniverse();
}

/**
 * Get combined universe (both markets)
 */
export function getCombinedUniverse(): string[] {
  return [...getFullUniverse(), ...getFullUSAUniverse()];
}
