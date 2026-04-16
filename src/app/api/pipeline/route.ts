/**
 * Pipeline proxy — lar web-appen kalle den lokale pipeline-serveren.
 *
 * POST /api/pipeline        → starter pipeline (proxies til localhost:4242)
 * GET  /api/pipeline        → status på siste kjøring
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const LOCAL_SERVER = 'http://127.0.0.1:4242';
const HEADERS = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const res = await fetch(`${LOCAL_SERVER}/status`, {
      signal: AbortSignal.timeout(2000),
    });
    const data = await res.json();
    return NextResponse.json({ ...data, local_server: true }, { headers: HEADERS });
  } catch {
    return NextResponse.json({
      local_server: false,
      running: false,
      lastRun: null,
      lastStatus: null,
      message: 'Lokal pipeline-server ikke aktiv. Start den med: npx tsx scripts/local-server.ts',
    }, { headers: HEADERS });
  }
}

export async function POST() {
  try {
    const res = await fetch(`${LOCAL_SERVER}/run-pipeline`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json({ ...data, local_server: true }, { status: res.status, headers: HEADERS });
  } catch {
    return NextResponse.json({
      local_server: false,
      error: 'Lokal pipeline-server ikke aktiv',
      fix: 'Kjør: npx tsx scripts/local-server.ts',
    }, { status: 503, headers: HEADERS });
  }
}
