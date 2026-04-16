/**
 * Lokal pipeline-server — lar "Oppdater"-knappen i appen kjøre full pipeline.
 *
 * Kjør én gang i bakgrunnen:
 *   npx tsx scripts/local-server.ts
 *
 * Lytter på http://localhost:4242
 * POST /run-pipeline   → kjører load-prices + run-pipeline + run-scanner
 * GET  /status         → siste kjøring og status
 */
import http from 'http';
import { execSync, spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = 4242;
const ROOT = path.resolve(process.cwd());

interface RunState {
  running: boolean;
  lastRun: string | null;
  lastStatus: 'success' | 'error' | null;
  lastOutput: string;
  startedAt: string | null;
}

const state: RunState = {
  running: false,
  lastRun: null,
  lastStatus: null,
  lastOutput: '',
  startedAt: null,
};

function cors(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res: http.ServerResponse, code: number, data: object) {
  cors(res);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function runPipeline(): Promise<{ ok: boolean; output: string }> {
  const lines: string[] = [];
  const log = (s: string) => { console.log(s); lines.push(s); };

  try {
    log(`[${new Date().toISOString()}] 🚀 Pipeline startet`);

    log('📥 Laster OSE-priser...');
    execSync(`npx tsx ${ROOT}/scripts/load-prices.ts OSE`, {
      cwd: ROOT, stdio: 'pipe', timeout: 180000,
      env: { ...process.env }
    });
    log('✅ OSE-priser lastet');

    log('📥 Laster US-priser...');
    execSync(`npx tsx ${ROOT}/scripts/load-prices.ts US`, {
      cwd: ROOT, stdio: 'pipe', timeout: 180000,
      env: { ...process.env }
    });
    log('✅ US-priser lastet');

    log('⚙️  Beregner indikatorer...');
    execSync(`npx tsx ${ROOT}/scripts/run-pipeline.ts`, {
      cwd: ROOT, stdio: 'pipe', timeout: 240000,
      env: { ...process.env }
    });
    log('✅ Indikatorer beregnet');

    log('🔍 Kjører scanner...');
    const scanOut = execSync(`npx tsx ${ROOT}/scripts/run-scanner.ts`, {
      cwd: ROOT, stdio: 'pipe', timeout: 120000,
      env: { ...process.env }
    }).toString();
    log(scanOut.trim());
    log('✅ Scanner ferdig');

    log(`✅ Pipeline fullført ${new Date().toLocaleTimeString('nb-NO')}`);
    return { ok: true, output: lines.join('\n') };
  } catch (err: any) {
    const msg = err?.stderr?.toString() || err?.message || String(err);
    log(`❌ Feil: ${msg.slice(0, 500)}`);
    return { ok: false, output: lines.join('\n') };
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  if (url.pathname === '/status' && req.method === 'GET') {
    return json(res, 200, state);
  }

  if (url.pathname === '/run-pipeline' && req.method === 'POST') {
    if (state.running) {
      return json(res, 409, { error: 'Pipeline kjører allerede', state });
    }
    state.running = true;
    state.startedAt = new Date().toISOString();

    // Respond immediately so UI doesn't hang
    json(res, 202, { message: 'Pipeline startet', startedAt: state.startedAt });

    // Run in background
    runPipeline().then(({ ok, output }) => {
      state.running = false;
      state.lastRun = new Date().toISOString();
      state.lastStatus = ok ? 'success' : 'error';
      state.lastOutput = output;
      state.startedAt = null;
    });
    return;
  }

  json(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n🟢 K-MAN lokal pipeline-server kjører på http://localhost:${PORT}`);
  console.log('   "Oppdater"-knappen i appen vil nå kjøre full pipeline.\n');
  console.log('   Stopp med Ctrl+C\n');
});
