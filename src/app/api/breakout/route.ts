import { NextResponse } from 'next/server';
import { scanForBreakouts } from '@/lib/api/breakout-scanner';

// Alle aksjer vi scanner for breakouts
const SCAN_UNIVERSE = [
  // OBX hovedaksjer
  'EQNR.OL', 'DNB.OL', 'MOWI.OL', 'TEL.OL', 'ORK.OL',
  'YAR.OL', 'NHY.OL', 'AKRBP.OL', 'SALM.OL', 'STB.OL',
  'KOG.OL', 'GJF.OL', 'AKSO.OL', 'TGS.OL', 'SUBC.OL',
  'AKER.OL', 'BAKKA.OL', 'BWO.OL', 'CRAYN.OL', 'DNO.OL',
  
  // Mid-cap med momentum-potensial
  'KID.OL', 'PROT.OL', 'NOD.OL', 'SATS.OL', 'VAR.OL',
  'OKEA.OL', 'HAFNI.OL', 'HAUTO.OL', 'MPCC.OL', 'WAWI.OL',
  'SCHB.OL', 'BONHR.OL', 'KIT.OL', 'ARCH.OL', 'BELCO.OL',
  'NEL.OL', 'RECSI.OL', 'SCATC.OL', 'NSKOG.OL', 'AGAS.OL',
  
  // Small-cap breakout kandidater
  'AUSS.OL', 'LINK.OL', 'XXL.OL', 'BWE.OL', 'CLOUD.OL',
];

// Cache for å unngå for mange API-kall
let cachedResults: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutter

export async function GET() {
  try {
    // Returner cached data hvis fersk
    if (cachedResults && (Date.now() - cachedResults.timestamp) < CACHE_DURATION) {
      console.log('📦 Returning cached breakout scan');
      return NextResponse.json(cachedResults.data);
    }
    
    console.log('🔍 Running fresh breakout scan...');
    const candidates = await scanForBreakouts(SCAN_UNIVERSE);
    
    // Kategoriser etter setup-type
    const imminent = candidates.filter(c => c.setup === 'IMMINENT');
    const building = candidates.filter(c => c.setup === 'BUILDING');
    const watching = candidates.filter(c => c.setup === 'WATCHING');
    
    const result = {
      timestamp: new Date().toISOString(),
      totalScanned: SCAN_UNIVERSE.length,
      totalCandidates: candidates.length,
      imminent,
      building,
      watching,
    };
    
    // Cache resultatene
    cachedResults = { data: result, timestamp: Date.now() };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Breakout scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan for breakouts' },
      { status: 500 }
    );
  }
}
