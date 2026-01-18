/**
 * Local Store - Lokal lagring for utvikling uten Supabase
 * 
 * Bruker localStorage i nettleseren for å lagre data.
 * Data forsvinner IKKE ved refresh, men er kun på din maskin.
 * 
 * For produksjon: Bytt til Supabase
 */

import { Trade, Portfolio, TradeInput, TradeUpdate, Dividend, DividendInput, DividendSummary } from '../types';
import { StrategyId, STRATEGIES } from '../strategies';

// ============================================
// LOCAL STORAGE KEYS
// ============================================
const STORAGE_KEYS = {
  PORTFOLIOS: 'kman_portfolios',
  TRADES: 'kman_trades',
  SIGNALS: 'kman_signals',
  DIVIDENDS: 'kman_dividends',
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface StoredTrade extends Omit<Trade, 'entryDate' | 'timeHorizonEnd' | 'exitDate' | 'createdAt' | 'updatedAt'> {
  entryDate: string;
  timeHorizonEnd: string;
  exitDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StoredPortfolio extends Omit<Portfolio, 'trades' | 'createdAt' | 'updatedAt'> {
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// DEFAULT DATA
// ============================================

const DEFAULT_PORTFOLIOS: StoredPortfolio[] = [
  {
    id: 'portfolio-momentum-trend',
    name: 'Momentum Trend',
    description: 'Trygg momentum-strategi for 50-100% avkastning',
    strategyId: 'MOMENTUM_TREND',
    allowedStrategies: ['MOMENTUM_TREND'],
  },
  {
    id: 'portfolio-momentum-asym',
    name: 'Momentum Asymmetrisk', 
    description: 'Høy risiko/høy belønning for 100-200%+',
    strategyId: 'MOMENTUM_ASYM',
    allowedStrategies: ['MOMENTUM_ASYM'],
  },
  {
    id: 'portfolio-mixed',
    name: 'Blandet Portefølje',
    description: 'Alle strategier tillatt - inkludert YOLO, tips og ekspert-strategier',
    allowedStrategies: ['MOMENTUM_TREND', 'MOMENTUM_ASYM', 'BUFFETT', 'TVEITEREID', 'INSIDER', 'DAYTRADER', 'SWING_SHORT', 'REBOUND', 'DIVIDEND_HUNTER', 'YOLO', 'FOMO', 'TIPS', 'HODL', 'UKENS_AKSJE'],
  },
  {
    id: 'portfolio-daytrading',
    name: 'Daytrading',
    description: 'Kun daglig trading',
    strategyId: 'DAYTRADER',
    allowedStrategies: ['DAYTRADER', 'SWING_SHORT'],
  },
  {
    id: 'portfolio-dividend',
    name: 'Utbytte',
    description: 'Langsiktig utbytteportefølje',
    strategyId: 'DIVIDEND_HUNTER',
    allowedStrategies: ['DIVIDEND_HUNTER', 'BUFFETT'],
  },
  {
    id: 'portfolio-value',
    name: 'Verdi & Kvalitet',
    description: 'Buffett-stil kvalitetsaksjer',
    strategyId: 'BUFFETT',
    allowedStrategies: ['BUFFETT', 'INSIDER'],
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// PORTFOLIO FUNCTIONS
// ============================================

export function getPortfolios(): Portfolio[] {
  const stored = getFromStorage<StoredPortfolio[]>(STORAGE_KEYS.PORTFOLIOS, DEFAULT_PORTFOLIOS);
  const trades = getTrades();
  
  return stored.map(p => ({
    ...p,
    trades: trades.filter(t => t.portfolioId === p.id),
    createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
    updatedAt: p.updatedAt ? new Date(p.updatedAt) : undefined,
  }));
}

export function getPortfolio(id: string): Portfolio | null {
  const portfolios = getPortfolios();
  return portfolios.find(p => p.id === id) || null;
}

export function createPortfolio(data: {
  name: string;
  description?: string;
  strategyId?: StrategyId;
  allowedStrategies?: StrategyId[];
}): Portfolio {
  const portfolios = getFromStorage<StoredPortfolio[]>(STORAGE_KEYS.PORTFOLIOS, DEFAULT_PORTFOLIOS);
  
  const newPortfolio: StoredPortfolio = {
    id: `portfolio-${generateId()}`,
    name: data.name,
    description: data.description,
    strategyId: data.strategyId,
    allowedStrategies: data.allowedStrategies || (data.strategyId ? [data.strategyId] : undefined),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  portfolios.push(newPortfolio);
  saveToStorage(STORAGE_KEYS.PORTFOLIOS, portfolios);
  
  return {
    ...newPortfolio,
    trades: [],
    createdAt: new Date(newPortfolio.createdAt!),
    updatedAt: new Date(newPortfolio.updatedAt!),
  };
}

export function updatePortfolio(id: string, data: {
  name?: string;
  description?: string;
  strategyId?: StrategyId;
  allowedStrategies?: StrategyId[];
}): Portfolio | null {
  const portfolios = getFromStorage<StoredPortfolio[]>(STORAGE_KEYS.PORTFOLIOS, DEFAULT_PORTFOLIOS);
  const index = portfolios.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  portfolios[index] = {
    ...portfolios[index],
    name: data.name ?? portfolios[index].name,
    description: data.description ?? portfolios[index].description,
    strategyId: data.strategyId ?? portfolios[index].strategyId,
    allowedStrategies: data.allowedStrategies ?? portfolios[index].allowedStrategies,
    updatedAt: new Date().toISOString(),
  };
  
  saveToStorage(STORAGE_KEYS.PORTFOLIOS, portfolios);
  
  const updated = portfolios[index];
  const trades = getTrades();
  const { createdAt, updatedAt, ...rest } = updated;
  
  return {
    ...rest,
    trades: trades.filter(t => t.portfolioId === id),
    createdAt: createdAt ? new Date(createdAt) : undefined,
    updatedAt: new Date(updatedAt!),
  };
}

export function deletePortfolio(id: string): boolean {
  const portfolios = getFromStorage<StoredPortfolio[]>(STORAGE_KEYS.PORTFOLIOS, DEFAULT_PORTFOLIOS);
  const filtered = portfolios.filter(p => p.id !== id);
  
  if (filtered.length === portfolios.length) return false;
  
  saveToStorage(STORAGE_KEYS.PORTFOLIOS, filtered);
  
  // Slett også trades i denne porteføljen
  const trades = getFromStorage<StoredTrade[]>(STORAGE_KEYS.TRADES, []);
  const filteredTrades = trades.filter(t => t.portfolioId !== id);
  saveToStorage(STORAGE_KEYS.TRADES, filteredTrades);
  
  return true;
}

// ============================================
// TRADE FUNCTIONS
// ============================================

export function getTrades(): Trade[] {
  const stored = getFromStorage<StoredTrade[]>(STORAGE_KEYS.TRADES, []);
  
  return stored.map(t => ({
    ...t,
    entryDate: new Date(t.entryDate),
    timeHorizonEnd: new Date(t.timeHorizonEnd),
    exitDate: t.exitDate ? new Date(t.exitDate) : undefined,
    createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
    updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
  }));
}

export function getTradesByPortfolio(portfolioId: string): Trade[] {
  return getTrades().filter(t => t.portfolioId === portfolioId);
}

export function getTradesByStrategy(strategyId: StrategyId): Trade[] {
  return getTrades().filter(t => t.strategyId === strategyId);
}

export function getActiveTrades(): Trade[] {
  return getTrades().filter(t => t.status === 'ACTIVE');
}

export function createTrade(input: TradeInput): Trade {
  const trades = getFromStorage<StoredTrade[]>(STORAGE_KEYS.TRADES, []);
  
  const newTrade: StoredTrade = {
    id: `trade-${generateId()}`,
    ticker: input.ticker,
    name: input.name,
    entryPrice: input.entryPrice,
    quantity: input.quantity,
    entryDate: input.entryDate.toISOString(),
    portfolioId: input.portfolioId,
    strategyId: input.strategyId,
    stopLoss: input.stopLoss,
    target: input.target,
    timeHorizonEnd: input.timeHorizonEnd.toISOString(),
    status: 'ACTIVE',
    deadMoneyWarning: false,
    daysHeld: 0,
    notes: input.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  trades.push(newTrade);
  saveToStorage(STORAGE_KEYS.TRADES, trades);
  
  console.log(`✅ Trade created: ${input.ticker} (${input.strategyId})`);
  
  return {
    ...newTrade,
    entryDate: new Date(newTrade.entryDate),
    timeHorizonEnd: new Date(newTrade.timeHorizonEnd),
    exitDate: newTrade.exitDate ? new Date(newTrade.exitDate) : undefined,
    createdAt: new Date(newTrade.createdAt!),
    updatedAt: new Date(newTrade.updatedAt!),
  };
}

export function updateTrade(update: TradeUpdate): Trade | null {
  const trades = getFromStorage<StoredTrade[]>(STORAGE_KEYS.TRADES, []);
  const index = trades.findIndex(t => t.id === update.id);
  
  if (index === -1) return null;
  
  const trade = trades[index];
  
  trades[index] = {
    ...trade,
    // Grunnleggende felt
    ticker: update.ticker ?? trade.ticker,
    name: update.name ?? trade.name,
    entryPrice: update.entryPrice ?? trade.entryPrice,
    quantity: update.quantity ?? trade.quantity,
    entryDate: update.entryDate?.toISOString() ?? trade.entryDate,
    portfolioId: update.portfolioId ?? trade.portfolioId,
    strategyId: update.strategyId ?? trade.strategyId,
    // Trading-plan
    stopLoss: update.stopLoss ?? trade.stopLoss,
    target: update.target ?? trade.target,
    timeHorizonEnd: update.timeHorizonEnd?.toISOString() ?? trade.timeHorizonEnd,
    // Status og exit
    status: update.status ?? trade.status,
    exitPrice: update.exitPrice ?? trade.exitPrice,
    exitDate: update.exitDate?.toISOString() ?? trade.exitDate,
    exitReason: update.exitReason ?? trade.exitReason,
    // Notater
    notes: update.notes ?? trade.notes,
    updatedAt: new Date().toISOString(),
  };
  
  // Beregn P/L hvis lukket
  if (update.exitPrice && update.status && update.status !== 'ACTIVE') {
    const entryValue = trades[index].entryPrice * trades[index].quantity;
    const exitValue = update.exitPrice * trades[index].quantity;
    trades[index].realizedPnL = exitValue - entryValue;
    trades[index].realizedPnLPercent = ((exitValue - entryValue) / entryValue) * 100;
  }
  
  saveToStorage(STORAGE_KEYS.TRADES, trades);
  
  console.log(`✅ Trade updated: ${trades[index].ticker}`);
  
  const updated = trades[index];
  const { entryDate, timeHorizonEnd, exitDate, createdAt, updatedAt, ...rest } = updated;
  return {
    ...rest,
    entryDate: new Date(entryDate),
    timeHorizonEnd: new Date(timeHorizonEnd),
    exitDate: exitDate ? new Date(exitDate) : undefined,
    createdAt: createdAt ? new Date(createdAt) : undefined,
    updatedAt: new Date(updatedAt!),
  };
}

export function deleteTrade(id: string): boolean {
  const trades = getFromStorage<StoredTrade[]>(STORAGE_KEYS.TRADES, []);
  const filtered = trades.filter(t => t.id !== id);
  
  if (filtered.length === trades.length) return false;
  
  saveToStorage(STORAGE_KEYS.TRADES, filtered);
  return true;
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

export function getPortfolioStats(portfolioId: string) {
  const trades = getTradesByPortfolio(portfolioId);
  
  const activeTrades = trades.filter(t => t.status === 'ACTIVE');
  const closedTrades = trades.filter(t => t.status !== 'ACTIVE');
  const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
  
  const totalInvested = activeTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
  const totalRealizedPnL = closedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  
  return {
    totalTrades: trades.length,
    activeTrades: activeTrades.length,
    closedTrades: closedTrades.length,
    totalInvested,
    totalRealizedPnL,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
  };
}

export function getStrategyStats(strategyId: StrategyId) {
  const trades = getTradesByStrategy(strategyId);
  const closedTrades = trades.filter(t => t.status !== 'ACTIVE');
  const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
  
  return {
    totalTrades: trades.length,
    activeTrades: trades.filter(t => t.status === 'ACTIVE').length,
    closedTrades: closedTrades.length,
    winRate: closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0,
    totalPnL: closedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0),
    avgReturn: closedTrades.length > 0 
      ? closedTrades.reduce((sum, t) => sum + (t.realizedPnLPercent || 0), 0) / closedTrades.length 
      : 0,
  };
}

// ============================================
// DIVIDEND FUNCTIONS
// ============================================

interface StoredDividend {
  id: string;
  ticker: string;
  name?: string;
  date: string;
  quantity: number;
  dividendPerShare: number;
  totalAmount: number;
  currency: string;
  source?: 'NORDNET' | 'MANUAL';
  createdAt?: string;
}

export function getDividends(): Dividend[] {
  const stored = getFromStorage<StoredDividend[]>(STORAGE_KEYS.DIVIDENDS, []);
  return stored.map(d => ({
    ...d,
    date: new Date(d.date),
    createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
  }));
}

export function getDividendsByTicker(ticker: string): Dividend[] {
  return getDividends().filter(d => d.ticker === ticker);
}

export function createDividend(data: DividendInput): Dividend {
  const dividends = getFromStorage<StoredDividend[]>(STORAGE_KEYS.DIVIDENDS, []);
  
  const newDividend: StoredDividend = {
    id: `div-${generateId()}`,
    ticker: data.ticker,
    name: data.name,
    date: data.date instanceof Date ? data.date.toISOString() : data.date,
    quantity: data.quantity,
    dividendPerShare: data.dividendPerShare,
    totalAmount: data.totalAmount,
    currency: data.currency || 'NOK',
    source: 'MANUAL',
    createdAt: new Date().toISOString(),
  };
  
  dividends.push(newDividend);
  saveToStorage(STORAGE_KEYS.DIVIDENDS, dividends);
  
  return {
    ...newDividend,
    date: new Date(newDividend.date),
    createdAt: new Date(newDividend.createdAt!),
  };
}

export function createDividendBulk(dividends: DividendInput[]): Dividend[] {
  const existing = getFromStorage<StoredDividend[]>(STORAGE_KEYS.DIVIDENDS, []);
  
  const newDividends: StoredDividend[] = dividends.map((d, i) => ({
    id: `div-${Date.now()}-${i}`,
    ticker: d.ticker,
    name: d.name,
    date: d.date instanceof Date ? d.date.toISOString() : d.date,
    quantity: d.quantity,
    dividendPerShare: d.dividendPerShare,
    totalAmount: d.totalAmount,
    currency: d.currency || 'NOK',
    source: 'NORDNET' as const,
    createdAt: new Date().toISOString(),
  }));
  
  saveToStorage(STORAGE_KEYS.DIVIDENDS, [...existing, ...newDividends]);
  
  return newDividends.map(d => ({
    ...d,
    date: new Date(d.date),
    createdAt: new Date(d.createdAt!),
  }));
}

export function deleteDividend(id: string): boolean {
  const dividends = getFromStorage<StoredDividend[]>(STORAGE_KEYS.DIVIDENDS, []);
  const filtered = dividends.filter(d => d.id !== id);
  
  if (filtered.length === dividends.length) return false;
  
  saveToStorage(STORAGE_KEYS.DIVIDENDS, filtered);
  return true;
}

export function getDividendSummary(): DividendSummary[] {
  const dividends = getDividends();
  const byTicker = new Map<string, Dividend[]>();
  
  dividends.forEach(d => {
    const existing = byTicker.get(d.ticker) || [];
    byTicker.set(d.ticker, [...existing, d]);
  });
  
  const summaries: DividendSummary[] = [];
  
  byTicker.forEach((divs, ticker) => {
    const totalDividends = divs.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalShares = divs.reduce((sum, d) => sum + d.quantity, 0);
    const sortedByDate = [...divs].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    summaries.push({
      ticker,
      name: divs[0].name,
      totalDividends,
      dividendCount: divs.length,
      avgDividendPerShare: totalShares > 0 ? totalDividends / totalShares : 0,
      lastDividendDate: sortedByDate[0]?.date,
    });
  });
  
  return summaries.sort((a, b) => b.totalDividends - a.totalDividends);
}

export function getTotalDividends(): number {
  const dividends = getDividends();
  return dividends.reduce((sum, d) => sum + d.totalAmount, 0);
}

// ============================================
// INITIALIZATION
// ============================================

export function initializeLocalStore(): void {
  // Hent eksisterende porteføljer
  let existing = getFromStorage<StoredPortfolio[]>(STORAGE_KEYS.PORTFOLIOS, []);
  
  if (existing.length === 0) {
    // Ingen eksisterende - bruk alle standard porteføljer
    saveToStorage(STORAGE_KEYS.PORTFOLIOS, DEFAULT_PORTFOLIOS);
    console.log('✅ Local store initialized with default portfolios');
  } else {
    // Fjern duplikat-porteføljer (samme navn) - behold den med flest trades
    const portfoliosByName = new Map<string, StoredPortfolio[]>();
    existing.forEach(p => {
      const key = p.name.toLowerCase();
      if (!portfoliosByName.has(key)) {
        portfoliosByName.set(key, []);
      }
      portfoliosByName.get(key)!.push(p);
    });
    
    // Filtrer ut duplikater
    const deduped: StoredPortfolio[] = [];
    let removedCount = 0;
    
    portfoliosByName.forEach((portfolios, _name) => {
      if (portfolios.length > 1) {
        // Behold den første standard-porteføljen, eller den første i listen
        const sorted = portfolios.sort((a, b) => {
          const aIsDefault = DEFAULT_PORTFOLIOS.some(dp => dp.id === a.id);
          const bIsDefault = DEFAULT_PORTFOLIOS.some(dp => dp.id === b.id);
          // Prioriter standard-porteføljer
          if (aIsDefault && !bIsDefault) return -1;
          if (!aIsDefault && bIsDefault) return 1;
          return 0;
        });
        
        // Behold kun den første
        const keeper = sorted[0];
        removedCount += sorted.length - 1;
        deduped.push(keeper);
      } else {
        deduped.push(portfolios[0]);
      }
    });
    
    if (removedCount > 0) {
      console.log(`🧹 Fjernet ${removedCount} duplikat-porteføljer`);
      existing = deduped;
    }
    
    // Sjekk om alle standard-porteføljer finnes, legg til manglende
    const existingIds = existing.map(p => p.id);
    const missingPortfolios = DEFAULT_PORTFOLIOS.filter(dp => !existingIds.includes(dp.id));
    
    if (missingPortfolios.length > 0 || removedCount > 0) {
      const updated = [...existing, ...missingPortfolios];
      saveToStorage(STORAGE_KEYS.PORTFOLIOS, updated);
      if (missingPortfolios.length > 0) {
        console.log(`✅ Added ${missingPortfolios.length} missing default portfolios:`, missingPortfolios.map(p => p.name));
      }
    }
  }
}

// ============================================
// DEBUG / RESET
// ============================================

export function clearLocalStore(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(STORAGE_KEYS.PORTFOLIOS);
  localStorage.removeItem(STORAGE_KEYS.TRADES);
  localStorage.removeItem(STORAGE_KEYS.SIGNALS);
  localStorage.removeItem(STORAGE_KEYS.DIVIDENDS);
  
  console.log('🗑️ Local store cleared');
}

export function exportLocalData(): string {
  return JSON.stringify({
    portfolios: getFromStorage(STORAGE_KEYS.PORTFOLIOS, []),
    trades: getFromStorage(STORAGE_KEYS.TRADES, []),
    dividends: getFromStorage(STORAGE_KEYS.DIVIDENDS, []),
  }, null, 2);
}

export function importLocalData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.portfolios) {
      saveToStorage(STORAGE_KEYS.PORTFOLIOS, data.portfolios);
    }
    if (data.trades) {
      saveToStorage(STORAGE_KEYS.TRADES, data.trades);
    }
    if (data.dividends) {
      saveToStorage(STORAGE_KEYS.DIVIDENDS, data.dividends);
    }
    
    console.log('✅ Data imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}
