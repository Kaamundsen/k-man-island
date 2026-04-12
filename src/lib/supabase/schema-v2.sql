-- K-man Island V2 Schema
-- Run this in Supabase SQL Editor AFTER backing up existing data
-- This extends the existing schema with price history, indicators, signals, and trade management

-- ============================================================
-- 1. UNIVERSE — which symbols we track
-- ============================================================
CREATE TABLE IF NOT EXISTS universe (
  symbol TEXT PRIMARY KEY,               -- e.g. 'NOD.OL', 'AAPL'
  name TEXT NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('OSE', 'US')),  -- Oslo Børs or US
  sector TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_universe_market ON universe(market);
CREATE INDEX idx_universe_active ON universe(is_active) WHERE is_active = true;

-- ============================================================
-- 2. PRICES — daily OHLCV from Yahoo Finance
-- ============================================================
CREATE TABLE IF NOT EXISTS prices_daily (
  symbol TEXT NOT NULL REFERENCES universe(symbol),
  date DATE NOT NULL,
  open NUMERIC(12,4) NOT NULL,
  high NUMERIC(12,4) NOT NULL,
  low NUMERIC(12,4) NOT NULL,
  close NUMERIC(12,4) NOT NULL,
  volume BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (symbol, date)
);

-- Partition-friendly index for time-series queries
CREATE INDEX idx_prices_symbol_date ON prices_daily(symbol, date DESC);

-- ============================================================
-- 3. INDICATORS — computed daily from prices
-- ============================================================
CREATE TABLE IF NOT EXISTS indicators_daily (
  symbol TEXT NOT NULL,
  date DATE NOT NULL,

  -- Moving averages
  sma_10 NUMERIC(12,4),
  sma_20 NUMERIC(12,4),
  sma_50 NUMERIC(12,4),
  sma_200 NUMERIC(12,4),

  -- Momentum
  rsi_14 NUMERIC(6,2),

  -- Volatility
  atr_14 NUMERIC(12,4),
  atr_pct NUMERIC(6,2),              -- ATR as % of close

  -- Volume
  vol_sma_50 BIGINT,                 -- 50-day avg volume
  rel_volume NUMERIC(6,2),           -- today vol / vol_sma_50

  -- Range
  high_52w NUMERIC(12,4),
  low_52w NUMERIC(12,4),
  pct_from_52w_high NUMERIC(6,2),
  pct_from_52w_low NUMERIC(6,2),

  -- Breakout detection
  is_consolidating BOOLEAN DEFAULT false,    -- ATR declining for 8+ days
  consolidation_days INTEGER DEFAULT 0,

  PRIMARY KEY (symbol, date),
  FOREIGN KEY (symbol) REFERENCES universe(symbol)
);

CREATE INDEX idx_indicators_symbol_date ON indicators_daily(symbol, date DESC);

-- ============================================================
-- 4. SIGNALS — scanner output, append-only
-- ============================================================
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL REFERENCES universe(symbol),
  date DATE NOT NULL,

  -- Signal classification
  bucket TEXT NOT NULL CHECK (bucket IN ('BREAKOUT', 'EVENT', 'KJERNE', 'INNTEKT')),
  signal_type TEXT NOT NULL,           -- e.g. 'VCP_BREAKOUT', '52W_BREAKOUT', 'INSIDER_BUY', 'SMART_MONEY'

  -- Scoring
  score NUMERIC(5,2) NOT NULL,         -- 0-100, bucket-specific

  -- Precomputed trade plan
  entry_price NUMERIC(12,4),
  stop_price NUMERIC(12,4),            -- 2x ATR below entry
  stop_pct NUMERIC(6,2),               -- stop distance as %
  position_size_nok NUMERIC(12,2),     -- based on 1% portfolio risk
  r_target_1 NUMERIC(12,4),            -- +1R (take 1/3 profit)
  r_target_2 NUMERIC(12,4),            -- +2R
  r_target_3 NUMERIC(12,4),            -- +3R

  -- Reasons (human-readable)
  reasons JSONB NOT NULL DEFAULT '[]',  -- ["52w high after 45 day base", "Volume 3.2x avg"]

  -- Metadata
  was_taken BOOLEAN DEFAULT false,      -- did user act on it?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(symbol, date, signal_type)
);

CREATE INDEX idx_signals_date ON signals(date DESC);
CREATE INDEX idx_signals_bucket ON signals(bucket);
CREATE INDEX idx_signals_symbol ON signals(symbol);

-- ============================================================
-- 5. TRADES — extended from existing, bucket-tagged
-- ============================================================
-- Drop old constraint and add new bucket values
ALTER TABLE trades
  DROP CONSTRAINT IF EXISTS trades_status_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_status_check
  CHECK (status IN ('ACTIVE', 'CLOSED', 'STOPPED', 'PARTIAL'));

-- Add new columns to existing trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS bucket TEXT CHECK (bucket IN ('BREAKOUT', 'EVENT', 'KJERNE', 'INNTEKT'));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price NUMERIC(12,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_date DATE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_reason TEXT;  -- 'TRAILING_STOP', 'HARD_STOP', 'TARGET_HIT', 'MANUAL'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS initial_stop NUMERIC(12,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS current_stop NUMERIC(12,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trailing_method TEXT DEFAULT 'SMA10' CHECK (trailing_method IN ('SMA10', 'SMA20', 'CHANDELIER', 'MANUAL'));
ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple NUMERIC(6,2);  -- realized R-multiple
ALTER TABLE trades ADD COLUMN IF NOT EXISTS signal_id UUID REFERENCES signals(id);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS pnl_nok NUMERIC(12,2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS pnl_pct NUMERIC(6,2);

-- ============================================================
-- 6. SLOTS — active position management state
-- ============================================================
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES trades(id),
  symbol TEXT NOT NULL REFERENCES universe(symbol),
  bucket TEXT NOT NULL,

  -- Current state
  entry_price NUMERIC(12,4) NOT NULL,
  current_stop NUMERIC(12,4) NOT NULL,
  trailing_method TEXT NOT NULL DEFAULT 'SMA10',
  quantity INTEGER NOT NULL,

  -- Partial profit tracking
  original_quantity INTEGER NOT NULL,
  partial_exits JSONB DEFAULT '[]',    -- [{date, qty, price, reason}]

  -- Status
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PENDING_EXIT', 'CLOSED')),
  days_held INTEGER DEFAULT 0,
  highest_price NUMERIC(12,4),         -- for trailing stop calc

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_slots_status ON slots(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_slots_symbol ON slots(symbol);

-- ============================================================
-- 7. SMART MONEY — track specific people/insiders
-- ============================================================
CREATE TABLE IF NOT EXISTS smart_money (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,           -- e.g. 'Espen Teigland'
  symbol TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('BUY', 'SELL')),
  shares INTEGER,
  price NUMERIC(12,4),
  date DATE NOT NULL,
  source TEXT,                         -- 'newsweb', 'manual', 'twitter'
  notes TEXT,

  -- Performance tracking
  price_at_signal NUMERIC(12,4),
  price_after_30d NUMERIC(12,4),
  price_after_90d NUMERIC(12,4),
  return_30d_pct NUMERIC(6,2),
  return_90d_pct NUMERIC(6,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_smart_money_person ON smart_money(person_name);
CREATE INDEX idx_smart_money_symbol ON smart_money(symbol);

-- ============================================================
-- 8. PORTFOLIO CONFIG
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default config
INSERT INTO portfolio_config (key, value) VALUES
  ('total_capital', '656000'),
  ('risk_per_trade_pct', '1'),
  ('max_positions', '8'),
  ('buckets', '{"BREAKOUT": {"max_pct": 40, "max_positions": 3}, "EVENT": {"max_pct": 25, "max_positions": 2}, "KJERNE": {"max_pct": 25, "max_positions": 2}, "INNTEKT": {"max_pct": 10, "max_positions": 1}}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. SEED OSE UNIVERSE (most liquid + breakout candidates)
-- ============================================================
INSERT INTO universe (symbol, name, market, sector) VALUES
  -- Blue chips / liquid
  ('EQNR.OL', 'Equinor', 'OSE', 'Energy'),
  ('DNB.OL', 'DNB Bank', 'OSE', 'Finance'),
  ('TEL.OL', 'Telenor', 'OSE', 'Telecom'),
  ('MOWI.OL', 'Mowi', 'OSE', 'Seafood'),
  ('YAR.OL', 'Yara International', 'OSE', 'Materials'),
  ('ORK.OL', 'Orkla', 'OSE', 'Consumer'),
  ('SALM.OL', 'SalMar', 'OSE', 'Seafood'),
  ('AKRBP.OL', 'Aker BP', 'OSE', 'Energy'),
  ('SUBC.OL', 'Subsea 7', 'OSE', 'Energy Services'),
  ('KOG.OL', 'Kongsberg Gruppen', 'OSE', 'Defense'),
  ('BAKKA.OL', 'Bakkafrost', 'OSE', 'Seafood'),
  ('AKER.OL', 'Aker', 'OSE', 'Investment'),
  ('AKSO.OL', 'Aker Solutions', 'OSE', 'Energy Services'),
  ('FRO.OL', 'Frontline', 'OSE', 'Shipping'),
  ('GOGL.OL', 'Golden Ocean', 'OSE', 'Shipping'),
  ('HAFNI.OL', 'Hafnia', 'OSE', 'Shipping'),
  ('BWO.OL', 'BW Offshore', 'OSE', 'Energy Services'),
  ('RECSI.OL', 'REC Silicon', 'OSE', 'Tech'),
  ('NEL.OL', 'Nel', 'OSE', 'Green Energy'),
  ('NHYDY.OL', 'Norsk Hydro', 'OSE', 'Materials'),

  -- Your current holdings
  ('NOD.OL', 'Nordic Semiconductor', 'OSE', 'Tech'),
  ('DSRT.OL', 'Desert Control', 'OSE', 'Green Tech'),
  ('SATS.OL', 'SATS', 'OSE', 'Consumer'),
  ('VAR.OL', 'Vår Energi', 'OSE', 'Energy'),
  ('ZENITH.OL', 'Zenith Energy', 'OSE', 'Energy'),
  ('THOM.OL', 'Thor Medical', 'OSE', 'Healthcare'),

  -- Known breakout/momentum candidates (OSE small/mid)
  ('CIRCIO.OL', 'Circio', 'OSE', 'Biotech'),
  ('IOX.OL', 'Interoil Exploration', 'OSE', 'Energy'),
  ('ZAPTEC.OL', 'Zaptec', 'OSE', 'Green Tech'),
  ('KAHOT.OL', 'Kahoot', 'OSE', 'Tech'),
  ('GENTOO.OL', 'Gentoo Media', 'OSE', 'Media'),
  ('JACK.OL', 'Jacktel', 'OSE', 'Telecom'),
  ('SCATC.OL', 'Scatec', 'OSE', 'Green Energy'),
  ('PGS.OL', 'PGS', 'OSE', 'Energy Services'),
  ('BRG.OL', 'Borregaard', 'OSE', 'Materials'),
  ('CRAYON.OL', 'Crayon', 'OSE', 'Tech'),
  ('AUSS.OL', 'Austevoll Seafood', 'OSE', 'Seafood'),
  ('TGS.OL', 'TGS-NOPEC', 'OSE', 'Energy Services'),
  ('MING.OL', 'Meltwater', 'OSE', 'Tech'),
  ('AUTO.OL', 'Autostore', 'OSE', 'Tech'),
  ('FLYR.OL', 'Flyr', 'OSE', 'Airlines'),
  ('OTEC.OL', 'Ocean Sun', 'OSE', 'Green Energy'),
  ('PROTCT.OL', 'Protector Forsikring', 'OSE', 'Insurance'),
  ('PARB.OL', 'Pareto Bank', 'OSE', 'Finance'),
  ('VOLUE.OL', 'Volue', 'OSE', 'Tech'),
  ('BEWI.OL', 'BEWI', 'OSE', 'Materials'),
  ('HADAL.OL', 'Hadal', 'OSE', 'Tech'),
  ('KMCP.OL', 'K-Chimica', 'OSE', 'Healthcare'),
  ('ENDUR.OL', 'Endur', 'OSE', 'Energy Services'),
  ('NSKOG.OL', 'Norske Skog', 'OSE', 'Materials')
ON CONFLICT (symbol) DO NOTHING;

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_config_updated_at BEFORE UPDATE ON portfolio_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
