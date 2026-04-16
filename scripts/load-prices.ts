/**
 * Local price loader — run this from your machine to fill the database.
 * Bypasses Vercel timeout and Yahoo IP blocks.
 *
 * Usage:
 *   npx tsx scripts/load-prices.ts           # Load all markets
 *   npx tsx scripts/load-prices.ts OSE       # Load OSE only
 *   npx tsx scripts/load-prices.ts US        # Load US only
 */

// Load .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase env vars in .env.local');
  console.error('Add these to .env.local:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...');
  console.error('\nFind them in Supabase → Settings → API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchYahoo(symbol: string, days: number): Promise<any[]> {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (days * 24 * 60 * 60);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result?.timestamp) return [];
    const quotes = result.indicators?.quote?.[0];
    if (!quotes) return [];

    const candles = [];
    for (let i = 0; i < result.timestamp.length; i++) {
      const o = quotes.open?.[i], h = quotes.high?.[i], l = quotes.low?.[i], c = quotes.close?.[i], v = quotes.volume?.[i];
      if (o != null && h != null && l != null && c != null) {
        candles.push({
          date: new Date(result.timestamp[i] * 1000).toISOString().split('T')[0],
          open: Math.round(o * 10000) / 10000,
          high: Math.round(h * 10000) / 10000,
          low: Math.round(l * 10000) / 10000,
          close: Math.round(c * 10000) / 10000,
          volume: v || 0,
        });
      }
    }
    return candles;
  } catch {
    return [];
  }
}

async function main() {
  const marketFilter = process.argv[2]?.toUpperCase(); // 'OSE', 'US', or undefined for all

  // Get all symbols
  let query = supabase.from('universe').select('symbol, market').eq('is_active', true);
  if (marketFilter) query = query.eq('market', marketFilter);
  const { data: symbols } = await query;

  if (!symbols || symbols.length === 0) {
    console.log('No symbols found');
    return;
  }

  console.log(`\n📊 Loading prices for ${symbols.length} symbols (${marketFilter || 'ALL'})...\n`);

  // Get existing latest dates in bulk
  const { data: existingPrices } = await supabase
    .from('prices_daily')
    .select('symbol, date')
    .order('date', { ascending: false });

  const latestDates: Record<string, string> = {};
  if (existingPrices) {
    for (const row of existingPrices) {
      if (!latestDates[row.symbol]) latestDates[row.symbol] = row.date;
    }
  }

  let loaded = 0;
  let failed = 0;
  let skipped = 0;
  const failedSymbols: string[] = [];

  for (let i = 0; i < symbols.length; i++) {
    const { symbol } = symbols[i];
    const lastDate = latestDates[symbol];
    const today = new Date().toISOString().split('T')[0];

    // Skip if already has today's data (or yesterday for after-hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate && (lastDate >= yesterdayStr)) {
      skipped++;
      continue;
    }

    // Determine how many days to fetch
    let days = 520; // 2 years for new symbols
    if (lastDate) {
      const diff = Math.ceil((Date.now() - new Date(lastDate).getTime()) / (24 * 60 * 60 * 1000)) + 5;
      days = Math.min(diff, 520);
    }

    const candles = await fetchYahoo(symbol, days);

    if (candles.length === 0) {
      failed++;
      failedSymbols.push(symbol);
      process.stdout.write(`✗ ${symbol} `);
      continue;
    }

    // Filter to new data only
    const newCandles = lastDate ? candles.filter(c => c.date > lastDate) : candles;

    if (newCandles.length === 0) {
      skipped++;
      continue;
    }

    const rows = newCandles.map(c => ({ symbol, ...c }));
    const { error } = await supabase.from('prices_daily').upsert(rows, { onConflict: 'symbol,date' });

    if (error) {
      failed++;
      failedSymbols.push(symbol);
      process.stdout.write(`✗ ${symbol} `);
    } else {
      loaded++;
      process.stdout.write(`✓ ${symbol}(${newCandles.length}) `);
    }

    // Progress every 10 symbols
    if ((i + 1) % 10 === 0) {
      console.log(`\n  [${i + 1}/${symbols.length}] loaded=${loaded} failed=${failed} skipped=${skipped}`);
    }

    // Small delay to be nice to Yahoo
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n\n✅ Done!`);
  console.log(`   Loaded: ${loaded}`);
  console.log(`   Skipped: ${skipped} (already up to date)`);
  console.log(`   Failed: ${failed}`);
  if (failedSymbols.length > 0) {
    console.log(`   Failed symbols: ${failedSymbols.join(', ')}`);
  }
}

main().catch(console.error);
