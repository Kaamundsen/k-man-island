/**
 * Sektor-klassifisering for norske aksjer
 * Basert på GICS (Global Industry Classification Standard)
 */

export type SectorId = 
  | 'energy'
  | 'materials'
  | 'industrials'
  | 'consumer_discretionary'
  | 'consumer_staples'
  | 'healthcare'
  | 'financials'
  | 'technology'
  | 'telecom'
  | 'utilities'
  | 'real_estate'
  | 'shipping'
  | 'seafood';

export interface SectorInfo {
  id: SectorId;
  name: string;
  nameNo: string;
  color: string;
  icon: string;
}

// Sektor-metadata
export const SECTORS: Record<SectorId, SectorInfo> = {
  energy: {
    id: 'energy',
    name: 'Energy',
    nameNo: 'Energi',
    color: '#f97316', // Orange
    icon: '⚡',
  },
  materials: {
    id: 'materials',
    name: 'Materials',
    nameNo: 'Materialer',
    color: '#84cc16', // Lime
    icon: '🏗️',
  },
  industrials: {
    id: 'industrials',
    name: 'Industrials',
    nameNo: 'Industri',
    color: '#64748b', // Slate
    icon: '🏭',
  },
  consumer_discretionary: {
    id: 'consumer_discretionary',
    name: 'Consumer Discretionary',
    nameNo: 'Forbrukervarer',
    color: '#ec4899', // Pink
    icon: '🛍️',
  },
  consumer_staples: {
    id: 'consumer_staples',
    name: 'Consumer Staples',
    nameNo: 'Dagligvarer',
    color: '#22c55e', // Green
    icon: '🛒',
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare',
    nameNo: 'Helse',
    color: '#ef4444', // Red
    icon: '🏥',
  },
  financials: {
    id: 'financials',
    name: 'Financials',
    nameNo: 'Finans',
    color: '#3b82f6', // Blue
    icon: '🏦',
  },
  technology: {
    id: 'technology',
    name: 'Technology',
    nameNo: 'Teknologi',
    color: '#8b5cf6', // Violet
    icon: '💻',
  },
  telecom: {
    id: 'telecom',
    name: 'Telecom',
    nameNo: 'Telekom',
    color: '#06b6d4', // Cyan
    icon: '📡',
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    nameNo: 'Forsyning',
    color: '#eab308', // Yellow
    icon: '💡',
  },
  real_estate: {
    id: 'real_estate',
    name: 'Real Estate',
    nameNo: 'Eiendom',
    color: '#a855f7', // Purple
    icon: '🏠',
  },
  shipping: {
    id: 'shipping',
    name: 'Shipping',
    nameNo: 'Shipping',
    color: '#0ea5e9', // Sky
    icon: '🚢',
  },
  seafood: {
    id: 'seafood',
    name: 'Seafood',
    nameNo: 'Sjømat',
    color: '#14b8a6', // Teal
    icon: '🐟',
  },
};

// Mapping: Ticker -> SectorId
export const STOCK_SECTORS: Record<string, SectorId> = {
  // ========================================
  // ENERGI (Olje, gass, fornybar)
  // ========================================
  'EQNR.OL': 'energy',     // Equinor
  'AKRBP.OL': 'energy',    // Aker BP
  'VAR.OL': 'energy',      // Vår Energi
  'OKEA.OL': 'energy',     // OKEA
  'TGS.OL': 'energy',      // TGS (seismikk)
  'PGS.OL': 'energy',      // PGS (seismikk)
  'AFK.OL': 'energy',      // Africa Energy
  'BWO.OL': 'energy',      // BW Offshore
  'FLNG.OL': 'energy',     // Flex LNG
  'DOF.OL': 'energy',      // DOF
  'AKSO.OL': 'energy',     // Aker Solutions
  'SUBC.OL': 'energy',     // Subsea 7
  'SOFF.OL': 'energy',     // Solstad Offshore
  'AKER.OL': 'energy',     // Aker (holding, mest energi)
  'BORR.OL': 'energy',     // Borr Drilling
  'SDRL.OL': 'energy',     // Seadrill
  'ARCHER.OL': 'energy',   // Archer
  'SHLF.OL': 'energy',     // Shelf Drilling
  'HAUTO.OL': 'energy',    // Höegh Autoliners (LNG)
  'HAVI.OL': 'energy',     // Havila Shipping
  
  // Fornybar energi
  'NEL.OL': 'energy',      // Nel (hydrogen)
  'SCATC.OL': 'energy',    // Scatec (sol)
  'REC.OL': 'energy',      // REC Silicon
  'RECSI.OL': 'energy',    // REC Silicon
  
  // ========================================
  // MATERIALER (Aluminium, kjemi, skog)
  // ========================================
  'NHY.OL': 'materials',   // Norsk Hydro (aluminium)
  'YAR.OL': 'materials',   // Yara (gjødsel)
  'BRG.OL': 'materials',   // Borregaard (kjemi)
  'NSKOG.OL': 'materials', // Norsk Skog
  'ELKEM.OL': 'materials', // Elkem
  
  // ========================================
  // INDUSTRI (Forsvar, engineering, konglomerat)
  // ========================================
  'KOG.OL': 'industrials', // Kongsberg Gruppen (forsvar/tech)
  'TOM.OL': 'industrials', // Tomra (resirkulering)
  'MULTI.OL': 'industrials', // Multiconsult
  'AUTO.OL': 'industrials',  // AutoStore
  'WAWI.OL': 'industrials',  // Wallenius Wilhelmsen
  'WSTEP.OL': 'industrials', // Wallenius Wilhelmsen
  'HPUR.OL': 'industrials',  // Hexagon Purus
  
  // ========================================
  // FORBRUKERVARER (Retail, gaming, fly)
  // ========================================
  'ORK.OL': 'consumer_staples',  // Orkla (mat/merkevarer)
  'NAS.OL': 'consumer_discretionary', // Norwegian Air
  'KAHOT.OL': 'consumer_discretionary', // Kahoot!
  'XXL.OL': 'consumer_discretionary',   // XXL Sport
  'KID.OL': 'consumer_discretionary',   // Kid ASA
  
  // ========================================
  // HELSE
  // ========================================
  'PHO.OL': 'healthcare',  // Photocure
  'MEDI.OL': 'healthcare', // Medistim
  
  // ========================================
  // FINANS (Bank, forsikring)
  // ========================================
  'DNB.OL': 'financials',  // DNB Bank
  'STB.OL': 'financials',  // Storebrand
  'GJF.OL': 'financials',  // Gjensidige Forsikring
  'PARB.OL': 'financials', // Pareto Bank
  'SRBNK.OL': 'financials', // SpareBank 1 SR-Bank
  'MING.OL': 'financials', // SpareBank 1 SMN
  'NONG.OL': 'financials', // SpareBank 1 Nord-Norge
  'SBANK.OL': 'financials', // Sbanken
  'AEGA.OL': 'financials', // Aega
  
  // ========================================
  // TEKNOLOGI (IT, software, hardware)
  // ========================================
  'NOD.OL': 'technology',  // Nordic Semiconductor
  'SCHA.OL': 'technology', // Schibsted (media/tech)
  'CRAYN.OL': 'technology', // Crayon
  'LINK.OL': 'technology', // Link Mobility
  'VOLUE.OL': 'technology', // Volue
  'OTEC.OL': 'technology', // Ocean Technology
  
  // ========================================
  // TELEKOM
  // ========================================
  'TEL.OL': 'telecom',     // Telenor
  
  // ========================================
  // SHIPPING / TRANSPORT
  // ========================================
  'MPCC.OL': 'shipping',   // MPC Container Ships
  'GOGL.OL': 'shipping',   // Golden Ocean
  'HAFNI.OL': 'shipping',  // Hafnia
  'FRO.OL': 'shipping',    // Frontline
  'STRO.OL': 'shipping',   // Stolt-Nielsen
  'BWLPG.OL': 'shipping',  // BW LPG
  'CLCO.OL': 'shipping',   // Cool Company
  'BELCO.OL': 'shipping',  // Belships
  '2020.OL': 'shipping',   // 2020 Bulkers
  'ODFB.OL': 'shipping',   // Odfjell A
  
  // ========================================
  // SJØMAT (Laks, fisk)
  // ========================================
  'MOWI.OL': 'seafood',    // Mowi
  'SALM.OL': 'seafood',    // SalMar
  'LSG.OL': 'seafood',     // Lerøy Seafood
  'BAKKA.OL': 'seafood',   // Bakkafrost
  'NRS.OL': 'seafood',     // Norway Royal Salmon
  'AUSS.OL': 'seafood',    // Austevoll Seafood
  'GSF.OL': 'seafood',     // Grieg Seafood
  
  // ========================================
  // EIENDOM
  // ========================================
  'ENTRA.OL': 'real_estate',   // Entra
  'OBOS.OL': 'real_estate',    // OBOS
  'SBO.OL': 'real_estate',     // Selvaag Bolig
  'OSLN.OL': 'real_estate',    // Oslo Børs VPS
};

/**
 * Hent sektor for en aksje
 */
export function getStockSector(ticker: string): SectorInfo | null {
  const sectorId = STOCK_SECTORS[ticker.toUpperCase()];
  if (!sectorId) return null;
  return SECTORS[sectorId];
}

/**
 * Hent sektornavn for visning
 */
export function getSectorName(ticker: string, norwegian = true): string {
  const sector = getStockSector(ticker);
  if (!sector) return 'Ukjent';
  return norwegian ? sector.nameNo : sector.name;
}

/**
 * Hent alle aksjer i en sektor
 */
export function getStocksBySector(sectorId: SectorId): string[] {
  return Object.entries(STOCK_SECTORS)
    .filter(([, sector]) => sector === sectorId)
    .map(([ticker]) => ticker);
}

/**
 * Grupper aksjer etter sektor
 */
export function groupStocksBySector(tickers: string[]): Record<SectorId | 'unknown', string[]> {
  const result: Record<string, string[]> = { unknown: [] };
  
  for (const ticker of tickers) {
    const sectorId = STOCK_SECTORS[ticker.toUpperCase()];
    if (sectorId) {
      if (!result[sectorId]) result[sectorId] = [];
      result[sectorId].push(ticker);
    } else {
      result.unknown.push(ticker);
    }
  }
  
  return result as Record<SectorId | 'unknown', string[]>;
}
