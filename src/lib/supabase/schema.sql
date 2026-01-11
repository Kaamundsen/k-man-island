-- K-man Island Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  strategy_bucket TEXT NOT NULL CHECK (strategy_bucket IN ('K-Momentum', 'Legacy')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trades table
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  entry_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  entry_date DATE NOT NULL,
  stop_loss DECIMAL(10, 2),
  target DECIMAL(10, 2),
  time_horizon_end DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED', 'STOPPED')),
  dead_money_warning BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_trades_portfolio ON trades(portfolio_id);
CREATE INDEX idx_trades_ticker ON trades(ticker);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_entry_date ON trades(entry_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default portfolios
INSERT INTO portfolios (name, strategy_bucket) VALUES
  ('K-Momentum Portfolio', 'K-Momentum'),
  ('Legacy Portfolio', 'Legacy');

-- Row Level Security (RLS) - Enable if you add authentication later
-- For now, we'll keep it simple without RLS
-- ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- If you want to enable public access (for development):
-- CREATE POLICY "Enable read access for all users" ON portfolios FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON portfolios FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable read access for all users" ON trades FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON trades FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON trades FOR UPDATE USING (true);
