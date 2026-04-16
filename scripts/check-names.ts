import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  const symbols = ['AFG.OL','ASA.OL','EXTX.OL','NORSE.OL','PHO.OL','AFK.OL','ROGS.OL','MPCC.OL','MRVL','SNOW','NOM.OL','NRC.OL'];
  const { data } = await supabase.from('universe').select('symbol, name').in('symbol', symbols);
  console.log('Universe names:');
  for (const r of data || []) console.log(`  ${r.symbol.padEnd(12)} → ${r.name}`);

  // Check if name column exists
  const { data: sample } = await supabase.from('universe').select('symbol, name').limit(3);
  console.log('\nSample:', sample);
}
main().catch(console.error);
