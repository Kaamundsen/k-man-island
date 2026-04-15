import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const toAdd = [
    { symbol: 'ZEN.OL', name: 'Zenith Energy', market: 'OSE', is_active: true },
    { symbol: 'THOR.OL', name: 'Thor Medical', market: 'OSE', is_active: true },
  ];

  for (const s of toAdd) {
    const { error } = await sb.from('universe').upsert(s, { onConflict: 'symbol' });
    if (error) console.log(`❌ ${s.symbol}: ${error.message}`);
    else console.log(`✅ ${s.symbol} lagt til i universe`);
  }
}
main().catch(console.error);
