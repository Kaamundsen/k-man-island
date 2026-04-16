/**
 * Pipeline API — trigger GitHub Actions workflow
 *
 * POST /api/pipeline  → starter GitHub Actions pipeline
 * GET  /api/pipeline  → status på siste kjøring
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const REPO = 'Kaamundsen/k-man-island';
const WORKFLOW = 'pipeline.yml';
const GH_API = 'https://api.github.com';
const HEADERS = { 'Cache-Control': 'no-store' };

function ghHeaders() {
  const token = process.env.GITHUB_PAT;
  if (!token) return null;
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function GET() {
  const headers = ghHeaders();
  if (!headers) {
    return NextResponse.json({ configured: false }, { headers: HEADERS });
  }

  try {
    const res = await fetch(
      `${GH_API}/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?per_page=3`,
      { headers, cache: 'no-store' }
    );
    const data = await res.json();
    const runs = data.workflow_runs || [];
    const latest = runs[0];

    return NextResponse.json({
      configured: true,
      running: latest?.status === 'in_progress' || latest?.status === 'queued',
      lastRun: latest?.updated_at || null,
      lastStatus: latest?.conclusion || latest?.status || null,
      runUrl: latest?.html_url || null,
    }, { headers: HEADERS });
  } catch {
    return NextResponse.json({ configured: true, error: true }, { headers: HEADERS });
  }
}

export async function POST() {
  const headers = ghHeaders();
  if (!headers) {
    return NextResponse.json({
      configured: false,
      error: 'GITHUB_PAT mangler',
    }, { status: 503, headers: HEADERS });
  }

  try {
    const res = await fetch(
      `${GH_API}/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ ref: 'main', inputs: { reason: 'Manuell oppdatering fra app' } }),
      }
    );

    if (res.status === 204) {
      return NextResponse.json({ started: true }, { headers: HEADERS });
    }
    const err = await res.text();
    return NextResponse.json({ started: false, error: err }, { status: res.status, headers: HEADERS });
  } catch (err: any) {
    return NextResponse.json({ started: false, error: err.message }, { status: 500, headers: HEADERS });
  }
}
