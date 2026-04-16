/**
 * Local indicator computation + scanner
 * Run after load-prices.ts to compute indicators and scan for signals.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Check database state
async function checkState() {
  const { count: priceCount } = await supabase.from('prices_daily').select('*', { count: 'exact', head: true });
  const { count: indCount } = await supabase.from('indicators_daily').select('*', { count: 'exact', head: true });
  const { count: sigCount } = await supabase.from('signals').select('*', { count: 'exact', head: true });
  
  const { data: priceSymbols } = await supabase.from('prices_daily').select('symbol').limit(1000);
  const uniquePriceSymbols = new Set(priceSymbols?.map(r => r.symbol));
  
  const { data: indSymbols } = await supabase.from('indicators_daily').select('symbol').limit(1000);
  const uniqueIndSymbols = new Set(indSymbols?.map(r => r.symbol));

  console.log(`\n📊 Database status:`);
  console.log(`   Prices: ${priceCount} rows, ${uniquePriceSymbols.size} symbols`);
  console.log(`   Indicators: ${indCount} rows, ${uniqueIndSymbols.size} symbols`);
  console.log(`   Signals: ${sigCount} rows`);
  
  // Find symbols with prices but no indicators
  const missing = [...uniquePriceSymbols].filter(s => !uniqueIndSymbols.has(s));
  console.log(`   Missing indicators: ${missing.length} symbols`);
  if (missing.length > 0) {
    console.log(`   Examples: ${missing.slice(0, 10).join(', ')}`);
  }
}

checkState().catch(console.error);
