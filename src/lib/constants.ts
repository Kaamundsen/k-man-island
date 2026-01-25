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
