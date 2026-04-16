import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data: latest } = await supabase.from('indicators_daily').select('date').order('date', { ascending: false }).limit(1).single();
  console.log('Latest indicator date:', latest?.date);

  const { count } = await supabase.from('indicators_daily').select('*', { count: 'exact', head: true }).eq('date', latest?.date);
  console.log('Indicators for that date:', count);

  const { data: latestPrice } = await supabase.from('prices_daily').select('date').order('date', { ascending: false }).limit(1).single();
  console.log('Latest price date:', latestPrice?.date);

  // What would scanner target?
  const now = new Date();
  const utcHour = now.getUTCHours();
  console.log('Current UTC hour:', utcHour);
  if (utcHour < 22) now.setDate(now.getDate() - 1);
  const day = now.getDay();
  if (day === 0) now.setDate(now.getDate() - 2);
  else if (day === 6) now.setDate(now.getDate() - 1);
  const targetDate = now.toISOString().split('T')[0];
  console.log('Scanner targets:', targetDate);

  const { count: targetCount } = await supabase.from('indicators_daily').select('*', { count: 'exact', head: true }).eq('date', targetDate);
  console.log('Indicators for target date:', targetCount);

  // Check a sample - what does indicator data look like?
  const { data: sample } = await supabase.from('indicators_daily')
    .select('symbol, date, sma_50, sma_200, is_consolidating, consolidation_days, rel_volume, pct_from_52w_high')
    .eq('date', latest?.date)
    .limit(5);
  console.log('\nSample indicators:', JSON.stringify(sample, null, 2));
}

main().catch(console.error);
