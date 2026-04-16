import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Count signals
  const { count, error } = await supabase.from('signals').select('*', { count: 'exact', head: true });
  console.log('Total signals:', count, 'Error:', error?.message || 'none');

  // Get all signals
  const { data } = await supabase.from('signals').select('*').order('score', { ascending: false }).limit(15);
  if (data && data.length > 0) {
    console.log(`\nSignals found: ${data.length}`);
    for (const s of data) {
      console.log(`  ${s.symbol} | ${s.signal_type} | score=${s.score} | date=${s.date}`);
    }
  } else {
    console.log('\nNO SIGNALS IN TABLE');
  }

  // Check what the API endpoint would query (days=7)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const startStr = startDate.toISOString().split('T')[0];
  console.log(`\nAPI would query signals >= ${startStr}`);

  const { data: apiData } = await supabase.from('signals').select('*').gte('date', startStr).order('score', { ascending: false }).limit(15);
  console.log(`API result: ${apiData?.length || 0} signals`);
}

main().catch(console.error);
