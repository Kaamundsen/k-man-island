/**
 * Daily Pipeline Cron Route
 *
 * Runs the full pipeline: fetch prices → compute indicators → scan → manage slots
 *
 * Query params:
 * - manual=true    — dashboard trigger (no auth needed)
 * - market=OSE|US  — which market to process
 * - full=true      — fetch full 2-year history (slow)
 * - step=prices    — only fetch prices (for batch loading)
 * - step=scan      — only run indicators + scanner (fast, <2s)
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchPricesForMarket } from '@/lib/pipeline/fetch-prices';
import { computeIndicators } from '@/lib/pipeline/compute-indicators';
import { runAndStoreSignals } from '@/lib/pipeline/scanner';
import { evaluateSlots } from '@/lib/pipeline/slot-manager';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isManual = url.searchParams.get('manual') === 'true';
  const market = (url.searchParams.get('market') || 'OSE') as 'OSE' | 'US';
  const fullHistory = url.searchParams.get('full') === 'true';
  const step = url.searchParams.get('step'); // 'prices', 'scan', or null (full pipeline)

  // Auth check — only for cron calls, not manual
  if (!isManual) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    let priceResult = { success: 0, failed: 0, skipped: 0, total: 0, remaining: 0, symbols: [] as string[] };
    let indicatorResult = { computed: 0, failed: 0 };
    let scanResult = { signals: [] as any[], stored: 0 };
    let slotActions: any[] = [];

    // Step: prices only — for batch loading new symbols
    if (step === 'prices' || !step) {
      log.push(`Henter priser for ${market}...`);
      priceResult = await fetchPricesForMarket(market, { fullHistory, batchSize: 5 });
      log.push(`Priser: ${priceResult.success} oppdatert, ${priceResult.failed} feilet, ${priceResult.skipped} uendret`);
    }

    // Step: scan only — fast, runs on existing data
    if (step === 'scan' || !step) {
      log.push('Beregner indikatorer...');
      const symbolsToCompute = priceResult.symbols.length > 0 ? priceResult.symbols : undefined;
      indicatorResult = await computeIndicators(symbolsToCompute);
      log.push(`Indikatorer: ${indicatorResult.computed} beregnet, ${indicatorResult.failed} feilet`);

      log.push('Kjorer scanner...');
      scanResult = await runAndStoreSignals();
      log.push(`Scanner: ${scanResult.signals.length} signaler funnet, ${scanResult.stored} lagret`);

      log.push('Sjekker aktive posisjoner...');
      slotActions = await evaluateSlots();
      const exits = slotActions.filter((a: any) => a.action === 'FULL_EXIT');
      const stopMoves = slotActions.filter((a: any) => a.action === 'MOVE_STOP');
      const partials = slotActions.filter((a: any) => a.action === 'PARTIAL_EXIT');
      log.push(`Posisjoner: ${exits.length} exits, ${stopMoves.length} stop-flyttinger, ${partials.length} delsalg`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log.push(`Ferdig pa ${duration}s`);

    return NextResponse.json({
      success: true,
      market,
      step: step || 'full',
      duration: `${duration}s`,
      prices: priceResult,
      indicators: indicatorResult,
      signals: scanResult.signals.map((s: any) => ({
        symbol: s.symbol,
        type: s.signal_type,
        score: s.score,
        entry: s.entry_price,
        stop: s.stop_price,
        size_nok: s.position_size_nok,
        reasons: s.reasons,
      })),
      slot_actions: slotActions.map((a: any) => ({
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
