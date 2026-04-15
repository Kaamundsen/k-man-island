/**
 * Import existing positions from scripts/my-positions.json into the slots table.
 *
 * Usage:
 *   1. Edit scripts/my-positions.json with your actual positions
 *   2. Run: npx tsx scripts/import-positions.ts
 *
 * What it does:
 *   - Creates a "trade" row (historical record of the buy)
 *   - Creates a "slot" row (active position for slot-manager to track)
 *   - Skips positions that already exist (by symbol + entry_date)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Position {
  symbol: string;
  quantity: number;
  entry_price: number;
  entry_date: string;
  stop_loss?: number;
  bucket?: string;
}

async function main() {
  const file = resolve(process.cwd(), 'scripts/my-positions.json');
  const raw = JSON.parse(readFileSync(file, 'utf-8'));
  const positions: Position[] = raw.positions || [];

  if (positions.length === 0) {
    console.log('❌ Ingen posisjoner i my-positions.json');
    return;
  }

  // Remove example rows if still present
  const real = positions.filter(p => p.symbol !== 'EXAMPLE.OL' && !p.symbol.startsWith('EXAMPLE'));

  if (real.length === 0) {
    console.log('❌ Du har bare eksempel-rader i my-positions.json. Oppdater filen med dine faktiske posisjoner.');
    return;
  }

  console.log(`📦 Importerer ${real.length} posisjoner...\n`);

  // Get portfolio ID
  const { data: portfolio } = await supabase.from('portfolios').select('id').limit(1).single();
  const portfolioId = portfolio?.id || null;

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of real) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('slots')
      .select('id')
      .eq('symbol', p.symbol)
      .eq('status', 'ACTIVE');

    if (existing && existing.length > 0) {
      console.log(`⏭️  ${p.symbol} — finnes allerede som aktiv slot, hopper over`);
      skipped++;
      continue;
    }

    // Verify symbol exists in universe
    const { data: uni } = await supabase.from('universe').select('symbol,name').eq('symbol', p.symbol).single();
    if (!uni) {
      console.log(`❌ ${p.symbol} — finnes ikke i universe, hopper over`);
      failed++;
      continue;
    }

    // Get current price for highest_price seed
    const { data: lastPrice } = await supabase
      .from('prices_daily')
      .select('close')
      .eq('symbol', p.symbol)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const currentPrice = lastPrice ? Number(lastPrice.close) : p.entry_price;
    const stop = p.stop_loss ?? Math.round(p.entry_price * 0.93 * 100) / 100; // 7% under if not specified
    const bucket = p.bucket || 'BREAKOUT';

    // Create trade
    const { data: trade, error: tradeErr } = await supabase
      .from('trades')
      .insert({
        portfolio_id: portfolioId,
        ticker: p.symbol,
        entry_price: p.entry_price,
        quantity: p.quantity,
        entry_date: p.entry_date,
        stop_loss: stop,
        initial_stop: stop,
        current_stop: stop,
        bucket,
        status: 'ACTIVE',
        trailing_method: 'SMA10',
        notes: 'Importert eksisterende posisjon',
      })
      .select()
      .single();

    if (tradeErr || !trade) {
      console.log(`❌ ${p.symbol} — trade-feil: ${tradeErr?.message}`);
      failed++;
      continue;
    }

    // Create slot
    const { error: slotErr } = await supabase.from('slots').insert({
      trade_id: trade.id,
      symbol: p.symbol,
      bucket,
      entry_price: p.entry_price,
      current_stop: stop,
      trailing_method: 'SMA10',
      quantity: p.quantity,
      original_quantity: p.quantity,
      highest_price: Math.max(currentPrice, p.entry_price),
      status: 'ACTIVE',
    });

    if (slotErr) {
      console.log(`❌ ${p.symbol} — slot-feil: ${slotErr.message}`);
      failed++;
      continue;
    }

    const pnl = ((currentPrice - p.entry_price) / p.entry_price * 100).toFixed(1);
    const sign = currentPrice >= p.entry_price ? '+' : '';
    console.log(`✅ ${p.symbol.padEnd(12)} ${uni.name.padEnd(25)} ${p.quantity}×${p.entry_price} → ${currentPrice} (${sign}${pnl}%)`);
    imported++;
  }

  console.log(`\n📊 Ferdig: ${imported} importert, ${skipped} hoppet over, ${failed} feilet`);
  if (imported > 0) {
    console.log('Se posisjonene på https://k-man-island.vercel.app/portefolje');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
