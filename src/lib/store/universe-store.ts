// Universe Store - Manages configurable stock universe and custom tickers
// Supports 50/100/150/200 stock universes with dynamic additions via search

import { OSLO_STOCKS_50, OSLO_STOCKS_100, OSLO_STOCKS_150, OSLO_STOCKS_200, OSLO_STOCKS_FULL } from '@/lib/constants';

export type UniverseSize = 50 | 100 | 150 | 200 | 'full';

interface UniverseConfig {
  size: UniverseSize;
  customTickers: string[];
}

const STORAGE_KEY = 'k-man-universe-config';

const DEFAULT_CONFIG: UniverseConfig = {
  size: 100,
  customTickers: [],
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
  
  // Normalize ticker
  const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
    ? ticker.toUpperCase() 
    : `${ticker.toUpperCase()}.OL`;
  
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
