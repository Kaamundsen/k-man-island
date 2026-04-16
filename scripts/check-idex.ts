import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const { data } = await supabase.from('indicators_daily')
    .select('symbol, date, vol_sma_50, sma_50, atr_pct')
    .eq('symbol', 'IDEX.OL')
    .order('date', { ascending: false })
    .limit(3);
  console.log('IDEX indicators:', JSON.stringify(data, null, 2));

  const { data: prices } = await supabase.from('prices_daily')
    .select('date, close, volume')
    .eq('symbol', 'IDEX.OL')
    .order('date', { ascending: false })
    .limit(5);
  console.log('\nIDEX recent prices:', JSON.stringify(prices, null, 2));
}
main().catch(console.error);
