'use client';

import { useState } from 'react';
import { 
  Clipboard, 
  Sparkles, 
  Save, 
  X, 
  CheckCircle,
  Loader2,
  Tag,
  Wand2,
  BookOpen,
} from 'lucide-react';
import { saveArticleTip, type StockMention, type ArticleSource } from '@/lib/store/article-tips';

// ============ TEKSTVASKER ============
// Renser artikler for reklame, navigasjon, bilder, etc.

function cleanArticleText(rawText: string): string {
  let text = rawText;
  
  // 1. Fjern bildetekster og -referanser
  text = text.replace(/\[.*?(bilde|foto|image|graf|figur|illustrasjon).*?\]/gi, '');
  text = text.replace(/Foto:.*?(\n|$)/gi, '\n');
  text = text.replace(/Bilde:.*?(\n|$)/gi, '\n');
  text = text.replace(/Illustrasjon:.*?(\n|$)/gi, '\n');
  text = text.replace(/\(Foto:.*?\)/gi, '');
  
  // 2. Fjern reklame-markører
  text = text.replace(/\bAnnonse\b.*?(\n|$)/gi, '\n');
  text = text.replace(/\bReklame\b.*?(\n|$)/gi, '\n');
  text = text.replace(/\bSponsored\b.*?(\n|$)/gi, '\n');
  text = text.replace(/\bPartnerinnhold\b.*?(\n|$)/gi, '\n');
  text = text.replace(/\bSponset innhold\b.*?(\n|$)/gi, '\n');
  
  // 3. Fjern "Les også" / "Se også" seksjoner
  text = text.replace(/Les også:.*?(\n\n|\n(?=[A-ZÆØÅ]))/gi, '\n');
  text = text.replace(/Se også:.*?(\n\n|\n(?=[A-ZÆØÅ]))/gi, '\n');
  text = text.replace(/Relatert:.*?(\n\n|\n(?=[A-ZÆØÅ]))/gi, '\n');
  text = text.replace(/Les mer:.*?(\n\n|\n(?=[A-ZÆØÅ]))/gi, '\n');
  
  // 4. Fjern navigasjons-elementer
  text = text.replace(/^(Hjem|Forside|Meny|Søk|Logg inn|Min side|Abonner).*$/gmi, '');
  text = text.replace(/^(Del på|Share on|Facebook|Twitter|LinkedIn|E-post|Skriv ut).*$/gmi, '');
  
  // 5. Fjern cookie/GDPR-tekst
  text = text.replace(/Vi bruker (informasjons)?kapsler.*?(\n\n|$)/gi, '');
  text = text.replace(/cookies.*?personvern.*?(\n\n|$)/gi, '');
  
  // 6. Fjern abonnement-prompts
  text = text.replace(/Få tilgang til.*?abonner.*?(\n\n|$)/gi, '');
  text = text.replace(/Logg inn for å lese.*?(\n|$)/gi, '');
  text = text.replace(/Allerede abonnent\?.*?(\n|$)/gi, '');
  text = text.replace(/\d+ kr.*?måned.*?(\n|$)/gi, '');
  
  // 7. Fjern metadata-linjer
  text = text.replace(/^Publisert:?\s*\d{1,2}\..*?\d{4}.*$/gmi, '');
  text = text.replace(/^Oppdatert:?\s*\d{1,2}\..*?\d{4}.*$/gmi, '');
  text = text.replace(/^Av:?\s+[A-ZÆØÅ][a-zæøå]+\s+[A-ZÆØÅ][a-zæøå]+.*$/gm, '');
  
  // 8. Fjern tomme parenteser og hakeparenteser
  text = text.replace(/\(\s*\)/g, '');
  text = text.replace(/\[\s*\]/g, '');
  
  // 9. Fjern URL-er og URL-paths
  text = text.replace(/https?:\/\/[^\s]+/g, '');
  text = text.replace(/^\s*\/[a-z\-]+\/[a-z0-9\-\/]+\s*$/gmi, ''); // Fjern linjer som bare er URL-path
  text = text.replace(/\/boers-og-finans\/[^\s\n]+/gi, ''); // E24 paths
  text = text.replace(/\/bors\/[^\s\n]+/gi, ''); // DN/FA paths
  
  // 10. Fjern emoji-sekvenser (men behold enkle emojis)
//   text = text.replace(/[\u{1F300}-\u{1F9FF}]{3,}/gu, '');
  
  // 11. Fjern gjentatte linjeskift (mer enn 2)
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // 12. Fjern linjer som bare er tall eller spesialtegn
  text = text.replace(/^[\d\s\-–—•·]+$/gm, '');
  
  // 13. Fjern korte linjer (sannsynligvis navigasjon/meny)
  const lines = text.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    // Behold linjer som er tomme (for avsnitt) eller har mer enn 20 tegn
    // eller starter med stor bokstav og har minst 10 tegn (overskrifter)
    return trimmed === '' || 
           trimmed.length > 20 || 
           (/^[A-ZÆØÅ]/.test(trimmed) && trimmed.length > 10);
  });
  text = cleanedLines.join('\n');
  
  // 14. Trim start og slutt
  text = text.trim();
  
  return text;
}

// Ekstraher bare hovedteksten (prøv å finne artikkelen)
function extractMainContent(text: string): string {
  // Prøv å finne hvor artikkelen starter (etter overskrift og ingress)
  const lines = text.split('\n').filter(l => l.trim());
  
  if (lines.length < 3) return text;
  
  // Finn første lange paragraf (sannsynligvis starten på artikkelen)
  let startIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (lines[i].length > 100) {
      startIndex = Math.max(0, i - 1); // Inkluder linjen før (mulig overskrift)
      break;
    }
  }
  
  return lines.slice(startIndex).join('\n');
}

interface QuickArticleCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

// Enkel intern type for detekterte aksjer (før konvertering til StockMention)
interface DetectedStock {
  ticker: string;
  name: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  highlight?: string; // Kursmål eller annen viktig info
  isExternal?: boolean; // Ikke i vårt system (utenlandsk/ukjent)
}

// Kjente tickers for auto-deteksjon - utvidet liste
const TICKER_MAP: Record<string, { ticker: string; name: string }> = {
  // Store selskaper
  'ORKLA': { ticker: 'ORK.OL', name: 'Orkla' },
  'ORK': { ticker: 'ORK.OL', name: 'Orkla' },
  'EQUINOR': { ticker: 'EQNR.OL', name: 'Equinor' },
  'EQNR': { ticker: 'EQNR.OL', name: 'Equinor' },
  'DNB': { ticker: 'DNB.OL', name: 'DNB' },
  'NORSK HYDRO': { ticker: 'NHY.OL', name: 'Norsk Hydro' },
  'NHY': { ticker: 'NHY.OL', name: 'Norsk Hydro' },
  'HYDRO': { ticker: 'NHY.OL', name: 'Norsk Hydro' },
  'TELENOR': { ticker: 'TEL.OL', name: 'Telenor' },
  'TEL': { ticker: 'TEL.OL', name: 'Telenor' },
  'MOWI': { ticker: 'MOWI.OL', name: 'Mowi' },
  'YARA': { ticker: 'YAR.OL', name: 'Yara' },
  'YAR': { ticker: 'YAR.OL', name: 'Yara' },
  'AKER': { ticker: 'AKER.OL', name: 'Aker' },
  'AKER BP': { ticker: 'AKRBP.OL', name: 'Aker BP' },
  'AKRBP': { ticker: 'AKRBP.OL', name: 'Aker BP' },
  'AKER SOLUTIONS': { ticker: 'AKSO.OL', name: 'Aker Solutions' },
  'AKSO': { ticker: 'AKSO.OL', name: 'Aker Solutions' },
  
  // Olje & Energi
  'VÅR ENERGI': { ticker: 'VAR.OL', name: 'Vår Energi' },
  'VAR': { ticker: 'VAR.OL', name: 'Vår Energi' },
  'OKEA': { ticker: 'OKEA.OL', name: 'OKEA' },
  'TGS': { ticker: 'TGS.OL', name: 'TGS' },
  'PGS': { ticker: 'PGS.OL', name: 'PGS' },
  'SUBSEA 7': { ticker: 'SUBC.OL', name: 'Subsea 7' },
  'SUBC': { ticker: 'SUBC.OL', name: 'Subsea 7' },
  'DOF': { ticker: 'DOF.OL', name: 'DOF' },
  'BORR': { ticker: 'BORR.OL', name: 'Borr Drilling' },
  'BORR DRILLING': { ticker: 'BORR.OL', name: 'Borr Drilling' },
  'SEADRILL': { ticker: 'SDRL.OL', name: 'Seadrill' },
  'SDRL': { ticker: 'SDRL.OL', name: 'Seadrill' },
  'ODFJELL DRILLING': { ticker: 'ODL.OL', name: 'Odfjell Drilling' },
  'ODL': { ticker: 'ODL.OL', name: 'Odfjell Drilling' },
  'SOILTECH': { ticker: 'SOIL.OL', name: 'Soiltech' },
  'SOIL': { ticker: 'SOIL.OL', name: 'Soiltech' },
  'ARCHER': { ticker: 'ARCH.OL', name: 'Archer' },
  'ARCH': { ticker: 'ARCH.OL', name: 'Archer' },
  'BW OFFSHORE': { ticker: 'BWO.OL', name: 'BW Offshore' },
  'BWO': { ticker: 'BWO.OL', name: 'BW Offshore' },
  'PROSAFE': { ticker: 'PRS.OL', name: 'Prosafe' },
  'PRS': { ticker: 'PRS.OL', name: 'Prosafe' },
  
  // Shipping
  'FRONTLINE': { ticker: 'FRO.OL', name: 'Frontline' },
  'FRO': { ticker: 'FRO.OL', name: 'Frontline' },
  'HAFNIA': { ticker: 'HAFNI.OL', name: 'Hafnia' },
  'HAFNI': { ticker: 'HAFNI.OL', name: 'Hafnia' },
  'GOLDEN OCEAN': { ticker: 'GOGL.OL', name: 'Golden Ocean' },
  'GOGL': { ticker: 'GOGL.OL', name: 'Golden Ocean' },
  'GOLDEN ENERGY': { ticker: 'GEOS.OL', name: 'Golden Energy Offshore' },
  'GEOS': { ticker: 'GEOS.OL', name: 'Golden Energy Offshore' },
  'MPC CONTAINER': { ticker: 'MPCC.OL', name: 'MPC Container Ships' },
  'MPCC': { ticker: 'MPCC.OL', name: 'MPC Container Ships' },
  'WALLENIUS': { ticker: 'WAWI.OL', name: 'Wallenius Wilhelmsen' },
  'WAWI': { ticker: 'WAWI.OL', name: 'Wallenius Wilhelmsen' },
  
  // Sjømat
  'SALMAR': { ticker: 'SALM.OL', name: 'SalMar' },
  'SALM': { ticker: 'SALM.OL', name: 'SalMar' },
  'LERØY': { ticker: 'LSG.OL', name: 'Lerøy Seafood' },
  'LEROY': { ticker: 'LSG.OL', name: 'Lerøy Seafood' },
  'LSG': { ticker: 'LSG.OL', name: 'Lerøy Seafood' },
  'BAKKAFROST': { ticker: 'BAKKA.OL', name: 'Bakkafrost' },
  'BAKKA': { ticker: 'BAKKA.OL', name: 'Bakkafrost' },
  'GRIEG SEAFOOD': { ticker: 'GSF.OL', name: 'Grieg Seafood' },
  'GSF': { ticker: 'GSF.OL', name: 'Grieg Seafood' },
  'AUSTEVOLL': { ticker: 'AUSS.OL', name: 'Austevoll Seafood' },
  'AUSS': { ticker: 'AUSS.OL', name: 'Austevoll Seafood' },
  
  // Tech & Industri
  'KONGSBERG': { ticker: 'KOG.OL', name: 'Kongsberg Gruppen' },
  'KOG': { ticker: 'KOG.OL', name: 'Kongsberg Gruppen' },
  'TOMRA': { ticker: 'TOM.OL', name: 'Tomra' },
  'TOM': { ticker: 'TOM.OL', name: 'Tomra' },
  'NEL': { ticker: 'NEL.OL', name: 'Nel' },
  'SCATEC': { ticker: 'SCATC.OL', name: 'Scatec' },
  'SCATC': { ticker: 'SCATC.OL', name: 'Scatec' },
  'AUTOSTORE': { ticker: 'AUTO.OL', name: 'AutoStore' },
  'AUTO': { ticker: 'AUTO.OL', name: 'AutoStore' },
  'KITRON': { ticker: 'KIT.OL', name: 'Kitron' },
  'KIT': { ticker: 'KIT.OL', name: 'Kitron' },
  'NORDIC SEMICONDUCTOR': { ticker: 'NOD.OL', name: 'Nordic Semiconductor' },
  'NOD': { ticker: 'NOD.OL', name: 'Nordic Semiconductor' },
  'CRAYON': { ticker: 'CRAYN.OL', name: 'Crayon' },
  'CRAYN': { ticker: 'CRAYN.OL', name: 'Crayon' },
  'SMARTCRAFT': { ticker: 'SMCRT.OL', name: 'SmartCraft' },
  'SMCRT': { ticker: 'SMCRT.OL', name: 'SmartCraft' },
  'KAHOOT': { ticker: 'KAHOT.OL', name: 'Kahoot' },
  'KAHOT': { ticker: 'KAHOT.OL', name: 'Kahoot' },
  
  // Bank & Finans
  'STOREBRAND': { ticker: 'STB.OL', name: 'Storebrand' },
  'STB': { ticker: 'STB.OL', name: 'Storebrand' },
  'GJENSIDIGE': { ticker: 'GJF.OL', name: 'Gjensidige' },
  'GJF': { ticker: 'GJF.OL', name: 'Gjensidige' },
  'SPAREBANK': { ticker: 'SRBNK.OL', name: 'SpareBank 1 SR-Bank' },
  'SRBNK': { ticker: 'SRBNK.OL', name: 'SpareBank 1 SR-Bank' },
  
  // Eiendom
  'PUBLIC PROPERTY': { ticker: 'PUBP.OL', name: 'Public Property Invest' },
  'PUBP': { ticker: 'PUBP.OL', name: 'Public Property Invest' },
  'ENTRA': { ticker: 'ENTRA.OL', name: 'Entra' },
  'OLAV THON': { ticker: 'OLT.OL', name: 'Olav Thon Eiendom' },
  'OLT': { ticker: 'OLT.OL', name: 'Olav Thon Eiendom' },
  
  // Andre
  'VOW': { ticker: 'VOW.OL', name: 'Vow' },
  'SCHIBSTED': { ticker: 'SCHA.OL', name: 'Schibsted' },
  'SCHA': { ticker: 'SCHA.OL', name: 'Schibsted' },
  'ADEVINTA': { ticker: 'ADE.OL', name: 'Adevinta' },
  'ADE': { ticker: 'ADE.OL', name: 'Adevinta' },
  'SAGA PURE': { ticker: 'SAGA.OL', name: 'Saga Pure' },
  'SAGA': { ticker: 'SAGA.OL', name: 'Saga Pure' },
  'TEKNA': { ticker: 'TEKNA.OL', name: 'Tekna Holding' },
  'ZELLUNA': { ticker: 'ZELA.OL', name: 'Zelluna' },
  'ZELA': { ticker: 'ZELA.OL', name: 'Zelluna' },
  'PYRUM': { ticker: 'PYRUM.OL', name: 'Pyrum Innovations' },
  'XXL': { ticker: 'XXL.OL', name: 'XXL' },
  'KOMPLETT': { ticker: 'KOMPL.OL', name: 'Komplett' },
  'KOMPL': { ticker: 'KOMPL.OL', name: 'Komplett' },
  'NORWEGIAN': { ticker: 'NAS.OL', name: 'Norwegian Air Shuttle' },
  'NAS': { ticker: 'NAS.OL', name: 'Norwegian Air Shuttle' },
  'FLYR': { ticker: 'FLYR.OL', name: 'Flyr' },
  'SATS': { ticker: 'SATS.OL', name: 'Sats' },
  
  // Analytikerhus for referanse
  'CLARKSON': { ticker: 'CLARKSON', name: 'Clarkson Securities (Analytiker)' },
  'ARCTIC': { ticker: 'ARCTIC', name: 'Arctic Securities (Analytiker)' },
  'PARETO': { ticker: 'PARETO', name: 'Pareto Securities (Analytiker)' },
  'DNB MARKETS': { ticker: 'DNBM', name: 'DNB Markets (Analytiker)' },
  'CARNEGIE': { ticker: 'CARNEGIE', name: 'Carnegie (Analytiker)' },
  'FEARNLEY': { ticker: 'FEARNLEY', name: 'Fearnley Securities (Analytiker)' },
  'KEPLER': { ticker: 'KEPLER', name: 'Kepler Cheuvreux (Analytiker)' },
  'ABG': { ticker: 'ABG', name: 'ABG Sundal Collier (Analytiker)' },
  'NORNE': { ticker: 'NORNE', name: 'Norne Securities (Analytiker)' },
  'SPAREBANK MARKETS': { ticker: 'SBM', name: 'SpareBank 1 Markets (Analytiker)' },
  
  // ============================================
  // USA STOCKS (S&P 100 + NASDAQ 100)
  // ============================================
  
  // Big Tech
  'APPLE': { ticker: 'AAPL', name: 'Apple' },
  'AAPL': { ticker: 'AAPL', name: 'Apple' },
  'MICROSOFT': { ticker: 'MSFT', name: 'Microsoft' },
  'MSFT': { ticker: 'MSFT', name: 'Microsoft' },
  'GOOGLE': { ticker: 'GOOGL', name: 'Alphabet' },
  'ALPHABET': { ticker: 'GOOGL', name: 'Alphabet' },
  'GOOGL': { ticker: 'GOOGL', name: 'Alphabet' },
  'GOOG': { ticker: 'GOOG', name: 'Alphabet' },
  'AMAZON': { ticker: 'AMZN', name: 'Amazon' },
  'AMZN': { ticker: 'AMZN', name: 'Amazon' },
  'META': { ticker: 'META', name: 'Meta Platforms' },
  'FACEBOOK': { ticker: 'META', name: 'Meta Platforms' },
  'NVIDIA': { ticker: 'NVDA', name: 'NVIDIA' },
  'NVDA': { ticker: 'NVDA', name: 'NVIDIA' },
  'TESLA': { ticker: 'TSLA', name: 'Tesla' },
  'TSLA': { ticker: 'TSLA', name: 'Tesla' },
  'NETFLIX': { ticker: 'NFLX', name: 'Netflix' },
  'NFLX': { ticker: 'NFLX', name: 'Netflix' },
  
  // Semiconductors
  'AMD': { ticker: 'AMD', name: 'AMD' },
  'INTEL': { ticker: 'INTC', name: 'Intel' },
  'INTC': { ticker: 'INTC', name: 'Intel' },
  'QUALCOMM': { ticker: 'QCOM', name: 'Qualcomm' },
  'QCOM': { ticker: 'QCOM', name: 'Qualcomm' },
  'BROADCOM': { ticker: 'AVGO', name: 'Broadcom' },
  'AVGO': { ticker: 'AVGO', name: 'Broadcom' },
  'ASML': { ticker: 'ASML', name: 'ASML' },
  'MICRON': { ticker: 'MU', name: 'Micron' },
  'MU': { ticker: 'MU', name: 'Micron' },
  'ARM': { ticker: 'ARM', name: 'ARM Holdings' },
  'TEXAS INSTRUMENTS': { ticker: 'TXN', name: 'Texas Instruments' },
  'TXN': { ticker: 'TXN', name: 'Texas Instruments' },
  'APPLIED MATERIALS': { ticker: 'AMAT', name: 'Applied Materials' },
  'AMAT': { ticker: 'AMAT', name: 'Applied Materials' },
  'LAM RESEARCH': { ticker: 'LRCX', name: 'Lam Research' },
  'LRCX': { ticker: 'LRCX', name: 'Lam Research' },
  'KLA': { ticker: 'KLAC', name: 'KLA Corp' },
  'KLAC': { ticker: 'KLAC', name: 'KLA Corp' },
  'MARVELL': { ticker: 'MRVL', name: 'Marvell Technology' },
  'MRVL': { ticker: 'MRVL', name: 'Marvell Technology' },
  'NXP': { ticker: 'NXPI', name: 'NXP Semiconductors' },
  'NXPI': { ticker: 'NXPI', name: 'NXP Semiconductors' },
  'ON SEMICONDUCTOR': { ticker: 'ON', name: 'ON Semiconductor' },
  
  // Software & Cloud
  'SALESFORCE': { ticker: 'CRM', name: 'Salesforce' },
  'CRM': { ticker: 'CRM', name: 'Salesforce' },
  'ADOBE': { ticker: 'ADBE', name: 'Adobe' },
  'ADBE': { ticker: 'ADBE', name: 'Adobe' },
  'ORACLE': { ticker: 'ORCL', name: 'Oracle' },
  'ORCL': { ticker: 'ORCL', name: 'Oracle' },
  'CISCO': { ticker: 'CSCO', name: 'Cisco' },
  'CSCO': { ticker: 'CSCO', name: 'Cisco' },
  'IBM': { ticker: 'IBM', name: 'IBM' },
  'INTUIT': { ticker: 'INTU', name: 'Intuit' },
  'INTU': { ticker: 'INTU', name: 'Intuit' },
  'SERVICENOW': { ticker: 'NOW', name: 'ServiceNow' },
  'NOW': { ticker: 'NOW', name: 'ServiceNow' },
  'WORKDAY': { ticker: 'WDAY', name: 'Workday' },
  'WDAY': { ticker: 'WDAY', name: 'Workday' },
  'SNOWFLAKE': { ticker: 'SNOW', name: 'Snowflake' },
  'SNOW': { ticker: 'SNOW', name: 'Snowflake' },
  'DATADOG': { ticker: 'DDOG', name: 'Datadog' },
  'DDOG': { ticker: 'DDOG', name: 'Datadog' },
  'CROWDSTRIKE': { ticker: 'CRWD', name: 'CrowdStrike' },
  'CRWD': { ticker: 'CRWD', name: 'CrowdStrike' },
  'PALO ALTO': { ticker: 'PANW', name: 'Palo Alto Networks' },
  'PANW': { ticker: 'PANW', name: 'Palo Alto Networks' },
  'FORTINET': { ticker: 'FTNT', name: 'Fortinet' },
  'FTNT': { ticker: 'FTNT', name: 'Fortinet' },
  'ZSCALER': { ticker: 'ZS', name: 'Zscaler' },
  'ZS': { ticker: 'ZS', name: 'Zscaler' },
  'MONGODB': { ticker: 'MDB', name: 'MongoDB' },
  'MDB': { ticker: 'MDB', name: 'MongoDB' },
  'AUTODESK': { ticker: 'ADSK', name: 'Autodesk' },
  'ADSK': { ticker: 'ADSK', name: 'Autodesk' },
  'SYNOPSYS': { ticker: 'SNPS', name: 'Synopsys' },
  'SNPS': { ticker: 'SNPS', name: 'Synopsys' },
  'CADENCE': { ticker: 'CDNS', name: 'Cadence Design' },
  'CDNS': { ticker: 'CDNS', name: 'Cadence Design' },
  
  // E-Commerce & Internet
  'PAYPAL': { ticker: 'PYPL', name: 'PayPal' },
  'PYPL': { ticker: 'PYPL', name: 'PayPal' },
  'SHOPIFY': { ticker: 'SHOP', name: 'Shopify' },
  'SHOP': { ticker: 'SHOP', name: 'Shopify' },
  'AIRBNB': { ticker: 'ABNB', name: 'Airbnb' },
  'ABNB': { ticker: 'ABNB', name: 'Airbnb' },
  'UBER': { ticker: 'UBER', name: 'Uber' },
  'BOOKING': { ticker: 'BKNG', name: 'Booking Holdings' },
  'BKNG': { ticker: 'BKNG', name: 'Booking Holdings' },
  'MERCADOLIBRE': { ticker: 'MELI', name: 'MercadoLibre' },
  'MELI': { ticker: 'MELI', name: 'MercadoLibre' },
  'DOORDASH': { ticker: 'DASH', name: 'DoorDash' },
  'DASH': { ticker: 'DASH', name: 'DoorDash' },
  'TRADE DESK': { ticker: 'TTD', name: 'The Trade Desk' },
  'TTD': { ticker: 'TTD', name: 'The Trade Desk' },
  'APPLOVIN': { ticker: 'APP', name: 'AppLovin' },
  'APP': { ticker: 'APP', name: 'AppLovin' },
  
  // Finance
  'JPMORGAN': { ticker: 'JPM', name: 'JPMorgan Chase' },
  'JP MORGAN': { ticker: 'JPM', name: 'JPMorgan Chase' },
  'JPM': { ticker: 'JPM', name: 'JPMorgan Chase' },
  'BANK OF AMERICA': { ticker: 'BAC', name: 'Bank of America' },
  'BAC': { ticker: 'BAC', name: 'Bank of America' },
  'WELLS FARGO': { ticker: 'WFC', name: 'Wells Fargo' },
  'WFC': { ticker: 'WFC', name: 'Wells Fargo' },
  'GOLDMAN SACHS': { ticker: 'GS', name: 'Goldman Sachs' },
  'GS': { ticker: 'GS', name: 'Goldman Sachs' },
  'MORGAN STANLEY': { ticker: 'MS', name: 'Morgan Stanley' },
  'MS': { ticker: 'MS', name: 'Morgan Stanley' },
  'CITIGROUP': { ticker: 'C', name: 'Citigroup' },
  'BLACKROCK': { ticker: 'BLK', name: 'BlackRock' },
  'BLK': { ticker: 'BLK', name: 'BlackRock' },
  'CHARLES SCHWAB': { ticker: 'SCHW', name: 'Charles Schwab' },
  'SCHWAB': { ticker: 'SCHW', name: 'Charles Schwab' },
  'SCHW': { ticker: 'SCHW', name: 'Charles Schwab' },
  'VISA': { ticker: 'V', name: 'Visa' },
  'MASTERCARD': { ticker: 'MA', name: 'Mastercard' },
  'MA': { ticker: 'MA', name: 'Mastercard' },
  'AMERICAN EXPRESS': { ticker: 'AXP', name: 'American Express' },
  'AMEX': { ticker: 'AXP', name: 'American Express' },
  'AXP': { ticker: 'AXP', name: 'American Express' },
  'CAPITAL ONE': { ticker: 'COF', name: 'Capital One' },
  'COF': { ticker: 'COF', name: 'Capital One' },
  
  // Healthcare & Pharma
  'JOHNSON & JOHNSON': { ticker: 'JNJ', name: 'Johnson & Johnson' },
  'J&J': { ticker: 'JNJ', name: 'Johnson & Johnson' },
  'JNJ': { ticker: 'JNJ', name: 'Johnson & Johnson' },
  'UNITEDHEALTH': { ticker: 'UNH', name: 'UnitedHealth' },
  'UNH': { ticker: 'UNH', name: 'UnitedHealth' },
  'PFIZER': { ticker: 'PFE', name: 'Pfizer' },
  'PFE': { ticker: 'PFE', name: 'Pfizer' },
  'ELI LILLY': { ticker: 'LLY', name: 'Eli Lilly' },
  'LILLY': { ticker: 'LLY', name: 'Eli Lilly' },
  'LLY': { ticker: 'LLY', name: 'Eli Lilly' },
  'MERCK': { ticker: 'MRK', name: 'Merck' },
  'MRK': { ticker: 'MRK', name: 'Merck' },
  'ABBVIE': { ticker: 'ABBV', name: 'AbbVie' },
  'ABBV': { ticker: 'ABBV', name: 'AbbVie' },
  'THERMO FISHER': { ticker: 'TMO', name: 'Thermo Fisher' },
  'TMO': { ticker: 'TMO', name: 'Thermo Fisher' },
  'ABBOTT': { ticker: 'ABT', name: 'Abbott' },
  'ABT': { ticker: 'ABT', name: 'Abbott' },
  'DANAHER': { ticker: 'DHR', name: 'Danaher' },
  'DHR': { ticker: 'DHR', name: 'Danaher' },
  'BRISTOL MYERS': { ticker: 'BMY', name: 'Bristol-Myers Squibb' },
  'BMY': { ticker: 'BMY', name: 'Bristol-Myers Squibb' },
  'AMGEN': { ticker: 'AMGN', name: 'Amgen' },
  'AMGN': { ticker: 'AMGN', name: 'Amgen' },
  'GILEAD': { ticker: 'GILD', name: 'Gilead Sciences' },
  'GILD': { ticker: 'GILD', name: 'Gilead Sciences' },
  'MODERNA': { ticker: 'MRNA', name: 'Moderna' },
  'MRNA': { ticker: 'MRNA', name: 'Moderna' },
  'REGENERON': { ticker: 'REGN', name: 'Regeneron' },
  'REGN': { ticker: 'REGN', name: 'Regeneron' },
  'VERTEX': { ticker: 'VRTX', name: 'Vertex Pharmaceuticals' },
  'VRTX': { ticker: 'VRTX', name: 'Vertex Pharmaceuticals' },
  'BIOGEN': { ticker: 'BIIB', name: 'Biogen' },
  'BIIB': { ticker: 'BIIB', name: 'Biogen' },
  'INTUITIVE SURGICAL': { ticker: 'ISRG', name: 'Intuitive Surgical' },
  'ISRG': { ticker: 'ISRG', name: 'Intuitive Surgical' },
  'MEDTRONIC': { ticker: 'MDT', name: 'Medtronic' },
  'MDT': { ticker: 'MDT', name: 'Medtronic' },
  'CVS': { ticker: 'CVS', name: 'CVS Health' },
  
  // Consumer
  'WALMART': { ticker: 'WMT', name: 'Walmart' },
  'WMT': { ticker: 'WMT', name: 'Walmart' },
  'COSTCO': { ticker: 'COST', name: 'Costco' },
  'COST': { ticker: 'COST', name: 'Costco' },
  'HOME DEPOT': { ticker: 'HD', name: 'Home Depot' },
  'HD': { ticker: 'HD', name: 'Home Depot' },
  'LOWES': { ticker: 'LOW', name: 'Lowes' },
  'LOW': { ticker: 'LOW', name: 'Lowes' },
  'TARGET': { ticker: 'TGT', name: 'Target' },
  'TGT': { ticker: 'TGT', name: 'Target' },
  'MCDONALDS': { ticker: 'MCD', name: 'McDonalds' },
  'MCD': { ticker: 'MCD', name: 'McDonalds' },
  'STARBUCKS': { ticker: 'SBUX', name: 'Starbucks' },
  'SBUX': { ticker: 'SBUX', name: 'Starbucks' },
  'NIKE': { ticker: 'NKE', name: 'Nike' },
  'NKE': { ticker: 'NKE', name: 'Nike' },
  'COCA COLA': { ticker: 'KO', name: 'Coca-Cola' },
  'COCA-COLA': { ticker: 'KO', name: 'Coca-Cola' },
  'KO': { ticker: 'KO', name: 'Coca-Cola' },
  'PEPSI': { ticker: 'PEP', name: 'PepsiCo' },
  'PEPSICO': { ticker: 'PEP', name: 'PepsiCo' },
  'PEP': { ticker: 'PEP', name: 'PepsiCo' },
  'PROCTER GAMBLE': { ticker: 'PG', name: 'Procter & Gamble' },
  'P&G': { ticker: 'PG', name: 'Procter & Gamble' },
  'PG': { ticker: 'PG', name: 'Procter & Gamble' },
  'DISNEY': { ticker: 'DIS', name: 'Walt Disney' },
  'WALT DISNEY': { ticker: 'DIS', name: 'Walt Disney' },
  'DIS': { ticker: 'DIS', name: 'Walt Disney' },
  'LULULEMON': { ticker: 'LULU', name: 'Lululemon' },
  'LULU': { ticker: 'LULU', name: 'Lululemon' },
  'MONSTER BEVERAGE': { ticker: 'MNST', name: 'Monster Beverage' },
  'MONSTER': { ticker: 'MNST', name: 'Monster Beverage' },
  'MNST': { ticker: 'MNST', name: 'Monster Beverage' },
  
  // Industrial & Manufacturing
  'BOEING': { ticker: 'BA', name: 'Boeing' },
  'BA': { ticker: 'BA', name: 'Boeing' },
  'CATERPILLAR': { ticker: 'CAT', name: 'Caterpillar' },
  'CAT': { ticker: 'CAT', name: 'Caterpillar' },
  'GENERAL ELECTRIC': { ticker: 'GE', name: 'General Electric' },
  'GE': { ticker: 'GE', name: 'General Electric' },
  'HONEYWELL': { ticker: 'HON', name: 'Honeywell' },
  'HON': { ticker: 'HON', name: 'Honeywell' },
  'LOCKHEED MARTIN': { ticker: 'LMT', name: 'Lockheed Martin' },
  'LOCKHEED': { ticker: 'LMT', name: 'Lockheed Martin' },
  'LMT': { ticker: 'LMT', name: 'Lockheed Martin' },
  'RAYTHEON': { ticker: 'RTX', name: 'RTX' },
  'RTX': { ticker: 'RTX', name: 'RTX' },
  'GENERAL DYNAMICS': { ticker: 'GD', name: 'General Dynamics' },
  'GD': { ticker: 'GD', name: 'General Dynamics' },
  'DEERE': { ticker: 'DE', name: 'John Deere' },
  'JOHN DEERE': { ticker: 'DE', name: 'John Deere' },
  'DE': { ticker: 'DE', name: 'John Deere' },
  '3M': { ticker: 'MMM', name: '3M' },
  'MMM': { ticker: 'MMM', name: '3M' },
  'UNION PACIFIC': { ticker: 'UNP', name: 'Union Pacific' },
  'UNP': { ticker: 'UNP', name: 'Union Pacific' },
  'UPS': { ticker: 'UPS', name: 'UPS' },
  'FEDEX': { ticker: 'FDX', name: 'FedEx' },
  'FDX': { ticker: 'FDX', name: 'FedEx' },
  
  // Energy
  'EXXON': { ticker: 'XOM', name: 'Exxon Mobil' },
  'EXXON MOBIL': { ticker: 'XOM', name: 'Exxon Mobil' },
  'XOM': { ticker: 'XOM', name: 'Exxon Mobil' },
  'CHEVRON': { ticker: 'CVX', name: 'Chevron' },
  'CVX': { ticker: 'CVX', name: 'Chevron' },
  'CONOCOPHILLIPS': { ticker: 'COP', name: 'ConocoPhillips' },
  'COP': { ticker: 'COP', name: 'ConocoPhillips' },
  'SCHLUMBERGER': { ticker: 'SLB', name: 'Schlumberger' },
  'SLB': { ticker: 'SLB', name: 'Schlumberger' },
  'BAKER HUGHES': { ticker: 'BKR', name: 'Baker Hughes' },
  'BKR': { ticker: 'BKR', name: 'Baker Hughes' },
  'NEXTERA': { ticker: 'NEE', name: 'NextEra Energy' },
  'NEXTERA ENERGY': { ticker: 'NEE', name: 'NextEra Energy' },
  'NEE': { ticker: 'NEE', name: 'NextEra Energy' },
  
  // Telecom & Media
  'AT&T': { ticker: 'T', name: 'AT&T' },
  'ATT': { ticker: 'T', name: 'AT&T' },
  'VERIZON': { ticker: 'VZ', name: 'Verizon' },
  'VZ': { ticker: 'VZ', name: 'Verizon' },
  'T-MOBILE': { ticker: 'TMUS', name: 'T-Mobile' },
  'TMOBILE': { ticker: 'TMUS', name: 'T-Mobile' },
  'TMUS': { ticker: 'TMUS', name: 'T-Mobile' },
  'COMCAST': { ticker: 'CMCSA', name: 'Comcast' },
  'CMCSA': { ticker: 'CMCSA', name: 'Comcast' },
  'CHARTER': { ticker: 'CHTR', name: 'Charter Communications' },
  'CHTR': { ticker: 'CHTR', name: 'Charter Communications' },
  'WARNER BROS': { ticker: 'WBD', name: 'Warner Bros Discovery' },
  'WBD': { ticker: 'WBD', name: 'Warner Bros Discovery' },
  
  // Other Notable
  'BERKSHIRE': { ticker: 'BRK-B', name: 'Berkshire Hathaway' },
  'BERKSHIRE HATHAWAY': { ticker: 'BRK-B', name: 'Berkshire Hathaway' },
  'BRK': { ticker: 'BRK-B', name: 'Berkshire Hathaway' },
  'ACCENTURE': { ticker: 'ACN', name: 'Accenture' },
  'ACN': { ticker: 'ACN', name: 'Accenture' },
  'LINDE': { ticker: 'LIN', name: 'Linde' },
  'LIN': { ticker: 'LIN', name: 'Linde' },
  'AMERICAN TOWER': { ticker: 'AMT', name: 'American Tower' },
  'AMT': { ticker: 'AMT', name: 'American Tower' },
  'ADP': { ticker: 'ADP', name: 'ADP' },
  'AUTOMATIC DATA': { ticker: 'ADP', name: 'ADP' },
  'CINTAS': { ticker: 'CTAS', name: 'Cintas' },
  'CTAS': { ticker: 'CTAS', name: 'Cintas' },
  'COSTAR': { ticker: 'CSGP', name: 'CoStar Group' },
  'CSGP': { ticker: 'CSGP', name: 'CoStar Group' },
  'PAYCHEX': { ticker: 'PAYX', name: 'Paychex' },
  'PAYX': { ticker: 'PAYX', name: 'Paychex' },
  'VERISK': { ticker: 'VRSK', name: 'Verisk Analytics' },
  'VRSK': { ticker: 'VRSK', name: 'Verisk Analytics' },
  'ELECTRONIC ARTS': { ticker: 'EA', name: 'Electronic Arts' },
  'EA': { ticker: 'EA', name: 'Electronic Arts' },
  'TAKE TWO': { ticker: 'TTWO', name: 'Take-Two Interactive' },
  'TAKE-TWO': { ticker: 'TTWO', name: 'Take-Two Interactive' },
  'TTWO': { ticker: 'TTWO', name: 'Take-Two Interactive' },
  'ATLASSIAN': { ticker: 'TEAM', name: 'Atlassian' },
  'TEAM': { ticker: 'TEAM', name: 'Atlassian' },
  'MARRIOTT': { ticker: 'MAR', name: 'Marriott' },
  'MAR': { ticker: 'MAR', name: 'Marriott' },
  'GENERAL MOTORS': { ticker: 'GM', name: 'General Motors' },
  'GM': { ticker: 'GM', name: 'General Motors' },
  'FORD': { ticker: 'F', name: 'Ford' },
  'SUPER MICRO': { ticker: 'SMCI', name: 'Super Micro Computer' },
  'SUPERMICRO': { ticker: 'SMCI', name: 'Super Micro Computer' },
  'SMCI': { ticker: 'SMCI', name: 'Super Micro Computer' },
  'CONSTELLATION': { ticker: 'CEG', name: 'Constellation Energy' },
  'CEG': { ticker: 'CEG', name: 'Constellation Energy' },
  'DIAMONDBACK': { ticker: 'FANG', name: 'Diamondback Energy' },
  'FANG': { ticker: 'FANG', name: 'Diamondback Energy' },
  'GLOBALFOUNDRIES': { ticker: 'GFS', name: 'GlobalFoundries' },
  'GFS': { ticker: 'GFS', name: 'GlobalFoundries' },
  'KRAFT HEINZ': { ticker: 'KHC', name: 'Kraft Heinz' },
  'KHC': { ticker: 'KHC', name: 'Kraft Heinz' },
  'DOLLAR TREE': { ticker: 'DLTR', name: 'Dollar Tree' },
  'DLTR': { ticker: 'DLTR', name: 'Dollar Tree' },
  'ROSS STORES': { ticker: 'ROST', name: 'Ross Stores' },
  'ROSS': { ticker: 'ROST', name: 'Ross Stores' },
  'ROST': { ticker: 'ROST', name: 'Ross Stores' },
  'OREILLY': { ticker: 'ORLY', name: 'OReilly Automotive' },
  'ORLY': { ticker: 'ORLY', name: 'OReilly Automotive' },
  'OLD DOMINION': { ticker: 'ODFL', name: 'Old Dominion Freight' },
  'ODFL': { ticker: 'ODFL', name: 'Old Dominion Freight' },
  'PACCAR': { ticker: 'PCAR', name: 'PACCAR' },
  'PCAR': { ticker: 'PCAR', name: 'PACCAR' },
  'COPART': { ticker: 'CPRT', name: 'Copart' },
  'CPRT': { ticker: 'CPRT', name: 'Copart' },
  'FASTENAL': { ticker: 'FAST', name: 'Fastenal' },
  'FAST': { ticker: 'FAST', name: 'Fastenal' },
  'IDEXX': { ticker: 'IDXX', name: 'IDEXX Laboratories' },
  'IDXX': { ticker: 'IDXX', name: 'IDEXX Laboratories' },
  'ILLUMINA': { ticker: 'ILMN', name: 'Illumina' },
  'ILMN': { ticker: 'ILMN', name: 'Illumina' },
  'DEXCOM': { ticker: 'DXCM', name: 'DexCom' },
  'DXCM': { ticker: 'DXCM', name: 'DexCom' },
  'GE HEALTHCARE': { ticker: 'GEHC', name: 'GE HealthCare' },
  'GEHC': { ticker: 'GEHC', name: 'GE HealthCare' },
  'PDD': { ticker: 'PDD', name: 'PDD Holdings' },
  'PINDUODUO': { ticker: 'PDD', name: 'PDD Holdings' },
  'ASTRAZENECA': { ticker: 'AZN', name: 'AstraZeneca' },
  'AZN': { ticker: 'AZN', name: 'AstraZeneca' },
  'KEURIG': { ticker: 'KDP', name: 'Keurig Dr Pepper' },
  'KDP': { ticker: 'KDP', name: 'Keurig Dr Pepper' },
  'COGNIZANT': { ticker: 'CTSH', name: 'Cognizant' },
  'CTSH': { ticker: 'CTSH', name: 'Cognizant' },
  'CDW': { ticker: 'CDW', name: 'CDW' },
  'CSX': { ticker: 'CSX', name: 'CSX' },
  'ANALOG DEVICES': { ticker: 'ADI', name: 'Analog Devices' },
  'ADI': { ticker: 'ADI', name: 'Analog Devices' },
  'MICROCHIP': { ticker: 'MCHP', name: 'Microchip Technology' },
  'MCHP': { ticker: 'MCHP', name: 'Microchip Technology' },
  'ANSYS': { ticker: 'ANSS', name: 'ANSYS' },
  'ANSS': { ticker: 'ANSS', name: 'ANSYS' },
  'COCA COLA EURO': { ticker: 'CCEP', name: 'Coca-Cola Europacific' },
  'CCEP': { ticker: 'CCEP', name: 'Coca-Cola Europacific' },
  'XCEL': { ticker: 'XEL', name: 'Xcel Energy' },
  'XEL': { ticker: 'XEL', name: 'Xcel Energy' },
};

// 📊 Ekstraher kursmål fra tekst
function extractPriceTargets(text: string): Map<string, { current?: number; target?: number; analyst?: string }> {
  const targets = new Map<string, { current?: number; target?: number; analyst?: string }>();
  
  // Finn mønstre som "kursmål på XX kroner" eller "kursmål: XX kr"
  const patterns = [
    /(\w+)s?\s+aksjekurs\s+ligger\s+på\s+rundt\s+([\d,\.]+)\s+kroner.*?kursmål\s+på\s+([\d,\.]+)/gi,
    /(\w+).*?kursmål\s+(?:på\s+)?([\d,\.]+)\s*(?:kr|kroner)/gi,
    /kursmål\s+(?:på\s+)?([\d,\.]+)\s*(?:kr|kroner).*?(\w+)/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const stock = match[1]?.toUpperCase();
      const price1 = parseFloat(match[2]?.replace(',', '.'));
      const price2 = match[3] ? parseFloat(match[3].replace(',', '.')) : undefined;
      
      if (stock && TICKER_MAP[stock]) {
        targets.set(stock, {
          current: price2 ? price1 : undefined,
          target: price2 || price1,
        });
      }
    }
  }
  
  return targets;
}

export default function QuickArticleCapture({ isOpen, onClose, onSaved }: QuickArticleCaptureProps) {
  const [pastedText, setPastedText] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('E24');
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [detectedStocks, setDetectedStocks] = useState<DetectedStock[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [originalLength, setOriginalLength] = useState(0);
  const [cleanedLength, setCleanedLength] = useState(0);
  
  const detectStocksInText = (text: string): DetectedStock[] => {
    // 🚫 Ord som IKKE skal matche som aksjer (vanlige norske ord)
    const SKIP_WORDS = new Set([
      'bryter', 'bryte', 'stiger', 'faller', 'handles', 'vurderer', 'mener',
      'analytiker', 'analytikere', 'investor', 'investorer', 'markedet',
      'prisen', 'kurs', 'kursen', 'aksjekurs', 'oljeprisen', 'dollar',
      'aksjen', 'aksje', 'selskapet', 'selskap', 'chart', 'nordnet',
      'disclaimer', 'abonnent', 'kundeservice', 'nyhetsbrev', 'copyright',
    ]);
    
    // 📊 Tracking for smart analyse
    interface StockAnalysis {
      ticker: string;
      name: string;
      mentions: number;           // Antall ganger nevnt
      isMainSubject: boolean;     // Er dette hovedtemaet?
      isPastReference: boolean;   // Nevnt som "forrige uke" etc?
      hasTargetPrice: boolean;    // Har kursmål?
      sentiment: 'positive' | 'negative' | 'neutral';
      highlight: string;
      isExternal: boolean;
      relevanceScore: number;     // Total relevans-score
    }
    
    const stockAnalysis: Map<string, StockAnalysis> = new Map();
    
    // Ekstraher kursmål
    const priceTargets = extractPriceTargets(text);
    
    // Fjern URL-paths og teknisk støy før matching
    const cleanedForMatching = text
      .replace(/\/[a-z\-]+\/[a-z0-9\-\/]+/gi, '')
      .replace(/https?:\/\/[^\s]+/gi, '');
    
    const textUpper = cleanedForMatching.toUpperCase();
    
    // 🔍 FASE 1: Finn alle aksjer og tell nevnelser
    // 🔄 Først: Finn alle aksjer og deres nevnelser
    const allMatches: Array<{keyword: string; stock: {ticker: string; name: string}; count: number}> = [];
    
    for (const [keyword, stock] of Object.entries(TICKER_MAP)) {
      if (stock.name.includes('Analytiker')) continue;
      if (SKIP_WORDS.has(keyword.toLowerCase())) continue;
      
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = keyword.length <= 4 
        ? new RegExp(`\\b${escapedKeyword}\\b(?!\\w)`, 'gi')
        : new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
      
      const matches = cleanedForMatching.match(regex);
      if (matches) {
        allMatches.push({ keyword, stock, count: matches.length });
      }
    }
    
    // 🧹 Fjern "foreldre-selskap" når "datter-selskap" er nevnt
    // F.eks. fjern "AKER" når "AKER BP" finnes (AKER BP er mer spesifikk)
    const tickersToSkip = new Set<string>();
    const parentChildPairs = [
      { parent: 'AKER.OL', child: 'AKRBP.OL' },  // Aker → Aker BP
      { parent: 'AKER.OL', child: 'AKSO.OL' },   // Aker → Aker Solutions
    ];
    
    for (const pair of parentChildPairs) {
      const hasChild = allMatches.some(m => m.stock.ticker === pair.child);
      if (hasChild) {
        tickersToSkip.add(pair.parent);
      }
    }
    
    // 🔍 Nå analyser hver aksje
    for (const { keyword, stock, count: mentionCount } of allMatches) {
      // Skip foreldre-selskaper når datter-selskap finnes
      if (tickersToSkip.has(stock.ticker)) continue;
      
      // Sjekk kontekst for HVER forekomst
      let isMainSubject = false;
      let isPastReference = false;
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      // Finn alle posisjoner og analyser kontekst
      let searchStart = 0;
      for (let i = 0; i < mentionCount; i++) {
        const matchIndex = cleanedForMatching.toLowerCase().indexOf(keyword.toLowerCase(), searchStart);
        if (matchIndex === -1) break;
        searchStart = matchIndex + keyword.length;
        
        const contextBefore = cleanedForMatching.slice(Math.max(0, matchIndex - 150), matchIndex).toUpperCase();
        const contextAfter = cleanedForMatching.slice(matchIndex, matchIndex + keyword.length + 150).toUpperCase();
        const fullContext = contextBefore + contextAfter;
        
        // 🎯 Sjekk om dette er HOVEDFOKUS
        if (contextBefore.includes('UKENS AKSJE') || 
            contextBefore.includes('SATSER PÅ') ||
            contextBefore.includes('DENNE AKSJEN') ||
            contextBefore.includes('DA VIL') ||
            contextBefore.includes('NESTE UKE SATSER') ||
            contextAfter.includes('ER MÅLET') ||
            contextAfter.includes('STÅ I') ||
            contextAfter.includes('FREMSTÅR SOM') ||
            fullContext.includes('VIL STÅ I') ||
            fullContext.includes('KAN BLI EN VINNER') ||
            fullContext.includes('RENDYRKET') ||
            fullContext.includes('DET MEST INTERESSANTE')) {
          isMainSubject = true;
        }
        
        // ⏮️ Sjekk om DENNE SPESIFIKKE nevnelsen er gammel referanse
        const isThisMentionOld = (
          contextBefore.includes('SIST UKE') || 
          contextBefore.includes('FORRIGE UKE') ||
          contextBefore.includes('TIDLIGERE') ||
          contextBefore.includes('I FJOR')
        );
        
        // 🔄 Sjekk om DENNE SPESIFIKKE nevnelsen er sammenligning
        const isThisMentionComparison = (
          contextBefore.includes('MENS ') || 
          contextBefore.includes('I MOTSETNING TIL')
        );
        
        // Kun sett isPastReference hvis dette er eneste/hovedkontekst
        if (isThisMentionOld || isThisMentionComparison) {
          // Bare marker som gammel hvis det ikke også er hovedfokus
          if (!isMainSubject) {
            isPastReference = true;
          }
        }
        
        // 📈 Sentiment fra kontekst
        if (fullContext.includes('KJØP') || fullContext.includes('OPPSIDE') || 
            fullContext.includes('KURSMÅL') || fullContext.includes('VINNER') ||
            fullContext.includes('ANBEFAL') || fullContext.includes('SATSER')) {
          sentiment = 'positive';
        } else if (fullContext.includes('SELG') || fullContext.includes('ADVARER') ||
                   fullContext.includes('NEGATIV') || fullContext.includes('NEDGANG')) {
          sentiment = 'negative';
        }
      }
      
      // Kursmål info
      const priceInfo = priceTargets.get(keyword.toUpperCase()) || priceTargets.get(stock.name.toUpperCase());
      let highlight = '';
      if (priceInfo?.target) {
        highlight = `Kursmål: ${priceInfo.target} kr`;
        if (priceInfo.current) {
          const upside = ((priceInfo.target - priceInfo.current) / priceInfo.current * 100).toFixed(1);
          highlight += ` (${upside}% oppside)`;
        }
      }
      
      // 📊 Beregn relevans-score
      let relevanceScore = mentionCount * 10; // Base: 10 poeng per nevnelse
      if (isMainSubject) relevanceScore += 100;  // Hovedfokus: +100
      if (priceInfo?.target) relevanceScore += 30; // Har kursmål: +30
      if (isPastReference) relevanceScore -= 50;   // Gammel referanse: -50
      if (sentiment === 'positive') relevanceScore += 20;
      
      stockAnalysis.set(stock.ticker, {
        ticker: stock.ticker,
        name: stock.name,
        mentions: mentionCount,
        isMainSubject,
        isPastReference,
        hasTargetPrice: !!priceInfo?.target,
        sentiment,
        highlight,
        isExternal: false,
        relevanceScore,
      });
    }
    
    // 🌍 FASE 2: Finn ukjente/utenlandske aksjer som nevnes
    const externalPatterns = [
      /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})\s+(?:leverer|tilbyr|driver med)/g,
      /trekker\s+(?:også\s+)?frem\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})/gi,
    ];
    
    const foundExternalNames = new Set<string>();
    const commonWords = new Set([
      'saudi', 'arabia', 'norge', 'norsk', 'les', 'foto', 'den', 'det', 'han', 'hun', 
      'flere', 'andre', 'samme', 'både', 'new york', 'stock exchange', 'securities',
      'to selskaper', 'tre selskaper', 'et selskap', 'første', 'andre', 'tredje',
      'lavere', 'høyere', 'større', 'mindre', 'mange', 'noen', 'alle',
      'bryter', 'stiger', 'faller', 'handles', 'vurderer', 'mener',
      'analytiker', 'investor', 'markedet', 'prisen', 'kurs', 'dollar',
      'internt', 'eksternt', 'presset', 'situasjonen', 'washington', 'teheran',
      'hormuz', 'midtøsten', 'venezuela', 'iran', 'israel', 'usa',
    ]);
    
    // Sjekk at eksterne selskaper ikke allerede er funnet
    const existingNames = new Set(Array.from(stockAnalysis.values()).map(s => s.name.toLowerCase()));
    
    for (const pattern of externalPatterns) {
      let match;
      while ((match = pattern.exec(cleanedForMatching)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 4 && name.length < 35) {
          const nameLower = name.toLowerCase();
          if (SKIP_WORDS.has(nameLower)) continue;
          if (commonWords.has(nameLower)) continue;
          if (existingNames.has(nameLower)) continue;
          if (foundExternalNames.has(nameLower)) continue;
          
          foundExternalNames.add(nameLower);
          
          // Ekstraher kursmål hvis tilgjengelig
          let highlight = '';
          const priceMatch = cleanedForMatching.match(new RegExp(`${name}.*?kursmål.*?(\\d+[,.]?\\d*)\\s*(?:kr|pund|dollar|euro)`, 'i'));
          if (priceMatch) {
            const currency = cleanedForMatching.match(/pund/i) ? 'GBP' : 
                            cleanedForMatching.match(/dollar/i) ? 'USD' : 'kr';
            highlight = `Kursmål: ${priceMatch[1]} ${currency}`;
          }
          
          stockAnalysis.set(`EXT-${name}`, {
            ticker: 'EXTERNAL',
            name: name,
            mentions: 1,
            isMainSubject: false,
            isPastReference: false,
            hasTargetPrice: !!priceMatch,
            sentiment: 'neutral',
            highlight,
            isExternal: true,
            relevanceScore: priceMatch ? 25 : 5, // Eksterne får lav score
          });
        }
      }
    }
    
    // 📋 FASE 3: Konverter til resultat-array, filtrer og sorter
    const results: DetectedStock[] = Array.from(stockAnalysis.values())
      // 🧹 SMART FILTRERING:
      .filter(s => {
        // Behold alltid hovedfokus
        if (s.isMainSubject) return true;
        // Behold aksjer med kursmål
        if (s.hasTargetPrice) return true;
        // Behold aksjer nevnt 3+ ganger (sannsynligvis viktig)
        if (s.mentions >= 3) return true;
        // Fjern aksjer som KUN er sammenligninger eller gamle referanser
        if (s.isPastReference) return false;
        // Fjern aksjer med veldig lav relevans
        if (s.relevanceScore < 20) return false;
        return true;
      })
      // Sorter etter relevans (hovedfokus først)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      // Konverter til DetectedStock format med tydelig markering
      .map(s => ({
        ticker: s.ticker,
        name: s.name,
        sentiment: s.sentiment,
        highlight: s.isMainSubject 
          ? `⭐ HOVEDFOKUS ${s.highlight ? '• ' + s.highlight : ''}`.trim()
          : s.highlight || (s.mentions >= 3 ? `Nevnt ${s.mentions}x` : ''),
        isExternal: s.isExternal,
      }));
    
    return results;
  };
  
  const handlePaste = async () => {
    try {
      const rawText = await navigator.clipboard.readText();
      
      setIsProcessing(true);
      
      // 🔗 Auto-detect URL fra teksten (ofte i starten av kopiert artikkel)
      let detectedUrl = '';
      let detectedSource = '';
      
      // 1. Sjekk for full URL først (med eller uten https://)
      const fullUrlMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?(e24\.no|dn\.no|finansavisen\.no|newsweb\.oslobors\.no|investtech\.com|investornytt\.no)[^\s\n]*/i);
      if (fullUrlMatch) {
        // Legg til https:// hvis det mangler
        detectedUrl = fullUrlMatch[0].startsWith('http') ? fullUrlMatch[0] : `https://${fullUrlMatch[0]}`;
        detectedSource = fullUrlMatch[1]?.toLowerCase() || '';
      }
      
      // 2. E24: Ofte bare path i starten, f.eks "/boers-og-finans/i/16BWgM/..."
      if (!detectedUrl) {
        const e24PathMatch = rawText.match(/^\s*(\/boers-og-finans\/[^\s\n]+)/m);
        if (e24PathMatch) {
          detectedUrl = `https://e24.no${e24PathMatch[1]}`;
          detectedSource = 'e24.no';
        }
      }
      
      // 3. Investornytt: Path som "/bors/..." - sjekk FØR DN siden begge bruker /bors/
      if (!detectedUrl) {
        const pathMatch = rawText.match(/^\s*(\/(?:bors|nyheter|aksjer)\/[^\s\n]+)/m);
        if (pathMatch && rawText.toLowerCase().includes('investornytt')) {
          detectedUrl = `https://www.investornytt.no${pathMatch[1]}`;
          detectedSource = 'investornytt.no';
        }
      }
      
      // 4. DN: Ofte path som "/bors/..." eller "/marked/..."
      if (!detectedUrl) {
        const dnPathMatch = rawText.match(/^\s*(\/(?:bors|marked|nyheter)\/[^\s\n]+)/m);
        if (dnPathMatch && !rawText.toLowerCase().includes('investornytt') && !rawText.toLowerCase().includes('finansavisen')) {
          detectedUrl = `https://www.dn.no${dnPathMatch[1]}`;
          detectedSource = 'dn.no';
        }
      }
      
      // 5. Finansavisen: Path som "/bors/..." eller "/nyheter/..."
      if (!detectedUrl) {
        const faPathMatch = rawText.match(/^\s*(\/(?:bors|nyheter|finans)\/[^\s\n]+)/m);
        if (faPathMatch && rawText.toLowerCase().includes('finansavisen')) {
          detectedUrl = `https://finansavisen.no${faPathMatch[1]}`;
          detectedSource = 'finansavisen.no';
        }
      }
      
      // Sett URL og kilde
      if (detectedUrl) {
        setUrl(detectedUrl);
        
        if (detectedSource.includes('e24')) setSource('E24');
        else if (detectedSource.includes('investornytt')) setSource('Investornytt');
        else if (detectedSource.includes('dn.no')) setSource('DN');
        else if (detectedSource.includes('finansavisen')) setSource('Finansavisen');
        else if (detectedSource.includes('newsweb')) setSource('Newsweb');
        else if (detectedSource.includes('investtech')) setSource('Investtech');
      }
      
      // 🧹 Rens teksten automatisk
      const cleanedText = cleanArticleText(rawText);
      setPastedText(cleanedText);
      setOriginalLength(rawText.length);
      setCleanedLength(cleanedText.length);
      
      // Auto-detect stocks fra renset tekst
      const stocks = detectStocksInText(cleanedText);
      setDetectedStocks(stocks);
      
      // Try to extract title (første linje som ser ut som en overskrift)
      const lines = cleanedText.split('\n').filter(l => l.trim());
      const titleCandidate = lines.find(l => l.length > 20 && l.length < 150 && /^[A-ZÆØÅ]/.test(l));
      if (titleCandidate) {
        setTitle(titleCandidate);
      }
      
      // Generate summary from first 2-3 sentences
      const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 30).slice(0, 3);
      setSummary(sentences.join('. ').trim() + (sentences.length > 0 ? '.' : ''));
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setIsProcessing(false);
    }
  };
  
  const handleSave = () => {
    if (!title || !summary) return;
    
    // Konverter DetectedStock til StockMention format
    const mentions: StockMention[] = detectedStocks.map(stock => ({
      ticker: stock.isExternal ? stock.name : stock.ticker.replace('.OL', ''),
      stockName: stock.name,
      mentionType: 'tip' as const,
      sentiment: stock.sentiment,
      highlight: stock.highlight || summary.slice(0, 200),
      isTopPick: !stock.isExternal, // Marker interne som "top pick" for visning
    }));
    
    // Valider source type
    const validSources: ArticleSource[] = ['Investtech', 'Investornytt', 'E24', 'DN', 'Finansavisen', 'Newsweb', 'Nordnet', 'Annet'];
    const articleSource: ArticleSource = validSources.includes(source as ArticleSource) 
      ? (source as ArticleSource) 
      : 'Annet';
    
    try {
      saveArticleTip({
        title,
        source: articleSource,
        url: url || undefined,
        publishedDate: new Date().toISOString().split('T')[0],
        summary,
        fullText: pastedText, // Lagre full tekst for referanse
        mentions,
        tags: ['import', articleSource.toLowerCase()],
      });
      
      setIsSaved(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
        // Reset state
        setPastedText('');
        setTitle('');
        setUrl('');
        setSummary('');
        setDetectedStocks([]);
        setOriginalLength(0);
        setCleanedLength(0);
        setIsSaved(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to save article:', error);
      alert('Kunne ikke lagre artikkelen. Prøv igjen.');
    }
  };
  
  const toggleStockSentiment = (ticker: string) => {
    setDetectedStocks(prev => prev.map(s => {
      if (s.ticker === ticker) {
        const sentiments: ('positive' | 'negative' | 'neutral')[] = ['positive', 'negative', 'neutral'];
        const currentIndex = sentiments.indexOf(s.sentiment);
        return { ...s, sentiment: sentiments[(currentIndex + 1) % 3] };
      }
      return s;
    }));
  };
  
  const removeStock = (tickerOrName: string) => {
    setDetectedStocks(prev => prev.filter(s => 
      s.ticker !== tickerOrName && s.name !== tickerOrName
    ));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Rask Artikkel-Import
              </h2>
              <p className="text-sm text-gray-500 dark:text-dark-muted">
                Lim inn artikkel → Auto-detekter aksjer
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Paste Button */}
          {!pastedText && (
            <button
              onClick={handlePaste}
              className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl 
                         hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 
                         transition-colors group"
            >
              <Clipboard className="h-12 w-12 text-gray-400 group-hover:text-purple-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                Klikk for å lime inn artikkel fra utklippstavlen
              </p>
              <p className="text-sm text-gray-400 dark:text-dark-muted mt-1">
                Kopier artikkelen fra E24, DN, Finansavisen etc.
              </p>
            </button>
          )}
          
          {isProcessing && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300">Analyserer tekst...</p>
            </div>
          )}
          
          {pastedText && !isProcessing && (
            <>
              {/* Source & URL */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    Kilde
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  >
                    <option value="E24">E24</option>
                    <option value="DN">Dagens Næringsliv</option>
                    <option value="Finansavisen">Finansavisen</option>
                    <option value="Investornytt">Investornytt</option>
                    <option value="Investtech">Investtech</option>
                    <option value="Annet">Annet</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                    URL (valgfritt)
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Title */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Tittel
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Artikkelens tittel..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-dark-bg text-gray-900 dark:text-white"
                />
              </div>
              
              {/* Summary */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Sammendrag / Nøkkelpunkter
                </label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Hva er det viktigste fra artikkelen?"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-dark-bg text-gray-900 dark:text-white resize-none"
                />
              </div>
              
              {/* Detected Stocks */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Detekterte aksjer ({detectedStocks.length})
                </label>
                
                {detectedStocks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-dark-muted italic">
                    Ingen aksjer funnet i teksten
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detectedStocks.map(stock => (
                      <div 
                        key={stock.ticker + stock.name}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm ${
                          stock.isExternal 
                            ? 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                            : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <span className="font-medium">{stock.name}</span>
                        {!stock.isExternal && (
                          <span className="text-xs opacity-60">{stock.ticker.replace('.OL', '')}</span>
                        )}
                        {stock.highlight && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            🎯
                          </span>
                        )}
                        <button
                          onClick={() => toggleStockSentiment(stock.isExternal ? stock.name : stock.ticker)}
                          className="text-xs opacity-70 hover:opacity-100"
                          title={`Sentiment: ${stock.sentiment}`}
                        >
                          {stock.sentiment === 'positive' ? '📈' : 
                           stock.sentiment === 'negative' ? '📉' : '➖'}
                        </button>
                        <button
                          onClick={() => removeStock(stock.isExternal ? stock.name : stock.ticker)}
                          className="text-gray-400 hover:text-red-500 ml-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Cleaning Stats */}
              {originalLength > 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Wand2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      🧹 Tekst renset automatisk
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {originalLength.toLocaleString()} → {cleanedLength.toLocaleString()} tegn 
                      ({Math.round((1 - cleanedLength / originalLength) * 100)}% fjernet: reklame, bilder, navigasjon)
                    </p>
                  </div>
                </div>
              )}
              
              {/* Cleaned Text Preview */}
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-500 dark:text-dark-muted hover:text-gray-700 dark:hover:text-gray-300">
                  Vis renset tekst ({cleanedLength.toLocaleString()} tegn)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-bg rounded-lg max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {pastedText.slice(0, 3000)}
                    {pastedText.length > 3000 && '...'}
                  </pre>
                </div>
              </details>
            </>
          )}
        </div>
        
        {/* Footer */}
        {pastedText && !isProcessing && (
          <div className="p-4 border-t border-gray-200 dark:border-dark-border flex justify-end gap-3">
            <button
              onClick={() => {
                setPastedText('');
                setTitle('');
                setSummary('');
                setDetectedStocks([]);
                setOriginalLength(0);
                setCleanedLength(0);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Start på nytt
            </button>
            <button
              onClick={handleSave}
              disabled={!title || !summary || isSaved}
              className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors
                ${isSaved 
                  ? 'bg-green-500 text-white' 
                  : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}
            >
              {isSaved ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Lagret!
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Lagre tips
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
