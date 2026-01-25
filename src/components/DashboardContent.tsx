'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import StockCard from '@/components/StockCard';
import StockCardOriginal from '@/components/StockCardOriginal';
import FilterBar, { MarketFilter, StrategyFilter } from '@/components/FilterBar';
import MarketStatus from '@/components/MarketStatus';
import { Stock } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, RefreshCcw, Loader2, Search, X, Plus, Check, AlertCircle, ChevronRight, LayoutGrid, List, Layers, StickyNote, Trash2, Calendar, Bell, Edit2, Zap, Shield, ArrowUpCircle, Users } from 'lucide-react';
import { getCustomTickers, addCustomTicker, removeCustomTicker, isInBaseUniverse, getUniverseSize, setUniverseSize, type UniverseSize } from '@/lib/store/universe-store';
import { getNotes, addNote, updateNote, deleteNote, type StockNote } from '@/lib/store/notes-store';
import { toast } from 'sonner';
import SBScanDashboard from '@/components/SBScanDashboard';

interface DashboardContentProps {
  initialStocks: Stock[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

// Beregn en sammensatt score for å rangere aksjer
const calculateCompositeScore = (stock: Stock, prioritizeInsider: boolean = false): number => {
  let score = 0;
  
  if (prioritizeInsider && stock.insiderScore !== undefined) {
    score += stock.insiderScore * 0.4;
    score += stock.kScore * 0.3;
    const rsiOptimal = 50;
    const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
    const rsiScore = Math.max(0, 100 - (rsiDistance * 3));
    score += rsiScore * 0.15;
    const riskRewardRatio = stock.gainPercent / stock.riskPercent;
    const rrScore = Math.min(100, riskRewardRatio * 20);
    score += rrScore * 0.15;
  } else {
    score += stock.kScore * 0.5;
    const rsiOptimal = 50;
    const rsiDistance = Math.abs(stock.rsi - rsiOptimal);
    const rsiScore = Math.max(0, 100 - (rsiDistance * 3));
    score += rsiScore * 0.2;
    const riskRewardRatio = stock.gainPercent / stock.riskPercent;
    const rrScore = Math.min(100, riskRewardRatio * 20);
    score += rrScore * 0.3;
  }
  
  return score;
};

type ViewMode = 'cards-and-list' | 'list-only' | 'cards-only';

export default function DashboardContent({ initialStocks, onRefresh, isRefreshing, lastUpdated }: DashboardContentProps) {
  const router = useRouter();
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('ALLE');
  const [strategyFilter, setStrategyFilter] = useState<StrategyFilter>('ALLE');
  const [useOriginalDesign, setUseOriginalDesign] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards-and-list');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // Custom tickers state
  const [customTickers, setCustomTickers] = useState<string[]>([]);
  
  // Universe size state
  const [universeSize, setUniverseSizeState] = useState<UniverseSize>(100);
  
  // Additional stocks fetched for custom tickers not in initialStocks
  const [customTickerStocks, setCustomTickerStocks] = useState<Stock[]>([]);
  
  // Notes state
  const [noteModalTicker, setNoteModalTicker] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [noteReminder, setNoteReminder] = useState('');
  const [noteAlert, setNoteAlert] = useState(false);
  const [editingNote, setEditingNote] = useState<StockNote | null>(null);
  const [stockNotes, setStockNotes] = useState<Record<string, StockNote[]>>({});
  const [hoveredNoteTicker, setHoveredNoteTicker] = useState<string | null>(null);
  
  // Tag options (same as StockNotesSection)
  const TAG_OPTIONS = [
    { value: 'sesong', label: 'Sesong', color: 'bg-blue-100 text-blue-700' },
    { value: 'rapport', label: 'Rapport', color: 'bg-purple-100 text-purple-700' },
    { value: 'mønster', label: 'Mønster', color: 'bg-orange-100 text-orange-700' },
    { value: 'personlig', label: 'Personlig', color: 'bg-gray-100 text-gray-700' },
  ];
  
  // Load custom tickers and universe size on mount
  useEffect(() => {
    const tickers = getCustomTickers();
    setCustomTickers(tickers);
    
    const storedSize = getUniverseSize();
    setUniverseSizeState(storedSize);
    
    // Load notes for all stocks
    const notes: Record<string, StockNote[]> = {};
    initialStocks.forEach(stock => {
      const tickerNotes = getNotes(stock.ticker);
      if (tickerNotes.length > 0) {
        notes[stock.ticker] = tickerNotes;
      }
    });
    setStockNotes(notes);
  }, [initialStocks]);
  
  // Handle universe size change
  const handleUniverseSizeChange = (size: UniverseSize) => {
    setUniverseSizeState(size);
    setUniverseSize(size);
    toast.success(`Univers endret til ${size === 'full' ? 'alle' : size} aksjer`);
    // Trigger a refresh to load new stocks
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Fetch data for custom tickers not in initialStocks
  useEffect(() => {
    const fetchMissingCustomTickers = async () => {
      const missingTickers = customTickers.filter(
        ticker => !initialStocks.some(s => s.ticker.toUpperCase() === ticker.toUpperCase())
      );
      
      if (missingTickers.length === 0) {
        setCustomTickerStocks([]);
        return;
      }
      
      try {
        // Fetch data for each missing ticker
        const fetchPromises = missingTickers.map(async (ticker) => {
          const response = await fetch(`/api/stock/${encodeURIComponent(ticker)}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              return result.data as Stock;
            }
          }
          return null;
        });
        
        const results = await Promise.all(fetchPromises);
        const validStocks = results.filter((s): s is Stock => s !== null);
        setCustomTickerStocks(validStocks);
      } catch (error) {
        console.error('Error fetching custom ticker data:', error);
      }
    };
    
    if (customTickers.length > 0) {
      fetchMissingCustomTickers();
    } else {
      setCustomTickerStocks([]);
    }
  }, [customTickers, initialStocks]);

  // Search handler
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    
    const upperQuery = query.toUpperCase();
    
    // Search in existing stocks first
    const existingMatches = initialStocks
      .filter(s => s.ticker.toUpperCase().includes(upperQuery) || s.name.toUpperCase().includes(upperQuery))
      .map(s => s.ticker)
      .slice(0, 5);
    
    // Also suggest the raw query as potential ticker
    const potentialTicker = upperQuery.endsWith('.OL') ? upperQuery : `${upperQuery}.OL`;
    const allResults = [...new Set([...existingMatches, potentialTicker])].slice(0, 6);
    
    setSearchResults(allResults);
    setShowSearchDropdown(true);
  }, [initialStocks]);

  // Add ticker to Mine list
  const handleSelectTicker = useCallback((ticker: string, navigateToAnalysis: boolean = false) => {
    const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
      ? ticker.toUpperCase() 
      : `${ticker.toUpperCase()}.OL`;
    
    // Check if already in custom tickers
    const alreadyInCustom = customTickers.some(
      t => t.toUpperCase() === normalizedTicker.toUpperCase()
    );
    
    if (!alreadyInCustom) {
      const wasAdded = addCustomTicker(normalizedTicker);
      if (wasAdded) {
        setCustomTickers(prev => [...prev, normalizedTicker]);
        toast.success(`${normalizedTicker.replace('.OL', '')} lagt til i Mine`);
      }
    } else {
      toast.info(`${normalizedTicker.replace('.OL', '')} er allerede i Mine`);
    }
    
    setSearchQuery('');
    setShowSearchDropdown(false);
    
    if (navigateToAnalysis) {
      router.push(`/analyse/${normalizedTicker}`);
    }
  }, [customTickers, router]);

  // Direct search (enter key)
  const handleDirectSearch = useCallback((navigateToAnalysis: boolean = true) => {
    if (searchQuery.length < 2) return;
    
    const normalizedTicker = searchQuery.toUpperCase().endsWith('.OL') 
      ? searchQuery.toUpperCase() 
      : `${searchQuery.toUpperCase()}.OL`;
    
    // Validate ticker exists
    const isKnown = isInBaseUniverse(normalizedTicker);
    
    if (!isKnown) {
      toast.error(`${normalizedTicker.replace('.OL', '')} finnes ikke på Oslo Børs`);
      return;
    }
    
    handleSelectTicker(normalizedTicker, navigateToAnalysis);
  }, [searchQuery, handleSelectTicker]);

  // Remove from Mine list
  const handleRemoveFromMine = useCallback((ticker: string) => {
    const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
      ? ticker.toUpperCase() 
      : `${ticker.toUpperCase()}.OL`;
    
    const wasRemoved = removeCustomTicker(normalizedTicker);
    if (wasRemoved) {
      setCustomTickers(prev => prev.filter(t => t.toUpperCase() !== normalizedTicker.toUpperCase()));
      toast.success(`${normalizedTicker.replace('.OL', '')} fjernet fra Mine`);
    }
  }, []);

  // Reset note form
  const resetNoteForm = useCallback(() => {
    setNoteModalTicker(null);
    setNoteText('');
    setNoteTags([]);
    setNoteReminder('');
    setNoteAlert(false);
    setEditingNote(null);
  }, []);

  // Open note modal for editing
  const openNoteForEdit = useCallback((note: StockNote) => {
    setNoteModalTicker(note.ticker);
    setNoteText(note.note);
    setNoteTags(note.tags || []);
    setNoteReminder(note.reminder || '');
    setNoteAlert(note.alertEnabled || false);
    setEditingNote(note);
  }, []);

  // Add or update note
  const handleSaveNote = useCallback(() => {
    if (!noteModalTicker || !noteText.trim()) return;
    
    if (editingNote) {
      // Update existing note
      updateNote(editingNote.id, {
        note: noteText.trim(),
        tags: noteTags,
        reminder: noteReminder || undefined,
        alertEnabled: noteAlert,
      });
      toast.success('Notat oppdatert');
    } else {
      // Add new note
      addNote({
        ticker: noteModalTicker,
        note: noteText.trim(),
        tags: noteTags,
        reminder: noteReminder || undefined,
        alertEnabled: noteAlert,
      });
      toast.success('Notat lagt til');
    }
    
    // Refresh notes
    setStockNotes(prev => ({
      ...prev,
      [noteModalTicker]: getNotes(noteModalTicker),
    }));
    
    resetNoteForm();
  }, [noteModalTicker, noteText, noteTags, noteReminder, noteAlert, editingNote, resetNoteForm]);

  // Delete note
  const handleDeleteNote = useCallback((noteId: string, ticker: string) => {
    deleteNote(noteId);
    setStockNotes(prev => ({
      ...prev,
      [ticker]: getNotes(ticker),
    }));
    toast.success('Notat slettet');
  }, []);

  // Toggle tag
  const toggleNoteTag = useCallback((tag: string) => {
    setNoteTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  // Combine initialStocks with customTickerStocks
  const allStocks = useMemo(() => {
    const combined = [...initialStocks];
    // Add custom ticker stocks that aren't already in initialStocks
    customTickerStocks.forEach(stock => {
      if (!combined.some(s => s.ticker.toUpperCase() === stock.ticker.toUpperCase())) {
        combined.push(stock);
      }
    });
    return combined;
  }, [initialStocks, customTickerStocks]);

  const filteredStocks = useMemo(() => {
    let filtered = [...allStocks];

    // Filter by market
    if (marketFilter !== 'ALLE') {
      filtered = filtered.filter(stock => stock.market === marketFilter);
    }

    // Handle MINE filter specially
    if (strategyFilter === 'MINE') {
      // Return only custom tickers
      filtered = filtered.filter(stock => 
        customTickers.some(t => t.toUpperCase() === stock.ticker.toUpperCase())
      );
      
      // Sort by composite score
      filtered.sort((a, b) => calculateCompositeScore(b) - calculateCompositeScore(a));
      
      if (viewMode === 'cards-and-list') {
        return filtered.slice(0, 3);
      } else if (viewMode === 'cards-only') {
        return filtered;
      }
      return [];
    }

    // Filter by strategy
    if (strategyFilter !== 'ALLE' && strategyFilter !== 'SB_SCAN') {
      // Map FilterBar strategy names to Stock strategy types
      // Some filters may match multiple strategy types
      const strategyMap: Record<string, string[]> = {
        'MOMENTUM': ['MOMENTUM', 'MOMENTUM_TREND', 'MOMENTUM_ASYM'],
        'BUFFETT': ['BUFFETT'],
        'TVEITEREID': ['TVEITEREID'],
        'REBOUND': ['REBOUND'],
        'INSIDER': ['INSIDER'],
        // These don't have corresponding stock strategies yet, but we keep them for future use
        'SWINGTRADE': [],
        'DAYTRADE': [],
        'UTBYTTE': [],
      };
      const mappedStrategies = strategyMap[strategyFilter] || [];
      if (mappedStrategies.length > 0) {
        filtered = filtered.filter(stock => 
          mappedStrategies.some(s => stock.strategies.includes(s as any))
        );
      }
    }

    // Filter only BUY signals
    const buyStocks = filtered.filter(stock => stock.signal === 'BUY');
    
    const prioritizeInsider = strategyFilter === 'INSIDER';
    buyStocks.sort((a, b) => {
      const scoreA = calculateCompositeScore(a, prioritizeInsider);
      const scoreB = calculateCompositeScore(b, prioritizeInsider);
      return scoreB - scoreA;
    });
    
    if (viewMode === 'cards-and-list') {
      return buyStocks.slice(0, 3);
    } else if (viewMode === 'cards-only') {
      return buyStocks;
    } else {
      return [];
    }
  }, [allStocks, marketFilter, strategyFilter, viewMode, customTickers]);

  const buySignals = allStocks.filter(s => s.signal === 'BUY').length;
  const holdSignals = allStocks.filter(s => s.signal === 'HOLD').length;
  const sellSignals = allStocks.filter(s => s.signal === 'SELL').length;
  
  // Watchlist stocks
  const watchlistStocks = useMemo(() => {
    const prioritizeInsider = strategyFilter === 'INSIDER';
    
    let filtered = [...allStocks];
    
    if (marketFilter !== 'ALLE') {
      filtered = filtered.filter(stock => stock.market === marketFilter);
    }
    
    // Handle MINE filter specially
    if (strategyFilter === 'MINE') {
      filtered = filtered.filter(stock => 
        customTickers.some(t => t.toUpperCase() === stock.ticker.toUpperCase())
      );
      
      if (viewMode === 'list-only') {
        return filtered.sort((a, b) => calculateCompositeScore(b) - calculateCompositeScore(a));
      }
      
      if (viewMode === 'cards-only') {
        return [];
      }
      
      // cards-and-list: exclude top 3
      const sorted = filtered.sort((a, b) => calculateCompositeScore(b) - calculateCompositeScore(a));
      return sorted.slice(3);
    }
    
    if (strategyFilter !== 'ALLE' && strategyFilter !== 'SB_SCAN') {
      const strategyMap: Record<string, string[]> = {
        'MOMENTUM': ['MOMENTUM', 'MOMENTUM_TREND', 'MOMENTUM_ASYM'],
        'BUFFETT': ['BUFFETT'],
        'TVEITEREID': ['TVEITEREID'],
        'REBOUND': ['REBOUND'],
        'INSIDER': ['INSIDER'],
        'SWINGTRADE': [],
        'DAYTRADE': [],
        'UTBYTTE': [],
      };
      const mappedStrategies = strategyMap[strategyFilter] || [];
      if (mappedStrategies.length > 0) {
        filtered = filtered.filter(stock => 
          mappedStrategies.some(s => stock.strategies.includes(s as any))
        );
      }
    }
    
    const allBuyStocks = filtered
      .filter(stock => stock.signal === 'BUY')
      .sort((a, b) => {
        const scoreA = calculateCompositeScore(a, prioritizeInsider);
        const scoreB = calculateCompositeScore(b, prioritizeInsider);
        return scoreB - scoreA;
      });
    
    if (viewMode === 'list-only') {
      return filtered.sort((a, b) => {
        const signalOrder = { BUY: 0, HOLD: 1, SELL: 2 };
        if (signalOrder[a.signal] !== signalOrder[b.signal]) {
          return signalOrder[a.signal] - signalOrder[b.signal];
        }
        const scoreA = calculateCompositeScore(a, prioritizeInsider);
        const scoreB = calculateCompositeScore(b, prioritizeInsider);
        return scoreB - scoreA;
      });
    }
    
    if (viewMode === 'cards-only') {
      return [];
    }
    
    const top3BuyTickers = allBuyStocks.slice(0, 3).map(s => s.ticker);
    
    return filtered
      .filter(stock => !top3BuyTickers.includes(stock.ticker))
      .sort((a, b) => {
        const signalOrder = { BUY: 0, HOLD: 1, SELL: 2 };
        if (signalOrder[a.signal] !== signalOrder[b.signal]) {
          return signalOrder[a.signal] - signalOrder[b.signal];
        }
        const scoreA = calculateCompositeScore(a, prioritizeInsider);
        const scoreB = calculateCompositeScore(b, prioritizeInsider);
        return scoreB - scoreA;
      });
  }, [allStocks, viewMode, strategyFilter, marketFilter, customTickers]);

  return (
    <main className="min-h-screen p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Dashboard
          </h1>
          <MarketStatus />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground text-sm">
              Sist oppdatert: {lastUpdated 
                ? new Date(lastUpdated).toLocaleDateString('nb-NO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : new Date().toLocaleDateString('nb-NO', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
              }
            </p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors',
                  isRefreshing 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                )}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
                {isRefreshing ? 'Oppdaterer...' : 'Oppdater nå'}
              </button>
            )}
          </div>
          
          {/* Search Bar - centered */}
          <div className="relative flex-1 flex justify-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Søk ticker..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDirectSearch(false);
                  }
                  if (e.key === 'Escape') {
                    setShowSearchDropdown(false);
                    setSearchQuery('');
                  }
                }}
                className="w-72 pl-4 pr-10 py-2.5 text-sm font-medium rounded-full border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald outline-none"
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              
              {/* Search Dropdown */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  {searchResults.map((ticker) => {
                    const stock = initialStocks.find(s => s.ticker === ticker);
                    const inCustom = customTickers.some(t => t.toUpperCase() === ticker.toUpperCase());
                    
                    return (
                      <div
                        key={ticker}
                        className="flex items-center justify-between px-4 py-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                        onClick={() => handleSelectTicker(ticker, true)}
                      >
                        <div>
                          <div className="font-bold text-foreground">{ticker.replace('.OL', '')}</div>
                          {stock && <div className="text-sm text-muted-foreground">{stock.name}</div>}
                          {!stock && <div className="text-xs text-amber-500">Ukjent ticker</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          {inCustom ? (
                            <span className="text-xs text-brand-emerald flex items-center gap-1">
                              <Check className="w-3 h-3" /> I Mine
                            </span>
                          ) : (
                            <span className="text-xs text-brand-emerald flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Legg til
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Universe Size Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 ml-6">
            {([50, 100, 150, 200] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleUniverseSizeChange(size)}
                className={clsx(
                  'px-2.5 py-1.5 text-sm font-medium rounded-md transition-all',
                  universeSize === size
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {size}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 ml-8">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-brand-emerald" strokeWidth={2.5} />
              <span className="text-base font-bold text-brand-emerald">{buySignals}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase">Kjøp</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Minus className="w-4 h-4 text-muted-foreground" strokeWidth={2.5} />
              <span className="text-base font-bold text-muted-foreground">{holdSignals}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase">Hold</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-brand-rose" strokeWidth={2.5} />
              <span className="text-base font-bold text-brand-rose">{sellSignals}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase">Selg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - always visible */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-foreground">
              {strategyFilter === 'MINE' ? 'Mine Aksjer' :
               viewMode === 'cards-only' ? 'Alle Kjøpsanbefalinger' : 
               viewMode === 'list-only' ? '' : 
               'Topp 3 Kjøpsanbefalinger'}
            </h2>
            {viewMode !== 'list-only' && strategyFilter !== 'MINE' && (
              <span className="text-sm text-muted-foreground">
                Rangert etter K-Score, RSI og Risk/Reward
              </span>
            )}
          </div>
          
        </div>
        
        <div className="flex items-center justify-between gap-6">
          <FilterBar 
            onMarketChange={setMarketFilter}
            onStrategyChange={setStrategyFilter}
            mineCount={customTickers.length}
          />
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
              <button
                onClick={() => setViewMode('cards-and-list')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'cards-and-list' 
                    ? 'bg-card shadow-sm text-brand-emerald' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Kort + Liste"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list-only')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'list-only' 
                    ? 'bg-card shadow-sm text-brand-emerald' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Kun Liste"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cards-only')}
                className={clsx(
                  'p-2 rounded-lg transition-all',
                  viewMode === 'cards-only' 
                    ? 'bg-card shadow-sm text-brand-emerald' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Kun Kort"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={() => setUseOriginalDesign(!useOriginalDesign)}
              className="flex-shrink-0"
              title={useOriginalDesign ? 'Bytt til Moderne Design' : 'Bytt til Original Design'}
            >
              <div className={`relative w-12 h-6 rounded-full transition-colors ${!useOriginalDesign ? 'bg-brand-emerald' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card transition-transform shadow-sm ${!useOriginalDesign ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* SB-Scan Dashboard - shown when SB_SCAN filter is active */}
      {strategyFilter === 'SB_SCAN' && (
        <div className="mb-8">
          <SBScanDashboard />
        </div>
      )}

      {/* Stock Grid - hidden when SB_SCAN is active */}
      {strategyFilter !== 'SB_SCAN' && filteredStocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStocks.map((stock, index) => {
            const rank = index + 1;
            
            return useOriginalDesign ? (
              <StockCardOriginal key={stock.ticker} stock={stock} rank={rank} />
            ) : (
              <StockCard key={stock.ticker} stock={stock} rank={rank} />
            );
          })}
        </div>
      )}
      
      {strategyFilter !== 'SB_SCAN' && filteredStocks.length === 0 && viewMode !== 'list-only' && (
        <div className="text-center py-16">
          <div className="text-muted-foreground text-lg mb-2">
            {strategyFilter === 'MINE' && customTickers.length === 0 
              ? 'Ingen aksjer i Mine-listen' 
              : 'Ingen aksjer matcher filtrene'}
          </div>
          <p className="text-muted-foreground text-sm">
            {strategyFilter === 'MINE' 
              ? 'Søk etter en ticker ovenfor for å legge til' 
              : 'Prøv å justere filtreringsalternativene'}
          </p>
        </div>
      )}

      {/* Watchlist - hidden when SB_SCAN is active */}
      {strategyFilter !== 'SB_SCAN' && watchlistStocks.length > 0 && (
        <div className={clsx(viewMode === 'list-only' ? 'mt-0' : 'mt-16')}>
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-6 h-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-muted-foreground">
              {strategyFilter === 'MINE' ? 'Mine Aksjer' :
               viewMode === 'list-only' ? 'Alle Aksjer' : 'Overvåkes'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {watchlistStocks.length} aksjer
            </span>
          </div>

          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2.5rem,1fr,1fr,0.8fr,0.5fr,1.4fr,1.4fr,0.7fr,0.8fr,0.5fr,0.5fr] px-6 py-3 bg-muted border-b border-border">
              <div className="text-xs font-bold text-muted-foreground uppercase">#</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Ticker</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Pris</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Status</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">RSI</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">K-Score</div>
              <div className="text-xs font-bold text-muted-foreground uppercase pl-6">Risk/Reward</div>
              <div className="text-xs font-bold text-muted-foreground uppercase pl-4">Tid</div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Strategi</div>
              <div className="text-xs font-bold text-muted-foreground uppercase text-center">Notat</div>
              <div className="text-xs font-bold text-muted-foreground uppercase text-right">Aksjon</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {watchlistStocks.map((stock, index) => {
                let rank: number | null;
                if (strategyFilter === 'MINE' || viewMode === 'list-only') {
                  rank = index + 1;
                } else {
                  if (stock.signal === 'BUY') {
                    const buyStocksBeforeThis = watchlistStocks
                      .slice(0, index)
                      .filter(s => s.signal === 'BUY').length;
                    rank = buyStocksBeforeThis + 4;
                  } else {
                    rank = index + 4;
                  }
                }
                
                const tickerShort = stock.ticker.replace('.OL', '');
                const statusConfig: Record<string, { className: string; label: string }> = {
                  BUY: { className: 'badge-buy', label: 'KJØP' },
                  HOLD: { className: 'badge-watch', label: 'WATCH' },
                  SELL: { className: 'badge-sell', label: 'SELL' },
                };
                const config = statusConfig[stock.signal] || statusConfig.HOLD;
                const kScoreColor = stock.kScore >= 75 ? 'bg-brand-emerald' : stock.kScore >= 60 ? 'bg-yellow-400' : 'bg-muted';
                const priceChangeColor = stock.changePercent > 0 ? 'text-brand-emerald' : 'text-brand-rose';
                const notes = stockNotes[stock.ticker] || [];
                const isInMine = customTickers.some(t => t.toUpperCase() === stock.ticker.toUpperCase());

                // Calculate ratio
                const ratioValue = stock.riskPercent > 0 ? stock.gainPercent / stock.riskPercent : 0;
                const ratioDisplay = ratioValue > 0 ? `1:${ratioValue.toFixed(1)}` : '-';
                
                // Strategy icons mapping
                const getStrategyIcon = (strategy: string) => {
                  switch(strategy) {
                    case 'MOMENTUM':
                    case 'MOMENTUM_TREND':
                    case 'MOMENTUM_ASYM':
                      return <Zap className="w-4 h-4 text-yellow-500" />;
                    case 'BUFFETT':
                      return <Shield className="w-4 h-4 text-blue-500" />;
                    case 'TVEITEREID':
                      return <TrendingUp className="w-4 h-4 text-green-500" />;
                    case 'REBOUND':
                      return <ArrowUpCircle className="w-4 h-4 text-purple-500" />;
                    case 'INSIDER':
                      return <Users className="w-4 h-4 text-orange-500" />;
                    default:
                      return null;
                  }
                };

                return (
                  <div
                    key={stock.ticker}
                    className="grid grid-cols-[2.5rem,1fr,1fr,0.8fr,0.5fr,1.4fr,1.4fr,0.7fr,0.8fr,0.5fr,0.5fr] px-6 py-4 hover:bg-muted transition-colors group"
                  >
                    {/* Ranking */}
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-muted-foreground">
                        {rank}
                      </span>
                    </div>

                    {/* Ticker */}
                    <Link href={`/analyse/${stock.ticker}`} className="flex flex-col justify-center min-w-0">
                      <div className="text-sm font-bold text-foreground group-hover:text-brand-emerald transition-colors truncate">
                        {tickerShort}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{stock.name}</div>
                    </Link>

                    {/* Price */}
                    <div className="flex flex-col justify-center">
                      <div className="text-sm font-bold text-foreground">
                        {stock.price.toFixed(2)}
                      </div>
                      <div className={clsx('text-[10px] font-semibold', priceChangeColor)}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span className={clsx(config.className, 'text-[10px] px-1.5 py-0.5')}>
                        {config.label}
                      </span>
                    </div>

                    {/* RSI */}
                    <div className="flex items-center -ml-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {stock.rsi.toFixed(0)}
                      </span>
                    </div>

                    {/* K-Score with number in front of bar */}
                    <div className="flex items-center gap-2 -ml-2">
                      <span className="text-sm font-bold text-brand-emerald w-7">
                        {stock.kScore}
                      </span>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className={clsx('h-full rounded-full', kScoreColor)}
                          style={{ width: `${stock.kScore}%` }}
                        />
                      </div>
                    </div>

                    {/* R/R with kr above, graph in middle, % below */}
                    <div className="flex flex-col pl-10">
                      {/* Gevinst kr | Ratio | Risiko kr - above */}
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-brand-emerald font-semibold">+{stock.gainKr.toFixed(0)}kr</span>
                        <span className={clsx(
                          'font-bold',
                          ratioValue >= 2 ? 'text-brand-emerald' : 
                          ratioValue >= 1 ? 'text-yellow-500' : 'text-muted-foreground'
                        )}>
                          {ratioDisplay}
                        </span>
                        <span className="text-brand-rose font-semibold">-{stock.riskKr.toFixed(0)}kr</span>
                      </div>
                      {/* R/R bar */}
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex mt-0.5">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ width: `${(ratioValue / (1 + ratioValue)) * 100}%` }}
                        />
                        <div 
                          className="h-full bg-rose-400"
                          style={{ width: `${(1 / (1 + ratioValue)) * 100}%` }}
                        />
                      </div>
                      {/* Gevinst % | Risiko % - below */}
                      <div className="flex items-center justify-between text-[10px] mt-0.5">
                        <span className="text-brand-emerald font-semibold">+{stock.gainPercent.toFixed(0)}%</span>
                        <span className="text-brand-rose font-semibold">-{stock.riskPercent.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Tid */}
                    <div className="flex items-center pl-6">
                      <span className="text-sm font-medium text-muted-foreground">
                        {stock.timeHorizon}
                      </span>
                    </div>

                    {/* Strategi */}
                    <div className="flex items-center gap-1">
                      {stock.strategies.slice(0, 3).map((strategy, i) => (
                        <span key={i} title={strategy}>
                          {getStrategyIcon(strategy)}
                        </span>
                      ))}
                      {stock.strategies.length > 3 && (
                        <span className="text-[10px] text-muted-foreground">+{stock.strategies.length - 3}</span>
                      )}
                    </div>
                    
                    {/* Notat */}
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setNoteModalTicker(stock.ticker);
                          }}
                          onMouseEnter={() => notes.length > 0 && setHoveredNoteTicker(stock.ticker)}
                          onMouseLeave={() => setHoveredNoteTicker(null)}
                          className={clsx(
                            'p-1 rounded transition-colors relative',
                            notes.length > 0 
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                              : 'text-gray-300 hover:text-gray-400'
                          )}
                          title={notes.length > 0 ? `${notes.length} notat(er)` : 'Legg til notat'}
                        >
                          {notes.length > 0 ? (
                            <StickyNote className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {notes.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-500 text-white text-[8px] rounded-full flex items-center justify-center">
                              {notes.length}
                            </span>
                          )}
                        </button>
                        
                        {/* Note tooltip */}
                        {hoveredNoteTicker === stock.ticker && notes.length > 0 && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 bg-yellow-50 border border-yellow-200 rounded-sm shadow-md p-2 pointer-events-none">
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {notes.slice(0, 2).map(note => (
                                <p key={note.id} className="text-[10px] text-gray-700 line-clamp-2">{note.note}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-end gap-1">
                      {strategyFilter === 'MINE' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveFromMine(stock.ticker);
                          }}
                          className="p-1 text-muted-foreground hover:text-brand-rose transition-colors"
                          title="Fjern fra Mine"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <Link href={`/analyse/${stock.ticker}`}>
                        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-brand-emerald transition-colors" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Viser {watchlistStocks.length} aksjer
          </div>
        </div>
      )}

      {/* Note Modal - Enhanced with tags, reminder, alerts */}
      {noteModalTicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={resetNoteForm}>
          <div className="bg-card rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingNote ? 'Rediger notat' : 'Nytt notat'} - {noteModalTicker.replace('.OL', '')}
                </h3>
              </div>
              <button onClick={resetNoteForm} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Note text */}
              <div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Skriv ditt notat her..."
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald resize-none"
                  rows={4}
                  autoFocus
                />
              </div>
              
              {/* Tags */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map(tag => (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => toggleNoteTag(tag.value)}
                      className={clsx(
                        'px-3 py-1 rounded-full text-sm font-medium transition-all',
                        noteTags.includes(tag.value) ? tag.color : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Reminder & Alert */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={noteReminder}
                    onChange={(e) => setNoteReminder(e.target.value)}
                    className="text-sm border border-border bg-background text-foreground rounded-lg px-2 py-1"
                  />
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noteAlert}
                    onChange={(e) => setNoteAlert(e.target.checked)}
                    className="rounded border-border text-brand-emerald focus:ring-brand-emerald"
                  />
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Varsle meg</span>
                </label>
              </div>
              
              {/* Existing notes for this stock */}
              {stockNotes[noteModalTicker] && stockNotes[noteModalTicker].length > 0 && !editingNote && (
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-medium text-foreground mb-2">Eksisterende notater</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stockNotes[noteModalTicker].map(note => (
                      <div key={note.id} className="bg-muted rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex flex-wrap gap-1">
                            {note.tags?.map(tag => {
                              const tagConfig = TAG_OPTIONS.find(t => t.value === tag);
                              return (
                                <span key={tag} className={clsx('text-xs px-2 py-0.5 rounded-full', tagConfig?.color)}>
                                  {tagConfig?.label}
                                </span>
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openNoteForEdit(note)}
                              className="p-1 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleDeleteNote(note.id, noteModalTicker)}
                              className="p-1 text-muted-foreground hover:text-brand-rose"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-foreground">{note.note}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{new Date(note.createdAt).toLocaleDateString('nb-NO')}</span>
                          {note.reminder && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(note.reminder).toLocaleDateString('nb-NO')}
                            </span>
                          )}
                          {note.alertEnabled && <Bell className="w-3 h-3 text-amber-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={resetNoteForm}
                className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg"
              >
                Avbryt
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteText.trim()}
                className="px-4 py-2 text-sm font-semibold bg-brand-emerald text-white rounded-lg hover:bg-brand-emerald/90 disabled:opacity-50"
              >
                {editingNote ? 'Oppdater' : 'Lagre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
