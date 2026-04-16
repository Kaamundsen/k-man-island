-- signal_results: outcome tracking for every historical and live signal
-- Beregnes av compute-signal-results.ts og oppdateres nightly

create table if not exists signal_results (
  id              uuid primary key default gen_random_uuid(),

  -- Link to the signal
  signal_id       uuid references signals(id) on delete cascade,
  symbol          text not null,
  signal_date     date not null,
  signal_type     text not null,
  score           int not null,
  bucket          text not null,

  -- Entry (T+1 open is the realistic entry, not T+0 close)
  entry_signal    numeric not null,   -- entry_price from scanner (prev close)
  entry_actual    numeric,            -- T+1 open — what you actually paid
  stop_price      numeric not null,
  r_target_1      numeric not null,
  r_target_2      numeric not null,
  r_target_3      numeric not null,

  -- Outcome
  outcome         text check (outcome in ('STOP','TARGET_1','TARGET_2','TARGET_3','TIME_EXIT','OPEN')) not null default 'OPEN',
  outcome_date    date,
  outcome_price   numeric,
  days_held       int,
  r_multiple      numeric,            -- actual R achieved (+1 = 1R profit, -1 = stop)
  max_r_achieved  numeric,            -- best intraperiod R (for partial take-profits)
  max_drawdown_r  numeric,            -- worst intraperiod drawdown in R

  -- T+N prices for quick stats
  price_t1        numeric,
  price_t5        numeric,
  price_t10       numeric,
  price_t20       numeric,

  pct_t1          numeric,
  pct_t5          numeric,
  pct_t10         numeric,
  pct_t20         numeric,

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create unique index if not exists signal_results_signal_id_idx on signal_results(signal_id);
create index if not exists signal_results_date_idx on signal_results(signal_date);
create index if not exists signal_results_type_idx on signal_results(signal_type);
create index if not exists signal_results_outcome_idx on signal_results(outcome);
