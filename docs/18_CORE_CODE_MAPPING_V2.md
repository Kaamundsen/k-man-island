# 18_CORE_CODE_MAPPING_V2

## Status: Implemented
Date: 2026-01-19

## Overview
This document maps the V2 architecture to actual files in `src/`.

---

## CORE Engine Files

### Core Engine
- `src/v2/core/core-engine/index.ts` - Main core engine runner
- `src/v2/core/core-engine/types.ts` - CoreProfile, CoreEngineOutput types
- `src/v2/core/core-engine/profiles/trend.ts` - CORE_TREND scoring
- `src/v2/core/core-engine/profiles/asym.ts` - CORE_ASYM scoring

### Slot Manager
- `src/v2/core/slot-manager/index.ts` - initSlotManager, getOpenSlots, addSlot
- `src/v2/core/slot-manager/types.ts` - SlotManagerState, CoreSlot types
- `src/v2/core/slot-manager/apply-core.ts` - applyCoreOutputsToSlots

### Action Engine
- `src/v2/core/action-engine/index.ts` - decide() function
- `src/v2/core/action-engine/types.ts` - CoreAction, CoreDecision types

### Core Brief
- `src/v2/core/core-brief/index.ts` - renderCoreBrief()

### Entry Point
- `src/v2/core/index.ts` - runV2Core() - full pipeline

---

## Strategy Registry

### Main Registry
- `src/lib/strategies/registry.ts` - V2-compliant strategy registry
  - StrategyPackType: CORE | SATELLITE | TRACKER
  - CoreProfile: CORE_TREND | CORE_ASYM
  - SatelliteProfile: SWING | REBOUND | DAYTRADER | WEEK_PICK
  - TrackerProfile: TVEITEREID | BUFFETT | DNB | INVESTTECH

### Functions
- `calculateStrategyScore(stock, profile)` - Strategy-specific scoring
- `passesStrategyFilters(stock, profile)` - Filter validation
- `rankByStrategy(stocks, profile)` - Ranked stock list
- `qualifiesForCore(stock)` - Check CORE eligibility
- `getMaxCoreSlots()` - Returns 5 (TREND: 3 + ASYM: 2)

### Legacy Strategies
- `src/lib/strategies/index.ts` - Full strategy definitions
- Includes: MOMENTUM_TREND, MOMENTUM_ASYM, BUFFETT, TVEITEREID, etc.
- Evaluator functions for each strategy

---

## Data Pipeline

### Canonical Stock Data
- `src/lib/api/stock-data.ts` - **SINGLE SOURCE OF TRUTH**
  - `fetchLiveStockData(limit?)` - Fetch stock list from Yahoo Finance
  - `getWatchlist()` - Returns default watchlist symbols
  - `isMarketOpen()` - Check Oslo market hours

### Single Stock Quotes
- `src/lib/api/stock-data-v2.ts`
  - `fetchSingleStockQuote(ticker)` - For detail pages

### K-Momentum (Finnhub)
- `src/strategy-packs/legacy/api/stock-data-v2.ts`
  - `fetchAllStocksWithKMomentum()` - Uses Finnhub API

---

## API Routes

### Stock List
- `src/app/api/stocks/route.ts`
  - GET /api/stocks?limit=50
  - Returns: { stocks, timestamp, count }

### Quotes
- `src/app/api/quotes/route.ts`
  - GET /api/quotes?tickers=EQNR.OL,DNB.OL

---

## Adapters

### Analysis Adapter
- `src/v2/adapters/analysis/index.ts`
- `src/v2/adapters/analysis/legacyIndicators.ts`

### Portfolio Adapter
- `src/v2/adapters/portfolio/index.ts`
- `src/v2/adapters/portfolio/legacyPortfolio.ts`

### Market Data Adapter
- `src/v2/adapters/market-data/index.ts`
- `src/v2/adapters/market-data/yahooDaily.ts`
- `src/v2/adapters/market-data/stooq.ts`

---

## UI Components

### Dashboard
- `src/app/page.tsx` - Main dashboard page
- `src/components/DashboardClient.tsx` - Client-side refresh handler
- `src/components/DashboardContent.tsx` - Dashboard UI with filters

### Report
- `src/app/rapport/page.tsx` - Daily report with Core Brief + Portfolio Review

---

## Type Definitions

- `src/lib/types.ts` - Stock, Trade, Portfolio, Dividend types
- `src/v2/core/core-engine/types.ts` - CoreProfile, CoreEngineOutput
- `src/v2/core/action-engine/types.ts` - CoreAction, CoreDecision
- `src/v2/core/slot-manager/types.ts` - SlotManagerState, CoreSlot
