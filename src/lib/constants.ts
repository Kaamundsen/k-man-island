/**
 * Application Constants
 * 
 * Centralized configuration values used across the application.
 */

// ============================================
// CHART & ANALYSIS CONSTANTS
// ============================================

/**
 * Minimum number of bars (candles) required for meaningful analysis
 */
export const MIN_BARS_FOR_ANALYSIS = 50;

/**
 * Recommended number of bars for optimal analysis accuracy
 */
export const RECOMMENDED_BARS = 200;

/**
 * Default lookback period for technical indicators
 */
export const DEFAULT_LOOKBACK_DAYS = 365;

// ============================================
// TRADING CONSTANTS
// ============================================

/**
 * Default risk percentage per trade
 */
export const DEFAULT_RISK_PERCENT = 1;

/**
 * Maximum risk percentage allowed per trade
 */
export const MAX_RISK_PERCENT = 2;

/**
 * Default target R/R ratio
 */
export const DEFAULT_RR_RATIO = 2.5;

// ============================================
// API CONSTANTS
// ============================================

/**
 * Default cache TTL in seconds
 */
export const DEFAULT_CACHE_TTL = 300; // 5 minutes

/**
 * Stock data cache TTL
 */
export const STOCK_CACHE_TTL = 60; // 1 minute for live data

/**
 * Analysis cache TTL
 */
export const ANALYSIS_CACHE_TTL = 3600; // 1 hour for analysis

// ============================================
// MARKET CONSTANTS
// ============================================

/**
 * Oslo Stock Exchange market hours (CET/CEST)
 */
export const OSLO_MARKET_HOURS = {
  open: { hour: 9, minute: 0 },
  close: { hour: 16, minute: 20 },
};

/**
 * US Market hours (EST/EDT)
 */
export const US_MARKET_HOURS = {
  preMarket: { hour: 4, minute: 0 },
  open: { hour: 9, minute: 30 },
  close: { hour: 16, minute: 0 },
  afterHours: { hour: 20, minute: 0 },
};

// ============================================
// OSLO STOCK LISTS
// ============================================

/**
 * Top 50 most liquid stocks on Oslo Børs (OBX + large OSEBX)
 */
export const OSLO_STOCKS_50: string[] = [
  // OBX - 25 largest
  'EQNR.OL', 'DNB.OL', 'MOWI.OL', 'TEL.OL', 'YAR.OL',
  'ORK.OL', 'NHY.OL', 'SALM.OL', 'STB.OL', 'AKRBP.OL',
  'SUBC.OL', 'KOG.OL', 'SCATC.OL', 'GJF.OL', 'NSKOG.OL',
  'AKSO.OL', 'MPCC.OL', 'TGS.OL', 'PGS.OL', 'REC.OL',
  'NAPA.OL', 'XXL.OL', 'AURG.OL', 'BEWI.OL',
  // Other large OSEBX stocks
  'VAR.OL', 'OKEA.OL', 'NEL.OL', 'AFK.OL', 'AKER.OL',
  'BWO.OL', 'FLNG.OL', 'GOGL.OL', 'HAFNI.OL', 'HAVI.OL',
  'KAHOT.OL', 'LSG.OL', 'MULTI.OL', 'NAS.OL', 'NONG.OL',
  'NOD.OL', 'NRS.OL', 'PARB.OL', 'RECSI.OL', 'SDRL.OL',
  'SOFF.OL', 'WSTEP.OL', 'WAWI.OL', 'BAKKA.OL', 'COOL.OL',
  'BORR.OL',
];

/**
 * Top 100 Oslo Børs stocks
 */
export const OSLO_STOCKS_100: string[] = [
  ...OSLO_STOCKS_50,
  // Additional stocks 51-100
  'AGAS.OL', 'ARCH.OL', 'AUTO.OL', 'BELCO.OL', 'BWLPG.OL',
  'CADLR.OL', 'CRAYN.OL', 'DNO.OL', 'DOF.OL', 'ELMRA.OL',
  'EPR.OL', 'FJORD.OL', 'FRO.OL', 'HAUTO.OL', 'HBC.OL',
  'IDEX.OL', 'INSR.OL', 'KIT.OL', 'KVAER.OL', 'LINK.OL',
  'MEDI.OL', 'MING.OL', 'NANO.OL', 'NEXT.OL', 'NOM.OL',
  'NRC.OL', 'OLT.OL', 'OTS.OL', 'PHO.OL', 'PLAY.OL',
  'PROT.OL', 'PSKY.OL', 'RAKP.OL', 'RING.OL', 'SASNO.OL',
  'SCHB.OL', 'SCHA.OL', 'SNI.OL', 'SRBNK.OL', 'TECH.OL',
  'TOM.OL', 'ULTI.OL', 'VEI.OL', 'VOW.OL', 'WWI.OL',
  'ZAL.OL', 'ZWIPE.OL', 'B2H.OL', 'AEGA.OL',
];

/**
 * Top 150 Oslo Børs stocks
 */
export const OSLO_STOCKS_150: string[] = [
  ...OSLO_STOCKS_100,
  // Additional stocks 101-150
  'ABG.OL', 'AGLX.OL', 'AKVA.OL', 'AMSC.OL', 'ATEA.OL',
  'AXA.OL', 'BGBIO.OL', 'BMA.OL', 'BOUV.OL', 'BWEK.OL',
  'CLOUD.OL', 'CONTE.OL', 'CSAM.OL', 'EIOF.OL', 'ELK.OL',
  'EME.OL', 'ENTRA.OL', 'FORTE.OL', 'GILT.OL', 'HADEAN.OL',
  'HMONY.OL', 'HYPRO.OL', 'IFISH.OL', 'INIFY.OL', 'ITERA.OL',
  'JIN.OL', 'JAREN.OL', 'KYOTO.OL', 'LISB.OL', 'MORG.OL',
  'NORBT.OL', 'NORTH.OL', 'NTI.OL', 'ODFB.OL', 'ODFJB.OL',
  'PCIB.OL', 'PNOR.OL', 'PSE.OL', 'QFR.OL', 'RIVER.OL',
  'SAGA.OL', 'SALME.OL', 'SDSD.OL', 'SHARE.OL', 'SIKRI.OL',
  'SPOL.OL', 'SSO.OL', 'STORM.OL', 'SVG.OL', 'VISTN.OL',
];

/**
 * Top 200 Oslo Børs stocks
 */
export const OSLO_STOCKS_200: string[] = [
  ...OSLO_STOCKS_150,
  // Additional stocks 151-200
  'ACER.OL', 'ADRS.OL', 'AIRX.OL', 'AKAST.OL', 'ALNG.OL',
  'ANDRO.OL', 'AQUA.OL', 'ARGEO.OL', 'ASTRO.OL', 'ATLA.OL',
  'AYFIE.OL', 'BASS.OL', 'BCS.OL', 'BDRILL.OL', 'BONHR.OL',
  'BPLA.OL', 'BSMO.OL', 'CAMBI.OL', 'CASP.OL', 'CHROM.OL',
  'CIRCA.OL', 'COLNE.OL', 'CYVIZ.OL', 'DOOR.OL', 'EDGA.OL',
  'ELOP.OL', 'ELOPS.OL', 'EMGS.OL', 'ENDUR.OL', 'ENSU.OL',
  'ENSUR.OL', 'ERA.OL', 'EXTX.OL', 'FENIX.OL', 'FLYR.OL',
  'FOSS.OL', 'FREQ.OL', 'FUNCO.OL', 'GIG.OL', 'GYL.OL',
  'HFRS.OL', 'HSPN.OL', 'HUNT.OL', 'HYON.OL', 'IMSK.OL',
  'ISPL.OL', 'KOMPL.OL', 'LIFE.OL', 'MAFA.OL', 'MAGSN.OL',
];

/**
 * Full list of Oslo Børs stocks (all available)
 */
export const OSLO_STOCKS_FULL: string[] = [
  ...OSLO_STOCKS_200,
  // Can be extended with more stocks as needed
];

// ============================================
// USA STOCK LISTS (S&P 100 + NASDAQ 100)
// ============================================

/**
 * S&P 100 constituents
 * Large-cap US stocks from the S&P 100 index
 */
export const SP100_STOCKS: string[] = [
  'AAPL', 'ABBV', 'ABT', 'ACN', 'ADBE', 'AIG', 'AMD', 'AMGN', 'AMT', 'AMZN',
  'AVGO', 'AXP', 'BA', 'BAC', 'BK', 'BKNG', 'BLK', 'BMY', 'BRK-B', 'C',
  'CAT', 'CHTR', 'CL', 'CMCSA', 'COF', 'COP', 'COST', 'CRM', 'CSCO', 'CVS',
  'CVX', 'DE', 'DHR', 'DIS', 'DOW', 'DUK', 'EMR', 'EXC', 'F', 'FDX',
  'GD', 'GE', 'GILD', 'GM', 'GOOG', 'GOOGL', 'GS', 'HD', 'HON', 'IBM',
  'INTC', 'JNJ', 'JPM', 'KHC', 'KO', 'LIN', 'LLY', 'LMT', 'LOW', 'MA',
  'MCD', 'MDLZ', 'MDT', 'MET', 'META', 'MMM', 'MO', 'MRK', 'MS', 'MSFT',
  'NEE', 'NFLX', 'NKE', 'NVDA', 'ORCL', 'PEP', 'PFE', 'PG', 'PM', 'PYPL',
  'QCOM', 'RTX', 'SBUX', 'SCHW', 'SO', 'SPG', 'T', 'TGT', 'TMO', 'TMUS',
  'TXN', 'UNH', 'UNP', 'UPS', 'USB', 'V', 'VZ', 'WBA', 'WFC', 'WMT', 'XOM',
];

/**
 * NASDAQ 100 constituents
 * Large-cap tech-heavy stocks from the NASDAQ 100 index
 */
export const NASDAQ100_STOCKS: string[] = [
  'AAPL', 'ABNB', 'ADBE', 'ADI', 'ADP', 'ADSK', 'AEP', 'AMAT', 'AMD', 'AMGN',
  'AMZN', 'ANSS', 'APP', 'ARM', 'ASML', 'AVGO', 'AZN', 'BIIB', 'BKNG', 'BKR',
  'CCEP', 'CDNS', 'CDW', 'CEG', 'CHTR', 'CMCSA', 'COST', 'CPRT', 'CRWD', 'CSCO',
  'CSGP', 'CSX', 'CTAS', 'CTSH', 'DASH', 'DDOG', 'DLTR', 'DXCM', 'EA', 'EXC',
  'FANG', 'FAST', 'FTNT', 'GEHC', 'GFS', 'GILD', 'GOOG', 'GOOGL', 'HON', 'IDXX',
  'ILMN', 'INTC', 'INTU', 'ISRG', 'KDP', 'KHC', 'KLAC', 'LIN', 'LRCX', 'LULU',
  'MAR', 'MCHP', 'MDB', 'MDLZ', 'MELI', 'META', 'MNST', 'MRNA', 'MRVL', 'MSFT',
  'MU', 'NFLX', 'NVDA', 'NXPI', 'ODFL', 'ON', 'ORLY', 'PANW', 'PAYX', 'PCAR',
  'PDD', 'PEP', 'PYPL', 'QCOM', 'REGN', 'ROST', 'SBUX', 'SMCI', 'SNPS', 'TEAM',
  'TMUS', 'TSLA', 'TTD', 'TTWO', 'TXN', 'VRSK', 'VRTX', 'WBD', 'WDAY', 'XEL', 'ZS',
];

/**
 * Index membership type for USA stocks
 */
export type USAIndexMembership = 'SP100' | 'NDX100' | 'BOTH';

/**
 * USA Core Universe - Combined S&P 100 + NASDAQ 100 (deduplicated)
 * This is the single source of truth for USA stocks
 */
export const USA_CORE_STOCKS: string[] = Array.from(
  new Set([...SP100_STOCKS, ...NASDAQ100_STOCKS])
).sort();

/**
 * Index membership metadata for each USA stock
 * Maps ticker to which index(es) it belongs to
 */
export const USA_INDEX_MEMBERSHIP: Record<string, USAIndexMembership> = (() => {
  const sp100Set = new Set(SP100_STOCKS);
  const ndx100Set = new Set(NASDAQ100_STOCKS);
  const membership: Record<string, USAIndexMembership> = {};
  
  USA_CORE_STOCKS.forEach(ticker => {
    const inSP100 = sp100Set.has(ticker);
    const inNDX100 = ndx100Set.has(ticker);
    
    if (inSP100 && inNDX100) {
      membership[ticker] = 'BOTH';
    } else if (inSP100) {
      membership[ticker] = 'SP100';
    } else {
      membership[ticker] = 'NDX100';
    }
  });
  
  return membership;
})();

/**
 * Get stocks by index membership
 */
export function getStocksByIndex(index: USAIndexMembership | 'ALL'): string[] {
  if (index === 'ALL') return USA_CORE_STOCKS;
  
  return USA_CORE_STOCKS.filter(ticker => {
    const membership = USA_INDEX_MEMBERSHIP[ticker];
    if (index === 'BOTH') return membership === 'BOTH';
    if (index === 'SP100') return membership === 'SP100' || membership === 'BOTH';
    if (index === 'NDX100') return membership === 'NDX100' || membership === 'BOTH';
    return false;
  });
}
