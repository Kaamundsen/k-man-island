import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  // What the scanner would see for 2026-04-13
  const { data: prices } = await supabase.from('prices_daily').select('*')
    .eq('symbol', 'IDEX.OL').lte('date', '2026-04-13')
    .order('date', { ascending: true }).limit(20);

  if (prices) {
    const latest = prices[prices.length - 1];
    console.log('Scanner sees latest:', JSON.stringify(latest));
    console.log(`Turnover: ${Number(latest.volume)} × ${Number(latest.close)} = ${(Number(latest.volume) * Number(latest.close)).toFixed(0)}`);
  }
}
main().catch(console.error);
