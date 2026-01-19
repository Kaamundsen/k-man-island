/**
 * Application Constants
 * 
 * Centralized configuration values used across the application.
 */

// ============================================
// CHART & ANALYSIS CONSTANTS
// ============================================

/**
 * Minimum number of bars (candles) required for meaningful analysis
 */
export const MIN_BARS_FOR_ANALYSIS = 50;

/**
 * Recommended number of bars for optimal analysis accuracy
 */
export const RECOMMENDED_BARS = 200;

/**
 * Default lookback period for technical indicators
 */
export const DEFAULT_LOOKBACK_DAYS = 365;

// ============================================
// TRADING CONSTANTS
// ============================================

/**
 * Default risk percentage per trade
 */
export const DEFAULT_RISK_PERCENT = 1;

/**
 * Maximum risk percentage allowed per trade
 */
export const MAX_RISK_PERCENT = 2;

/**
 * Default target R/R ratio
 */
export const DEFAULT_RR_RATIO = 2.5;

// ============================================
// API CONSTANTS
// ============================================

/**
 * Default cache TTL in seconds
 */
export const DEFAULT_CACHE_TTL = 300; // 5 minutes

/**
 * Stock data cache TTL
 */
export const STOCK_CACHE_TTL = 60; // 1 minute for live data

/**
 * Analysis cache TTL
 */
export const ANALYSIS_CACHE_TTL = 3600; // 1 hour for analysis

// ============================================
// MARKET CONSTANTS
// ============================================

/**
 * Oslo Stock Exchange market hours (CET/CEST)
 */
export const OSLO_MARKET_HOURS = {
  open: { hour: 9, minute: 0 },
  close: { hour: 16, minute: 20 },
};

/**
 * US Market hours (EST/EDT)
 */
export const US_MARKET_HOURS = {
  preMarket: { hour: 4, minute: 0 },
  open: { hour: 9, minute: 30 },
  close: { hour: 16, minute: 0 },
  afterHours: { hour: 20, minute: 0 },
};
