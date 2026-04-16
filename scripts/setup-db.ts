/**
 * Creates the signal_results table in Supabase.
 * Copies SQL to clipboard and opens Supabase dashboard.
 *
 * Usage:  npx tsx scripts/setup-db.ts
 */
import { execSync } from 'child_process';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sql = `
create table if not exists signal_results (
  id              uuid primary key default gen_random_uuid(),
  signal_id       uuid references signals(id) on delete cascade,
  symbol          text not null,
  signal_date     date not null,
  signal_type     text not null,
  score           int not null,
  bucket          text not null,
  entry_signal    numeric not null,
  entry_actual    numeric,
  stop_price      numeric not null,
  r_target_1      numeric not null,
  r_target_2      numeric not null,
  r_target_3      numeric not null,
  outcome         text check (outcome in ('STOP','TARGET_1','TARGET_2','TARGET_3','TIME_EXIT','OPEN')) not null default 'OPEN',
  outcome_date    date,
  outcome_price   numeric,
  days_held       int,
  r_multiple      numeric,
  max_r_achieved  numeric,
  max_drawdown_r  numeric,
  price_t1        numeric, price_t5  numeric, price_t10 numeric, price_t20 numeric,
  pct_t1          numeric, pct_t5   numeric, pct_t10  numeric, pct_t20  numeric,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create unique index if not exists signal_results_signal_id_idx on signal_results(signal_id);
create index if not exists signal_results_date_idx on signal_results(signal_date);
create index if not exists signal_results_type_idx on signal_results(signal_type);
create index if not exists signal_results_outcome_idx on signal_results(outcome);
`.trim();

async function main() {
  // Check if table already exists
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error } = await sb.from('signal_results').select('id').limit(1);
  if (!error) {
    console.log('✅ signal_results table already exists');
    return;
  }

  // Copy SQL to clipboard
  try {
    execSync(`echo ${JSON.stringify(sql)} | pbcopy`);
    console.log('📋 SQL copied to clipboard');
  } catch {}

  // Open Supabase SQL editor
  const url = `https://supabase.com/dashboard/project/nludsbowbdnqvergeogs/sql/new`;
  execSync(`open "${url}"`);

  console.log('\n⚡ Supabase SQL Editor åpnet i nettleseren.');
  console.log('   SQL er kopiert til utklippstavlen — bare lim inn (⌘V) og klikk "Run".\n');
  console.log('SQL som skal kjøres:');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
  console.log('\nEtter at du har kjørt SQL, kjør:');
  console.log('  npx tsx scripts/compute-signal-results.ts');
}

main().catch(console.error);
