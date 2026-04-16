import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Get distinct symbols with prices
  const { data } = await supabase
    .from('prices_daily')
    .select('symbol, date')
    .order('date', { ascending: false })
    .limit(5000);

  const bySymbol: Record<string, { count: number; latest: string }> = {};
  for (const row of data || []) {
    if (!bySymbol[row.symbol]) {
      bySymbol[row.symbol] = { count: 0, latest: row.date };
    }
    bySymbol[row.symbol].count++;
  }

  console.log(`\nSymbols with prices: ${Object.keys(bySymbol).length}`);
  const sorted = Object.entries(bySymbol).sort((a, b) => b[1].count - a[1].count);
  for (const [sym, info] of sorted.slice(0, 20)) {
    console.log(`  ${sym}: ${info.count} rows, latest ${info.latest}`);
  }
  console.log('  ...');
  
  // Check if the new symbols (US) have data
  const { data: usCheck } = await supabase
    .from('prices_daily')
    .select('symbol')
    .eq('symbol', 'AAPL')
    .limit(1);
  console.log(`\nAAPL exists: ${(usCheck?.length || 0) > 0}`);

  const { data: newOseCheck } = await supabase
    .from('prices_daily')
    .select('symbol')
    .eq('symbol', 'GJF.OL')
    .limit(1);
  console.log(`GJF.OL exists: ${(newOseCheck?.length || 0) > 0}`);
}

main().catch(console.error);
