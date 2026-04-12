/**
 * Daily Pipeline Cron Route
 *
 * Runs the full pipeline: fetch prices → compute indicators → scan → manage slots
 *
 * Triggered by:
 * - Vercel Cron (if configured in vercel.json)
 * - External cron service (cron-job.org) hitting this URL
 * - Manual trigger from dashboard (refresh button)
 *
 * Auth: requires CRON_SECRET in Authorization header,
 * OR ?manual=true for dashboard-triggered runs (rate limited).
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchPricesForMarket } from '@/lib/pipeline/fetch-prices';
import { computeIndicators } from '@/lib/pipeline/compute-indicators';
import { runAndStoreSignals } from '@/lib/pipeline/scanner';
import { evaluateSlots } from '@/lib/pipeline/slot-manager';

// Rate limit manual runs to once per 15 minutes
let lastManualRun = 0;
const MANUAL_COOLDOWN_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isManual = url.searchParams.get('manual') === 'true';
  const market = (url.searchParams.get('market') || 'OSE') as 'OSE' | 'US';
  const fullHistory = url.searchParams.get('full') === 'true';

  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!isManual) {
    // Cron calls MUST have valid secret
    if (!cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET not configured' },
        { status: 500 }
      );
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    // Manual calls: rate limited
    const now = Date.now();
    if (now - lastManualRun < MANUAL_COOLDOWN_MS) {
      const waitSec = Math.ceil((MANUAL_COOLDOWN_MS - (now - lastManualRun)) / 1000);
      return NextResponse.json(
        { error: `Rate limited. Vent ${waitSec} sekunder.` },
        { status: 429 }
      );
    }
    lastManualRun = now;
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    // Step 1: Fetch prices
    log.push(`Henter priser for ${market}...`);
    const priceResult = await fetchPricesForMarket(market, { fullHistory, batchSize: 8 });
    log.push(`Priser: ${priceResult.success} OK, ${priceResult.failed} feilet, ${priceResult.skipped} hoppet over`);

    // Step 2: Compute indicators for updated symbols
    log.push('Beregner indikatorer...');
    const indicatorResult = await computeIndicators(
      priceResult.symbols.length > 0 ? priceResult.symbols : undefined
    );
    log.push(`Indikatorer: ${indicatorResult.computed} beregnet, ${indicatorResult.failed} feilet`);

    // Step 3: Run scanner
    log.push('Kjører scanner...');
    const scanResult = await runAndStoreSignals();
    log.push(`Scanner: ${scanResult.signals.length} signaler funnet, ${scanResult.stored} lagret`);

    // Step 4: Evaluate active slots (exit management)
    log.push('Sjekker aktive posisjoner...');
    const slotActions = await evaluateSlots();
    const exits = slotActions.filter(a => a.action === 'FULL_EXIT');
    const stopMoves = slotActions.filter(a => a.action === 'MOVE_STOP');
    const partials = slotActions.filter(a => a.action === 'PARTIAL_EXIT');
    log.push(`Posisjoner: ${exits.length} exits, ${stopMoves.length} stop-flyttinger, ${partials.length} delsalg`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`Ferdig på ${duration}s`);

    return NextResponse.json({
      success: true,
      market,
      duration: `${duration}s`,
      prices: priceResult,
      indicators: indicatorResult,
      signals: scanResult.signals.map(s => ({
        symbol: s.symbol,
        type: s.signal_type,
        score: s.score,
        entry: s.entry_price,
        stop: s.stop_price,
        size_nok: s.position_size_nok,
        reasons: s.reasons,
      })),
      slot_actions: slotActions.map(a => ({
        symbol: a.symbol,
        action: a.action,
        message: a.message,
      })),
      log,
    });

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error('Pipeline failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}s`,
        log,
      },
      { status: 500 }
    );
  }
}
