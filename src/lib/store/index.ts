/**
 * Store Index
 * 
 * Eksporterer enten lokal store eller Supabase basert på konfigurasjon.
 * Dette gjør det enkelt å bytte mellom lokal utvikling og produksjon.
 * 
 * Bruk:
 * - Lokalt: Sett NEXT_PUBLIC_USE_LOCAL_STORE=true i .env.local
 * - Produksjon: Fjern variabelen eller sett til false, og konfigurer Supabase
 */

// For nå eksporterer vi alltid lokal store
// TODO: Legg til Supabase-implementasjon og automatisk switch

export {
  // Portfolio functions
  getPortfolios,
  getPortfolio,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  
  // Trade functions
  getTrades,
  getTradesByPortfolio,
  getTradesByStrategy,
  getActiveTrades,
  createTrade,
  updateTrade,
  deleteTrade,
  
  // Dividend functions
  getDividends,
  getDividendsByTicker,
  createDividend,
  createDividendBulk,
  deleteDividend,
  getDividendSummary,
  getTotalDividends,
  
  // Statistics
  getPortfolioStats,
  getStrategyStats,
  
  // Initialization
  initializeLocalStore,
  clearLocalStore,
  exportLocalData,
  importLocalData,
} from './local-store';

// Re-export types
export type { Trade, Portfolio, TradeInput, TradeUpdate, Dividend, DividendInput, DividendSummary } from '../types';
