import { NextResponse } from 'next/server';

/**
 * Dagens Vinnere Scanner API
 * 
 * Scanner hele Oslo Børs (~200 aksjer) for:
 * - >3% daglig endring (opp eller ned)
 * - >1 MNOK omsetning (likviditet)
 */

// Utvidet liste over Oslo Børs aksjer
const OSLO_BORS_TICKERS = [
  // OBX (25 største)
  'EQNR.OL', 'DNB.OL', 'TEL.OL', 'MOWI.OL', 'YAR.OL', 'NHY.OL', 'ORK.OL',
  'AKRBP.OL', 'SALM.OL', 'STB.OL', 'KOG.OL', 'GJF.OL', 'SUBC.OL',
  'TGS.OL', 'AKER.OL', 'NEL.OL', 'VAR.OL', 'HAFNI.OL', 'LSG.OL', 'NOD.OL',
  'MPCC.OL', 'SCATC.OL', 'NAS.OL', 'OKEA.OL', 'AKSO.OL',
  
  // Mellomstore
  'BWO.OL', 'CRAYN.OL', 'DNO.OL', 'GOGL.OL', 'HAUTO.OL', 'KAHOT.OL',
  'KID.OL', 'PROT.OL', 'SATS.OL', 'WAWI.OL', 'SCHB.OL', 'BONHR.OL',
  'KIT.OL', 'ARCH.OL', 'BELCO.OL', 'RECSI.OL', 'NSKOG.OL', 'AGAS.OL',
  'FLNG.OL', 'PARB.OL', 'MULTI.OL', 'HAVI.OL', 'XXL.OL', 'BEWI.OL',
  
  // Små/Medium cap med potensial
  'AUSS.OL', 'LINK.OL', 'BWE.OL', 'CLOUD.OL', 'PGS.OL', 'SDRL.OL',
  'SOFF.OL', 'BAKKA.OL', 'BWLPG.OL', 'DOF.OL', 'ELMRA.OL', 'ENDUR.OL',
  'FORTE.OL', 'GRONG.OL', 'HPUR.OL', 'HUNT.OL', 'IDEX.OL', 'INSR.OL',
  'NEXT.OL', 'NORBT.OL', 'NORAM.OL', 'OET.OL', 'PARETO.OL', 'PCIB.OL',
  'PHO.OL', 'PNOR.OL', 'PROTCT.OL', 'RAKP.OL', 'REACH.OL', 'SAGA.OL',
  'SCHA.OL', 'SNI.OL', 'SOLON.OL', 'SRBNK.OL', 'TECH.OL', 'TOM.OL',
  'VEI.OL', 'VGM.OL', 'VOW.OL', 'WSTEP.OL', 'ZAL.OL',
];

interface Mover {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number; // Omsetning i NOK
  direction: 'up' | 'down';
}

interface MoversResponse {
  timestamp: string;
  totalScanned: number;
  winners: Mover[];
  losers: Mover[];
}

// Cache
let cachedMovers: MoversResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutter

export async function GET() {
  try {
    // Sjekk cache
    if (cachedMovers && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedMovers);
    }
    
    console.log(`🔥 Scanning ${OSLO_BORS_TICKERS.length} stocks for movers...`);
    const startTime = Date.now();
    
    // Batch-fetch alle aksjer
    const symbolsParam = OSLO_BORS_TICKERS.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance error: ${response.status}`);
    }
    
    const data = await response.json();
    const quotes = data.quoteResponse?.result || [];
    
    // Filtrer og kategoriser
    const winners: Mover[] = [];
    const losers: Mover[] = [];
    
    for (const q of quotes) {
      const price = q.regularMarketPrice || 0;
      const changePercent = q.regularMarketChangePercent || 0;
      const volume = q.regularMarketVolume || 0;
      const turnover = price * volume;
      
      // Filter: minst 3% endring OG minst 1 MNOK omsetning
      if (Math.abs(changePercent) >= 3 && turnover >= 1000000) {
        const mover: Mover = {
          ticker: q.symbol,
          name: q.shortName || q.longName || q.symbol,
          price,
          change: q.regularMarketChange || 0,
          changePercent,
          volume,
          turnover,
          direction: changePercent >= 0 ? 'up' : 'down',
        };
        
        if (changePercent >= 3) {
          winners.push(mover);
        } else if (changePercent <= -3) {
          losers.push(mover);
        }
      }
    }
    
    // Sorter etter endring (størst først)
    winners.sort((a, b) => b.changePercent - a.changePercent);
    losers.sort((a, b) => a.changePercent - b.changePercent);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Found ${winners.length} winners, ${losers.length} losers in ${elapsed}ms`);
    
    const result: MoversResponse = {
      timestamp: new Date().toISOString(),
      totalScanned: quotes.length,
      winners: winners.slice(0, 10), // Topp 10
      losers: losers.slice(0, 10),   // Bunn 10
    };
    
    // Cache resultatet
    cachedMovers = result;
    cacheTimestamp = Date.now();
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Movers scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan for movers' },
      { status: 500 }
    );
  }
}
