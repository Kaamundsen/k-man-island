-- Curated US stocks for breakout scanning (~100 names)
-- Focus: high-growth tech, momentum leaders, past superperformers, emerging growth
-- Run this in Supabase SQL Editor

INSERT INTO universe (symbol, name, market, sector) VALUES
  -- === MEGA-CAP TECH (leaders drive market) ===
  ('AAPL', 'Apple', 'US', 'Technology'),
  ('MSFT', 'Microsoft', 'US', 'Technology'),
  ('NVDA', 'NVIDIA', 'US', 'Semiconductors'),
  ('GOOGL', 'Alphabet', 'US', 'Technology'),
  ('AMZN', 'Amazon', 'US', 'Consumer'),
  ('META', 'Meta Platforms', 'US', 'Technology'),
  ('TSLA', 'Tesla', 'US', 'Automotive'),
  ('AVGO', 'Broadcom', 'US', 'Semiconductors'),

  -- === SEMICONDUCTORS (best breakout sector) ===
  ('AMD', 'Advanced Micro Devices', 'US', 'Semiconductors'),
  ('MRVL', 'Marvell Technology', 'US', 'Semiconductors'),
  ('ARM', 'Arm Holdings', 'US', 'Semiconductors'),
  ('ANET', 'Arista Networks', 'US', 'Networking'),
  ('MU', 'Micron Technology', 'US', 'Semiconductors'),
  ('KLAC', 'KLA Corporation', 'US', 'Semiconductors'),
  ('LRCX', 'Lam Research', 'US', 'Semiconductors'),
  ('AMAT', 'Applied Materials', 'US', 'Semiconductors'),
  ('ON', 'ON Semiconductor', 'US', 'Semiconductors'),
  ('SMCI', 'Super Micro Computer', 'US', 'Technology'),
  ('ASML', 'ASML Holding', 'US', 'Semiconductors'),

  -- === AI / SOFTWARE / CLOUD (growth engines) ===
  ('PLTR', 'Palantir Technologies', 'US', 'Software'),
  ('SNOW', 'Snowflake', 'US', 'Software'),
  ('CRWD', 'CrowdStrike', 'US', 'Cybersecurity'),
  ('PANW', 'Palo Alto Networks', 'US', 'Cybersecurity'),
  ('ZS', 'Zscaler', 'US', 'Cybersecurity'),
  ('DDOG', 'Datadog', 'US', 'Software'),
  ('NET', 'Cloudflare', 'US', 'Technology'),
  ('MDB', 'MongoDB', 'US', 'Software'),
  ('SHOP', 'Shopify', 'US', 'E-commerce'),
  ('SQ', 'Block (Square)', 'US', 'Fintech'),
  ('COIN', 'Coinbase', 'US', 'Fintech'),
  ('TTD', 'The Trade Desk', 'US', 'Adtech'),
  ('AXON', 'Axon Enterprise', 'US', 'Technology'),
  ('HUBS', 'HubSpot', 'US', 'Software'),
  ('TEAM', 'Atlassian', 'US', 'Software'),
  ('WDAY', 'Workday', 'US', 'Software'),
  ('NOW', 'ServiceNow', 'US', 'Software'),
  ('UBER', 'Uber Technologies', 'US', 'Technology'),
  ('ABNB', 'Airbnb', 'US', 'Technology'),
  ('APP', 'AppLovin', 'US', 'Software'),
  ('IOT', 'Samsara', 'US', 'Software'),
  ('CELH', 'Celsius Holdings', 'US', 'Consumer'),

  -- === BIOTECH / PHARMA (explosive movers) ===
  ('LLY', 'Eli Lilly', 'US', 'Pharma'),
  ('NVO', 'Novo Nordisk', 'US', 'Pharma'),
  ('VRTX', 'Vertex Pharma', 'US', 'Biotech'),
  ('REGN', 'Regeneron', 'US', 'Biotech'),
  ('MRNA', 'Moderna', 'US', 'Biotech'),
  ('NBIX', 'Neurocrine Bio', 'US', 'Biotech'),
  ('ARGX', 'argenx', 'US', 'Biotech'),
  ('PCVX', 'Vaxcyte', 'US', 'Biotech'),
  ('KRYS', 'Krystal Biotech', 'US', 'Biotech'),
  ('TGTX', 'TG Therapeutics', 'US', 'Biotech'),

  -- === INDUSTRIALS / INFRASTRUCTURE (momentum names) ===
  ('GE', 'GE Aerospace', 'US', 'Industrials'),
  ('CARR', 'Carrier Global', 'US', 'Industrials'),
  ('PWR', 'Quanta Services', 'US', 'Industrials'),
  ('EME', 'EMCOR Group', 'US', 'Industrials'),
  ('FIX', 'Comfort Systems', 'US', 'Industrials'),
  ('TT', 'Trane Technologies', 'US', 'Industrials'),
  ('URI', 'United Rentals', 'US', 'Industrials'),
  ('BLDR', 'Builders FirstSource', 'US', 'Industrials'),
  ('TOST', 'Toast', 'US', 'Technology'),

  -- === ENERGY / COMMODITIES (cyclical breakouts) ===
  ('CEG', 'Constellation Energy', 'US', 'Energy'),
  ('VST', 'Vistra', 'US', 'Energy'),
  ('NRG', 'NRG Energy', 'US', 'Energy'),
  ('FSLR', 'First Solar', 'US', 'Energy'),
  ('FCX', 'Freeport-McMoRan', 'US', 'Materials'),
  ('NEM', 'Newmont', 'US', 'Materials'),

  -- === RETAIL / CONSUMER (momentum growers) ===
  ('COST', 'Costco', 'US', 'Retail'),
  ('DECK', 'Deckers Outdoor', 'US', 'Consumer'),
  ('ONON', 'On Holding', 'US', 'Consumer'),
  ('CAVA', 'CAVA Group', 'US', 'Restaurant'),
  ('CMG', 'Chipotle', 'US', 'Restaurant'),
  ('ELF', 'e.l.f. Beauty', 'US', 'Consumer'),
  ('LULU', 'Lululemon', 'US', 'Consumer'),
  ('DUOL', 'Duolingo', 'US', 'Education'),

  -- === FINANCIALS (breakout candidates) ===
  ('HOOD', 'Robinhood Markets', 'US', 'Fintech'),
  ('SOFI', 'SoFi Technologies', 'US', 'Fintech'),
  ('AFRM', 'Affirm Holdings', 'US', 'Fintech'),
  ('V', 'Visa', 'US', 'Payments'),
  ('MA', 'Mastercard', 'US', 'Payments'),

  -- === SMALL/MID-CAP GROWTH (highest breakout potential) ===
  ('RKLB', 'Rocket Lab', 'US', 'Aerospace'),
  ('ASTS', 'AST SpaceMobile', 'US', 'Telecom'),
  ('LUNR', 'Intuitive Machines', 'US', 'Aerospace'),
  ('IONQ', 'IonQ', 'US', 'Quantum Computing'),
  ('RGTI', 'Rigetti Computing', 'US', 'Quantum Computing'),
  ('SOUN', 'SoundHound AI', 'US', 'AI'),
  ('UPST', 'Upstart', 'US', 'Fintech'),
  ('RELY', 'Remitly Global', 'US', 'Fintech'),
  ('FOUR', 'Shift4 Payments', 'US', 'Payments'),
  ('INTA', 'Intapp', 'US', 'Software'),
  ('POWL', 'Powell Industries', 'US', 'Industrials'),
  ('VRT', 'Vertiv Holdings', 'US', 'Industrials'),
  ('ACHR', 'Archer Aviation', 'US', 'Aerospace'),
  ('JOBY', 'Joby Aviation', 'US', 'Aerospace'),
  ('APLD', 'Applied Digital', 'US', 'Technology'),
  ('CORZ', 'Core Scientific', 'US', 'Technology'),
  ('BTDR', 'Bitdeer Technologies', 'US', 'Technology'),
  ('RDDT', 'Reddit', 'US', 'Technology'),
  ('OKLO', 'Oklo', 'US', 'Energy'),
  ('SMR', 'NuScale Power', 'US', 'Energy'),
  ('GEV', 'GE Vernova', 'US', 'Energy')
ON CONFLICT (symbol) DO NOTHING;
