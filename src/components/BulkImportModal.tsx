'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { createTrade, getPortfolios, getActiveTrades, updateTrade, createDividendBulk, type Portfolio, type TradeInput, type Trade, type DividendInput } from '@/lib/store';
import { StrategyId, STRATEGIES } from '@/lib/strategies';
import { clsx } from 'clsx';

// Mapping av vanlige norske aksjenavn til tickers
const TICKER_MAP: Record<string, string> = {
  'norsk hydro': 'NHY.OL',
  'equinor': 'EQNR.OL',
  'dnb': 'DNB.OL',
  'telenor': 'TEL.OL',
  'yara': 'YAR.OL',
  'mowi': 'MOWI.OL',
  'orkla': 'ORK.OL',
  'aker bp': 'AKRBP.OL',
  'kongsberg gruppen': 'KOG.OL',
  'gjensidige': 'GJF.OL',
  'storebrand': 'STB.OL',
  'frontline': 'FRO.OL',
  'nel': 'NEL.OL',
  'tomra': 'TOM.OL',
  'salmar': 'SALM.OL',
  'lerøy seafood': 'LSG.OL',
  'bakkafrost': 'BAKKA.OL',
  'vår energi': 'VAR.OL',
  'autostore': 'AUTO.OL',
  'schibsted': 'SCHA.OL',
  'kahoot': 'KAHOT.OL',
  'rec silicon': 'RECSI.OL',
  'nordic semiconductor': 'NOD.OL',
  'borregaard': 'BRG.OL',
  'wallenius wilhelmsen': 'WAWI.OL',
  'aker solutions': 'AKSO.OL',
  'subsea 7': 'SUBC.OL',
  'pgs': 'PGS.OL',
  'dof': 'DOF.OL',
  'okea': 'OKEA.OL',
  'sats': 'SATS.OL',
  'protector forsikring': 'PROT.OL',
  'kid': 'KID.OL',
  'kitron': 'KIT.OL',
  'novo nordisk': 'NOVO-B.CO',
  'novo nordisk b': 'NOVO-B.CO',
  // Shipping og andre
  'mpc container ships': 'MPCC.OL',
  'höegh autoliners': 'HAUTO.OL',
  'høegh autoliners': 'HAUTO.OL',
  'hoegh autoliners': 'HAUTO.OL',
  'tgs': 'TGS.OL',
  'tgs-nopec': 'TGS.OL',
  // Flere vanlige aksjer
  'aker': 'AKER.OL',
  'aker carbon capture': 'ACC.OL',
  'hafnia': 'HAFNI.OL',
  'golden ocean': 'GOGL.OL',
  'flex lng': 'FLNG.OL',
  'crayon': 'CRAYN.OL',
  'adevinta': 'ADE.OL',
  'elkem': 'ELK.OL',
  'europris': 'EPR.OL',
  'xxl': 'XXL.OL',
  'grieg seafood': 'GSF.OL',
  'photocure': 'PHO.OL',
  'strongpoint': 'STRO.OL',
  'norwegian air shuttle': 'NAS.OL',
  'norwegian': 'NAS.OL',
};

interface ParsedTrade {
  id: string;
  date: string;
  name: string;
  ticker: string;
  quantity: number;
  price: number;
  fee: number;
  total: number;
  type: 'BUY' | 'SELL';
  selected: boolean;
  portfolioId: string;
  strategyId: StrategyId | '';
  error?: string;
}

interface ParsedDividend {
  id: string;
  date: string;
  name: string;
  ticker: string;
  quantity: number;
  dividendPerShare: number;
  totalAmount: number;
  selected: boolean;
}

type ImportMode = 'trades' | 'dividends';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BulkImportModal({ isOpen, onClose, onSuccess }: BulkImportModalProps) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [parsedDividends, setParsedDividends] = useState<ParsedDividend[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<StrategyId | ''>('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; failedTrades: ParsedTrade[] } | null>(null);
  const [dividendResult, setDividendResult] = useState<{ success: number; failed: number } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('trades');

  useEffect(() => {
    if (isOpen) {
      const loadedPortfolios = getPortfolios();
      setPortfolios(loadedPortfolios);
      if (loadedPortfolios.length > 0) {
        setSelectedPortfolioId(loadedPortfolios[0].id);
      }
      setPasteText('');
      setParsedTrades([]);
      setParsedDividends([]);
      setImportResult(null);
      setDividendResult(null);
    }
  }, [isOpen]);

  // Parse Nordnet bulk format
  const parseNordnetBulk = (text: string): ParsedTrade[] => {
    const trades: ParsedTrade[] = [];
    
    // Fjern PDF-tekst og split på transaksjoner
    const cleanedText = text
      .replace(/Klikk på ikonet for å laste ned pdf/gi, '')
      .trim();
    
    // Split på dato-mønster (dd.mm.yyyy på starten av en linje)
    const transactionBlocks = cleanedText.split(/(?=\d{1,2}\.\d{1,2}\.\d{4})/);
    
    for (const block of transactionBlocks) {
      if (!block.trim()) continue;
      
      const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
      
      if (lines.length < 5) continue;
      
      try {
        // Forventet format:
        // 0: Dato (12.1.2026)
        // 1: Konto (Aksjesparekonto · 55702096)
        // 2: Type (Kjøpt / Solgt)
        // 3: Navn (Norsk Hydro)
        // 4: Antall (120 eller 1 600)
        // 5: Pris (81,88 NOK)
        // 6: Kurtasje (29 NOK)
        // 7: Total (−9 854,60 NOK)
        
        // Hent første linje og fjern eventuelle usynlige tegn
        const dateLineRaw = lines[0].trim();
        const dateMatch = dateLineRaw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        
        if (!dateMatch) continue;
        
        // Konverter dato til ISO format
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3];
        const dateStr = `${year}-${month}-${day}`;
        
        console.log('📅 Parsed date:', { raw: dateLineRaw, match: dateMatch, result: dateStr });
        
        // Sjekk transaksjonstype (Kjøpt/Kjøp eller Solgt/Salg)
        const transactionType = lines[2]?.toLowerCase() || '';
        const isBuy = transactionType.includes('kjøpt') || transactionType.includes('kjøp');
        const isSell = transactionType.includes('solgt') || transactionType.includes('salg');
        
        if (!isBuy && !isSell) continue;
        
        const stockName = lines[3];
        
        // Parse antall (kan ha mellomrom som tusenskille)
        const quantityStr = lines[4].replace(/\s/g, '').replace(/\./g, '');
        const quantity = parseInt(quantityStr);
        
        // Parse pris
        const priceMatch = lines[5]?.match(/([\d\s,.]+)\s*(NOK|DKK|SEK|USD|EUR)?/i);
        const price = priceMatch 
          ? parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'))
          : 0;
        
        // Parse kurtasje
        const feeMatch = lines[6]?.match(/([\d\s,.]+)\s*(NOK|DKK|SEK|USD|EUR)?/i);
        const fee = feeMatch 
          ? parseFloat(feeMatch[1].replace(/\s/g, '').replace(',', '.'))
          : 0;
        
        // Parse total
        const totalMatch = lines[7]?.match(/[−-]?([\d\s,.]+)\s*(NOK|DKK|SEK|USD|EUR)?/i);
        const total = totalMatch 
          ? parseFloat(totalMatch[1].replace(/\s/g, '').replace(',', '.'))
          : 0;
        
        // Finn ticker
        const ticker = TICKER_MAP[stockName.toLowerCase()] || `${stockName.toUpperCase().replace(/\s+/g, '')}.OL`;
        
        if (quantity > 0 && price > 0) {
          trades.push({
            id: `${dateStr}-${stockName}-${isBuy ? 'BUY' : 'SELL'}-${Math.random().toString(36).substr(2, 5)}`,
            date: dateStr,
            name: stockName,
            ticker,
            quantity,
            price,
            fee,
            total,
            type: isBuy ? 'BUY' : 'SELL',
            selected: true,
            portfolioId: '', // Settes av hovedvalget
            strategyId: '',  // Settes av hovedvalget
          });
        }
      } catch (e) {
        console.error('Error parsing transaction block:', block, e);
      }
    }
    
    return trades;
  };

  // Parse Nordnet dividend/utbytte format
  const parseNordnetDividends = (text: string): ParsedDividend[] => {
    const dividends: ParsedDividend[] = [];
    
    // Fjern PDF-tekst og split på transaksjoner
    const cleanedText = text
      .replace(/Klikk på ikonet for å laste ned pdf/gi, '')
      .trim();
    
    // Split på dato-mønster
    const transactionBlocks = cleanedText.split(/(?=\d{1,2}\.\d{1,2}\.\d{4})/);
    
    for (const block of transactionBlocks) {
      if (!block.trim()) continue;
      
      const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
      
      if (lines.length < 5) continue;
      
      try {
        // Forventet format for utbytte:
        // 0: Dato (28.11.2025)
        // 1: Konto (Aksjesparekonto · 55702096)
        // 2: Type (Utbytte)
        // 3: Navn (Kid)
        // 4: Antall (80)
        // 5: Utbytte per aksje (2,50)
        // 6: - (bindestrek/tom)
        // 7: Total (200,00 NOK)
        
        const dateLineRaw = lines[0].trim();
        const dateMatch = dateLineRaw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        
        if (!dateMatch) continue;
        
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        const year = dateMatch[3];
        const dateStr = `${year}-${month}-${day}`;
        
        // Sjekk om det er utbytte
        const transactionType = lines[2]?.toLowerCase() || '';
        if (!transactionType.includes('utbytte')) continue;
        
        const stockName = lines[3];
        
        // Parse antall
        const quantityStr = lines[4].replace(/\s/g, '').replace(/\./g, '');
        const quantity = parseInt(quantityStr);
        
        // Parse utbytte per aksje
        const dpsMatch = lines[5]?.match(/([\d\s,.]+)/);
        const dividendPerShare = dpsMatch 
          ? parseFloat(dpsMatch[1].replace(/\s/g, '').replace(',', '.'))
          : 0;
        
        // Parse total (kan være på linje 6 eller 7)
        let totalAmount = 0;
        for (let i = 6; i < lines.length; i++) {
          const totalMatch = lines[i]?.match(/([\d\s,.]+)\s*(NOK|DKK|SEK|USD|EUR)/i);
          if (totalMatch) {
            totalAmount = parseFloat(totalMatch[1].replace(/\s/g, '').replace(',', '.'));
            break;
          }
        }
        
        // Finn ticker
        const ticker = TICKER_MAP[stockName.toLowerCase()] || `${stockName.toUpperCase().replace(/\s+/g, '')}.OL`;
        
        if (quantity > 0 && totalAmount > 0) {
          dividends.push({
            id: `div-${dateStr}-${stockName}-${Math.random().toString(36).substr(2, 5)}`,
            date: dateStr,
            name: stockName,
            ticker,
            quantity,
            dividendPerShare,
            totalAmount,
            selected: true,
          });
        }
      } catch (e) {
        console.error('Error parsing dividend block:', block, e);
      }
    }
    
    return dividends;
  };

  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setPasteText(text);
    
    if (text.trim()) {
      if (importMode === 'trades') {
        const parsed = parseNordnetBulk(text);
        // Sett default portfolio og strategi på alle
        const withDefaults = parsed.map(t => ({
          ...t,
          portfolioId: selectedPortfolioId,
          strategyId: selectedStrategyId,
        }));
        setParsedTrades(withDefaults);
        setParsedDividends([]);
      } else {
        const parsed = parseNordnetDividends(text);
        setParsedDividends(parsed);
        setParsedTrades([]);
      }
    } else {
      setParsedTrades([]);
      setParsedDividends([]);
    }
  };

  // Oppdater hovedvalg for portefølje - oppdaterer alle trades
  const handleMainPortfolioChange = (newPortfolioId: string) => {
    setSelectedPortfolioId(newPortfolioId);
    setParsedTrades(prev => prev.map(t => ({ ...t, portfolioId: newPortfolioId })));
  };

  // Oppdater hovedvalg for strategi - oppdaterer alle trades
  const handleMainStrategyChange = (newStrategyId: StrategyId | '') => {
    setSelectedStrategyId(newStrategyId);
    setParsedTrades(prev => prev.map(t => ({ ...t, strategyId: newStrategyId })));
  };

  // Oppdater enkelt trade sin portefølje
  const handleTradePortfolioChange = (id: string, portfolioId: string) => {
    setParsedTrades(prev => 
      prev.map(t => t.id === id ? { ...t, portfolioId } : t)
    );
  };

  // Oppdater enkelt trade sin strategi
  const handleTradeStrategyChange = (id: string, strategyId: StrategyId | '') => {
    setParsedTrades(prev => 
      prev.map(t => t.id === id ? { ...t, strategyId } : t)
    );
  };

  const toggleTradeSelection = (id: string) => {
    setParsedTrades(prev => 
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const toggleAllSelection = () => {
    const allSelected = parsedTrades.every(t => t.selected);
    setParsedTrades(prev => prev.map(t => ({ ...t, selected: !allSelected })));
  };

  const removeTrade = (id: string) => {
    setParsedTrades(prev => prev.filter(t => t.id !== id));
  };

  const handleImport = async () => {
    const selectedTrades = parsedTrades.filter(t => t.selected);
    if (selectedTrades.length === 0 || !selectedPortfolioId) return;
    
    setIsImporting(true);
    let success = 0;
    let failed = 0;
    const failedTrades: ParsedTrade[] = [];
    
    // Hent aktive trades for å matche salg
    const activeTrades = getActiveTrades();
    
    for (const trade of selectedTrades) {
      try {
        if (trade.type === 'BUY') {
          // KJØP: Opprett ny trade
          const tradePortfolioId = trade.portfolioId || selectedPortfolioId;
          const tradeStrategyId = (trade.strategyId || 'MOMENTUM_TREND') as StrategyId;
          
          // Beregn default target og stop loss
          const target = trade.price * 1.15; // 15% mål
          const stopLoss = trade.price * 0.92; // 8% stop loss
          
          // Beregn tidshorisont basert på DENNE trade sin strategi
          const strategy = STRATEGIES[tradeStrategyId];
          const daysToAdd = strategy?.typicalHoldingDays?.max || 30;
          const timeHorizonEnd = new Date(trade.date);
          timeHorizonEnd.setDate(timeHorizonEnd.getDate() + daysToAdd);
          
          const tradeInput: TradeInput = {
            ticker: trade.ticker,
            name: trade.name,
            entryPrice: trade.price,
            quantity: trade.quantity,
            entryDate: new Date(trade.date),
            portfolioId: tradePortfolioId,
            strategyId: tradeStrategyId,
            stopLoss,
            target,
            timeHorizonEnd,
            notes: `Importert fra Nordnet. Kurtasje: ${trade.fee} NOK`,
          };
          
          createTrade(tradeInput);
          success++;
        } else {
          // SALG: Finn og lukk eksisterende trade
          // Finn aktive trades med samme ticker
          const matchingTrades = activeTrades.filter(t => 
            t.ticker === trade.ticker && t.status === 'ACTIVE'
          );
          
          if (matchingTrades.length > 0) {
            // Lukk den eldste matchende traden
            const tradeToClose = matchingTrades.sort((a, b) => 
              new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
            )[0];
            
            updateTrade({
              id: tradeToClose.id,
              status: 'CLOSED',
              exitPrice: trade.price,
              exitDate: new Date(trade.date),
              exitReason: 'MANUAL',
              notes: `${tradeToClose.notes || ''}\nSolgt via Nordnet import. Kurtasje: ${trade.fee} NOK`,
            });
            
            // Fjern fra aktive trades listen så vi ikke lukker samme flere ganger
            const index = activeTrades.indexOf(tradeToClose);
            if (index > -1) activeTrades.splice(index, 1);
            
            success++;
          } else {
            // Ingen matchende trade funnet - opprett som allerede lukket
            const tradePortfolioId = trade.portfolioId || selectedPortfolioId;
            const tradeStrategyId = (trade.strategyId || 'MOMENTUM_TREND') as StrategyId;
            
            // Opprett en "placeholder" trade som allerede er lukket
            const tradeInput: TradeInput = {
              ticker: trade.ticker,
              name: trade.name,
              entryPrice: trade.price, // Ukjent inngang, bruker salgspris
              quantity: trade.quantity,
              entryDate: new Date(trade.date), // Sett til salgsdato
              portfolioId: tradePortfolioId,
              strategyId: tradeStrategyId,
              stopLoss: 0,
              target: 0,
              timeHorizonEnd: new Date(trade.date),
              notes: `SALG importert fra Nordnet (ingen matchende kjøp funnet). Kurtasje: ${trade.fee} NOK`,
            };
            
            const createdTrade = createTrade(tradeInput);
            
            // Lukk traden umiddelbart
            updateTrade({
              id: createdTrade.id,
              status: 'CLOSED',
              exitPrice: trade.price,
              exitDate: new Date(trade.date),
              exitReason: 'MANUAL',
            });
            
            success++;
          }
        }
      } catch (e) {
        console.error('Error importing trade:', trade, e);
        failed++;
        failedTrades.push(trade);
      }
    }
    
    const buys = selectedTrades.filter(t => t.type === 'BUY').length;
    const sells = selectedTrades.filter(t => t.type === 'SELL').length;
    
    setImportResult({ success, failed, failedTrades });
    setIsImporting(false);
    
    console.log(`✅ Importert: ${buys} kjøp, ${sells} salg`);
    if (failedTrades.length > 0) {
      console.log('❌ Feilede trades:', failedTrades);
    }
    
    if (success > 0) {
      // Fjern kun suksessfullt importerte trades fra listen (behold feilede)
      const failedIds = new Set(failedTrades.map(t => t.id));
      setParsedTrades(prev => prev.filter(t => !t.selected || failedIds.has(t.id)));
      onSuccess?.();
    }
  };

  // Import dividends
  const handleImportDividends = async () => {
    const selectedDividends = parsedDividends.filter(d => d.selected);
    if (selectedDividends.length === 0) return;
    
    setIsImporting(true);
    
    try {
      const dividendInputs: DividendInput[] = selectedDividends.map(d => ({
        ticker: d.ticker,
        name: d.name,
        date: new Date(d.date),
        quantity: d.quantity,
        dividendPerShare: d.dividendPerShare,
        totalAmount: d.totalAmount,
        currency: 'NOK',
      }));
      
      createDividendBulk(dividendInputs);
      
      setDividendResult({ success: selectedDividends.length, failed: 0 });
      setParsedDividends(prev => prev.filter(d => !d.selected));
      onSuccess?.();
    } catch (e) {
      console.error('Error importing dividends:', e);
      setDividendResult({ success: 0, failed: selectedDividends.length });
    }
    
    setIsImporting(false);
  };

  // Toggle dividend selection
  const toggleDividendSelection = (id: string) => {
    setParsedDividends(prev => prev.map(d => 
      d.id === id ? { ...d, selected: !d.selected } : d
    ));
  };

  const toggleAllDividends = (selected: boolean) => {
    setParsedDividends(prev => prev.map(d => ({ ...d, selected })));
  };

  if (!isOpen) return null;

  const selectedCount = parsedTrades.filter(t => t.selected).length;
  const selectedDividendCount = parsedDividends.filter(d => d.selected).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-slate flex items-center gap-2">
              <Upload className="w-6 h-6 text-brand-emerald" />
              Bulk Import fra Nordnet
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {importMode === 'trades' 
                ? <>Lim inn transaksjoner fra Nordnet - støtter både <span className="text-green-600 font-medium">KJØP</span> og <span className="text-red-600 font-medium">SALG</span></>
                : <>Lim inn <span className="text-blue-600 font-medium">UTBYTTE</span> fra Nordnet</>
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => { setImportMode('trades'); setPasteText(''); setParsedTrades([]); setParsedDividends([]); setImportResult(null); setDividendResult(null); }}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors',
              importMode === 'trades'
                ? 'border-brand-emerald text-brand-emerald'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Trades (Kjøp/Salg)
          </button>
          <button
            onClick={() => { setImportMode('dividends'); setPasteText(''); setParsedTrades([]); setParsedDividends([]); setImportResult(null); setDividendResult(null); }}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors',
              importMode === 'dividends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <DollarSign className="w-4 h-4" />
            Utbytte
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Paste Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {importMode === 'trades' ? 'Lim inn Nordnet-transaksjoner' : 'Lim inn Nordnet-utbytte'}
            </label>
            <textarea
              value={pasteText}
              onChange={handlePasteChange}
              placeholder={importMode === 'trades' 
                ? `Kopier og lim inn transaksjoner fra Nordnet her...

Eksempel format:
12.1.2026
Aksjesparekonto · 55702096
Kjøpt
Norsk Hydro
120
81,88 NOK
29 NOK
−9 854,60 NOK`
                : `Kopier og lim inn utbytte fra Nordnet her...

Eksempel format:
28.11.2025
Aksjesparekonto · 55702096
Utbytte
Kid
80
2,50
-
200,00 NOK`}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all resize-none font-mono text-sm"
            />
          </div>

          {/* Portfolio & Strategy Selection - Hovedvalg */}
          {parsedTrades.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 mb-3 font-medium">
                ⬇️ Sett for alle (du kan endre individuelt i tabellen under)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Portefølje for alle
                  </label>
                  <select
                    value={selectedPortfolioId}
                    onChange={(e) => handleMainPortfolioChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
                  >
                    {portfolios.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Strategi for alle
                  </label>
                  <select
                    value={selectedStrategyId}
                    onChange={(e) => handleMainStrategyChange(e.target.value as StrategyId)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
                  >
                    <option value="">📈 Momentum Trend (default)</option>
                    <optgroup label="── Ekspert-strategier ──">
                      <option value="UKENS_AKSJE">📰 Ukens Aksje (Espen Tingvoll)</option>
                    </optgroup>
                    <optgroup label="── Ærlige strategier ──">
                      <option value="YOLO">🎲 Magefølelse (YOLO)</option>
                      <option value="FOMO">🚨 FOMO - alle kjøper!</option>
                      <option value="TIPS">💬 Tips fra noen</option>
                      <option value="HODL">💎 Bare HODL</option>
                      <option value="DIVIDEND_HUNTER">💰 Utbytte</option>
                    </optgroup>
                    <optgroup label="── Trading-strategier ──">
                      {Object.values(STRATEGIES)
                        .filter(s => s.enabled && !['YOLO', 'FOMO', 'TIPS', 'HODL', 'DIVIDEND_HUNTER', 'UKENS_AKSJE'].includes(s.id))
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                        ))
                      }
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Trades Preview */}
          {parsedTrades.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">
                  Funnet {parsedTrades.length} transaksjoner
                </h3>
                <button
                  onClick={toggleAllSelection}
                  className="text-sm text-brand-emerald hover:underline"
                >
                  {parsedTrades.every(t => t.selected) ? 'Fjern alle' : 'Velg alle'}
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-8 px-2 py-2"></th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">Type</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">Dato</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">Aksje</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-600">Antall</th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-600">Pris</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">Portefølje</th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-600">Strategi</th>
                      <th className="w-8 px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedTrades.map(trade => (
                      <tr 
                        key={trade.id}
                        className={trade.selected ? 'bg-brand-emerald/5' : 'opacity-50 bg-gray-50'}
                      >
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={trade.selected}
                            onChange={() => toggleTradeSelection(trade.id)}
                            className="w-4 h-4 rounded border-gray-300 text-brand-emerald focus:ring-brand-emerald"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            trade.type === 'BUY' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {trade.type === 'BUY' ? 'KJØP' : 'SALG'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-gray-600 text-xs">
                          {trade.date.split('-').reverse().join('.')}
                        </td>
                        <td className="px-2 py-2">
                          <div className="font-medium text-gray-900">{trade.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{trade.ticker}</div>
                        </td>
                        <td className="px-2 py-2 text-right text-gray-900">{trade.quantity}</td>
                        <td className="px-2 py-2 text-right text-gray-900">
                          {trade.price.toLocaleString('nb-NO', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={trade.portfolioId}
                            onChange={(e) => handleTradePortfolioChange(trade.id, e.target.value)}
                            disabled={!trade.selected}
                            className="w-full px-2 py-1 text-xs rounded border border-gray-200 focus:border-brand-emerald outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {portfolios.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={trade.strategyId}
                            onChange={(e) => handleTradeStrategyChange(trade.id, e.target.value as StrategyId)}
                            disabled={!trade.selected}
                            className="w-full px-2 py-1 text-xs rounded border border-gray-200 focus:border-brand-emerald outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <option value="">📈 M-Trend</option>
                            {Object.values(STRATEGIES)
                              .filter(s => s.enabled && s.id !== 'MOMENTUM_TREND')
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.emoji} {s.shortName}
                                </option>
                              ))
                            }
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeTrade(trade.id)}
                            className="p-1 text-gray-400 hover:text-brand-rose transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-xl ${
                importResult.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'
              }`}>
                {importResult.failed > 0 ? (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                <span className={importResult.failed > 0 ? 'text-yellow-800' : 'text-green-800'}>
                  {importResult.success} trades importert
                  {importResult.failed > 0 && `, ${importResult.failed} feilet`}
                </span>
              </div>
              
              {/* Vis feilede trades med detaljer */}
              {importResult.failedTrades && importResult.failedTrades.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Feilede trades - legg til manuelt:
                  </h4>
                  <div className="space-y-2">
                    {importResult.failedTrades.map((trade, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-red-100">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            trade.type === 'BUY' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {trade.type === 'BUY' ? 'KJØP' : 'SALG'}
                          </span>
                          <span className="font-semibold text-gray-900">{trade.name}</span>
                          <span className="text-gray-500 font-mono text-sm">{trade.ticker}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <span>📅 Dato: {trade.date.split('-').reverse().join('.')}</span>
                          <span>📊 Antall: {trade.quantity}</span>
                          <span>💰 Pris: {trade.price.toFixed(2)} kr</span>
                          <span>🏷️ Kurtasje: {trade.fee.toFixed(2)} kr</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-red-600">
                    💡 Disse tradene må legges til manuelt via &quot;Ny Trade&quot;-knappen i porteføljen.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dividend Preview Table */}
          {importMode === 'dividends' && parsedDividends.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">
                  💰 Forhåndsvisning ({parsedDividends.length} utbytte)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllDividends(true)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Velg alle
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => toggleAllDividends(false)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Fjern alle
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left">✓</th>
                      <th className="px-3 py-2 text-left">Dato</th>
                      <th className="px-3 py-2 text-left">Aksje</th>
                      <th className="px-3 py-2 text-right">Antall</th>
                      <th className="px-3 py-2 text-right">Per aksje</th>
                      <th className="px-3 py-2 text-right">Totalt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedDividends.map(dividend => (
                      <tr 
                        key={dividend.id} 
                        className={clsx(
                          'hover:bg-gray-50 transition-colors',
                          !dividend.selected && 'opacity-50'
                        )}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={dividend.selected}
                            onChange={() => toggleDividendSelection(dividend.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {dividend.date.split('-').reverse().join('.')}
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{dividend.ticker}</div>
                          <div className="text-xs text-gray-500">{dividend.name}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {dividend.quantity.toLocaleString('nb-NO')}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {dividend.dividendPerShare.toFixed(2)} kr
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-blue-600">
                          {dividend.totalAmount.toLocaleString('nb-NO', { maximumFractionDigits: 2 })} kr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t border-blue-200">
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-right font-semibold text-gray-700">
                        Total utbytte:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-blue-700">
                        {parsedDividends
                          .filter(d => d.selected)
                          .reduce((sum, d) => sum + d.totalAmount, 0)
                          .toLocaleString('nb-NO', { maximumFractionDigits: 2 })} kr
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Dividend Import Result */}
          {dividendResult && (
            <div className={clsx(
              'rounded-xl p-4 border',
              dividendResult.success > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              {dividendResult.success > 0 ? (
                <div className="flex items-center gap-2 text-green-700">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">
                    {dividendResult.success} utbytte importert! 💰
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Import feilet
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-500">
            {importMode === 'trades' ? (
              selectedCount > 0 ? (
                <span className="flex items-center gap-2">
                  <span className="font-medium text-brand-emerald">{selectedCount} valgt:</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                    {parsedTrades.filter(t => t.selected && t.type === 'BUY').length} kjøp
                  </span>
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                    {parsedTrades.filter(t => t.selected && t.type === 'SELL').length} salg
                  </span>
                </span>
              ) : (
                'Ingen transaksjoner valgt'
              )
            ) : (
              selectedDividendCount > 0 ? (
                <span className="flex items-center gap-2">
                  <span className="font-medium text-blue-600">{selectedDividendCount} utbytte valgt</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">
                    {parsedDividends.filter(d => d.selected).reduce((sum, d) => sum + d.totalAmount, 0).toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </span>
                </span>
              ) : (
                'Ingen utbytte valgt'
              )
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
            >
              Lukk
            </button>
            {importMode === 'trades' ? (
              <button
                onClick={handleImport}
                disabled={selectedCount === 0 || !selectedPortfolioId || isImporting}
                className={`flex items-center gap-2 px-6 py-2 font-bold rounded-lg transition-colors ${
                  selectedCount > 0 && selectedPortfolioId && !isImporting
                    ? 'bg-brand-emerald text-white hover:bg-brand-emerald/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importerer...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Importer {selectedCount} trades
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleImportDividends}
                disabled={selectedDividendCount === 0 || isImporting}
                className={`flex items-center gap-2 px-6 py-2 font-bold rounded-lg transition-colors ${
                  selectedDividendCount > 0 && !isImporting
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isImporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Importerer...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Importer {selectedDividendCount} utbytte
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
