'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Briefcase, TrendingUp, Target, Trash2, Edit, RefreshCw, X, Settings, Upload, StickyNote, Archive, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'custom';
import AddTradeModal from '@/components/AddTradeModal';
import BulkImportModal from '@/components/BulkImportModal';
import { 
  getPortfolios, 
  getActiveTrades, 
  getTrades,
  updateTrade,
  deleteTrade,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  initializeLocalStore,
  getTotalDividends,
  getDividendSummary,
  type Portfolio, 
  type Trade,
  type DividendSummary
} from '@/lib/store';
import { STRATEGIES, StrategyId, getAllStrategies } from '@/lib/strategies';

interface LiveQuote {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  previousClose: number;
}

export default function PorteføljePage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | 'all' | 'closed'>('all'); // 'all' = alle porteføljer, 'closed' = alle lukkede
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [liveQuotes, setLiveQuotes] = useState<Record<string, LiveQuote | null>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [displayMode, setDisplayMode] = useState<'kr' | 'percent'>('percent'); // Toggle mellom kr og %
  const [selectedStrategies, setSelectedStrategies] = useState<StrategyId[]>([]); // Tom = alle
  const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [totalDividends, setTotalDividends] = useState(0);
  const [dividendSummary, setDividendSummary] = useState<DividendSummary[]>([]);
  
  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newPortfolioData, setNewPortfolioData] = useState({
    name: '',
    description: '',
    strategyId: '' as StrategyId | '',
    isCustom: true, // Om brukeren vil ha custom navn eller følge strategi
  });

  // Hent live kurser - lagrer til localStorage for helgen
  const fetchLiveQuotes = useCallback(async (tickers: string[]) => {
    if (tickers.length === 0) return;
    
    setQuotesLoading(true);
    try {
      const response = await fetch(`/api/quotes?tickers=${tickers.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setLiveQuotes(data);
        setLastUpdated(new Date());
        
        // Lagre til localStorage for helgen
        localStorage.setItem('lastQuotes', JSON.stringify({
          quotes: data,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Error fetching live quotes:', error);
      
      // Prøv å laste fra localStorage hvis API feiler (f.eks. i helgen)
      const cached = localStorage.getItem('lastQuotes');
      if (cached) {
        const { quotes, timestamp } = JSON.parse(cached);
        setLiveQuotes(quotes);
        setLastUpdated(new Date(timestamp));
        console.log('📦 Loaded quotes from localStorage (cached from', timestamp, ')');
      }
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  // Last inn data fra localStorage
  const loadData = useCallback(() => {
    initializeLocalStore();
    const loadedPortfolios = getPortfolios();
    setPortfolios(loadedPortfolios);
    setIsLoading(false);
    
    // Hent utbytte-data
    setTotalDividends(getTotalDividends());
    setDividendSummary(getDividendSummary());
    
    // Last inn cached quotes først (viktig for helgen)
    const cached = localStorage.getItem('lastQuotes');
    if (cached) {
      try {
        const { quotes, timestamp } = JSON.parse(cached);
        setLiveQuotes(quotes);
        setLastUpdated(new Date(timestamp));
        console.log('📦 Loaded cached quotes from', timestamp);
      } catch (e) {
        console.error('Failed to parse cached quotes:', e);
      }
    }
    
    // Hent live kurser for aktive trades
    const allActiveTrades = loadedPortfolios.flatMap(p => p.trades.filter(t => t.status === 'ACTIVE'));
    const uniqueTickers = Array.from(new Set(allActiveTrades.map(t => t.ticker)));
    if (uniqueTickers.length > 0) {
      fetchLiveQuotes(uniqueTickers);
    }
    
    return loadedPortfolios;
  }, [fetchLiveQuotes]);

  // Initial load
  useEffect(() => {
    loadData();
    // Default til "Alle porteføljer"
    setSelectedPortfolioId('all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Oppdater kurser hvert 5. minutt
  useEffect(() => {
    const activeTickers = portfolios
      .flatMap(p => p.trades.filter(t => t.status === 'ACTIVE'))
      .map(t => t.ticker);
    const uniqueTickers = Array.from(new Set(activeTickers));
    
    if (uniqueTickers.length > 0) {
      const interval = setInterval(() => {
        fetchLiveQuotes(uniqueTickers);
      }, 5 * 60 * 1000); // 5 minutter
      
      return () => clearInterval(interval);
    }
  }, [portfolios, fetchLiveQuotes]);

  // Manuell refresh
  const handleRefreshQuotes = () => {
    const activeTickers = portfolios
      .flatMap(p => p.trades.filter(t => t.status === 'ACTIVE'))
      .map(t => t.ticker);
    const uniqueTickers = Array.from(new Set(activeTickers));
    fetchLiveQuotes(uniqueTickers);
  };

  // Date filter helper function
  const getDateFilterRange = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateFilter) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { start: weekAgo, end: now };
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return { start: monthAgo, end: now };
      case 'custom':
        return {
          start: customDateStart ? new Date(customDateStart) : new Date(0),
          end: customDateEnd ? new Date(customDateEnd + 'T23:59:59') : now,
        };
      default:
        return null;
    }
  }, [dateFilter, customDateStart, customDateEnd]);

  const isTradeInDateRange = useCallback((trade: Trade, useExitDate: boolean = false) => {
    if (!getDateFilterRange) return true;
    
    const dateToCheck = useExitDate && trade.exitDate 
      ? new Date(trade.exitDate) 
      : new Date(trade.entryDate);
    
    return dateToCheck >= getDateFilterRange.start && dateToCheck <= getDateFilterRange.end;
  }, [getDateFilterRange]);

  // Hent trades basert på valgt portefølje eller alle
  const selectedPortfolio = useMemo(() => {
    if (selectedPortfolioId === 'all' || selectedPortfolioId === 'closed') return null;
    return portfolios.find(p => p.id === selectedPortfolioId);
  }, [selectedPortfolioId, portfolios]);
  
  // Alle lukkede trades (for "Lukkede" tab)
  const allClosedTrades = useMemo(() => 
    portfolios.flatMap(p => p.trades.filter(t => t.status !== 'ACTIVE')),
    [portfolios]
  );
  
  const allActiveTrades = useMemo(() => {
    if (selectedPortfolioId === 'closed') return [];
    if (selectedPortfolioId === 'all') {
      return portfolios.flatMap(p => p.trades.filter(t => t.status === 'ACTIVE'));
    }
    return selectedPortfolio?.trades.filter(t => t.status === 'ACTIVE') || [];
  }, [selectedPortfolioId, portfolios, selectedPortfolio]);
  
  const closedTrades = useMemo(() => {
    if (selectedPortfolioId === 'closed') return allClosedTrades;
    if (selectedPortfolioId === 'all') {
      return portfolios.flatMap(p => p.trades.filter(t => t.status !== 'ACTIVE'));
    }
    return selectedPortfolio?.trades.filter(t => t.status !== 'ACTIVE') || [];
  }, [selectedPortfolioId, portfolios, selectedPortfolio, allClosedTrades]);
  
  // Filtrer trades basert på valgte strategier og dato
  const activeTrades = useMemo(() => {
    let trades = allActiveTrades;
    if (selectedStrategies.length > 0) {
      trades = trades.filter(t => selectedStrategies.includes(t.strategyId));
    }
    // Apply date filter to entry date
    trades = trades.filter(t => isTradeInDateRange(t, false));
    return trades;
  }, [allActiveTrades, selectedStrategies, isTradeInDateRange]);
  
  const filteredClosedTrades = useMemo(() => {
    let trades = closedTrades;
    if (selectedStrategies.length > 0) {
      trades = trades.filter(t => selectedStrategies.includes(t.strategyId));
    }
    // Apply date filter to exit date for closed trades
    trades = trades.filter(t => isTradeInDateRange(t, true));
    return trades;
  }, [closedTrades, selectedStrategies, isTradeInDateRange]);
  
  // Finn alle unike strategier fra BÅDE aktive og lukkede trades
  const allTrades = [...allActiveTrades, ...closedTrades];
  const uniqueStrategies = Array.from(new Set(allTrades.map(t => t.strategyId).filter(Boolean))) as StrategyId[];
  
  // Toggle strategi-filter
  const toggleStrategy = (strategyId: StrategyId) => {
    setSelectedStrategies(prev => 
      prev.includes(strategyId) 
        ? prev.filter(s => s !== strategyId)
        : [...prev, strategyId]
    );
  };
  
  // Beregn totaler per strategi (aktive + lukkede)
  const strategyTotals = uniqueStrategies.map(strategyId => {
    const activeStrategyTrades = allActiveTrades.filter(t => t.strategyId === strategyId);
    const closedStrategyTrades = closedTrades.filter(t => t.strategyId === strategyId);
    
    // Aktive trades - urealisert P/L
    const invested = activeStrategyTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
    const currentValue = activeStrategyTrades.reduce((sum, t) => {
      const quote = liveQuotes[t.ticker];
      const price = quote?.price || t.currentPrice || t.entryPrice;
      return sum + (price * t.quantity);
    }, 0);
    const unrealizedPnl = currentValue - invested;
    const unrealizedPnlPercent = invested > 0 ? (unrealizedPnl / invested) * 100 : 0;
    
    // Lukkede trades - realisert P/L
    const realizedPnl = closedStrategyTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
    
    // Total P/L (inkludert lukkede)
    const totalPnl = unrealizedPnl + realizedPnl;
    const totalInvested = invested + closedStrategyTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
    const pnlPercent = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
    
    return {
      strategyId,
      strategy: STRATEGIES[strategyId],
      activeCount: activeStrategyTrades.length,
      closedCount: closedStrategyTrades.length,
      tradeCount: activeStrategyTrades.length + closedStrategyTrades.length,
      invested,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPercent, // Kun aktive trades
      realizedPnl,
      pnl: totalPnl,
      pnlPercent // Inkluderer lukkede trades
    };
  });
  
  // Grand total - bruker FILTRERTE trades (basert på valgte strategier)
  const totalRealizedPnl = filteredClosedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const grandTotal = {
    activeCount: activeTrades.length,
    closedCount: filteredClosedTrades.length,
    tradeCount: activeTrades.length + filteredClosedTrades.length,
    invested: activeTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0),
    currentValue: activeTrades.reduce((sum, t) => {
      const quote = liveQuotes[t.ticker];
      const price = quote?.price || t.currentPrice || t.entryPrice;
      return sum + (price * t.quantity);
    }, 0),
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    realizedPnl: totalRealizedPnl,
    pnl: 0,
    pnlPercent: 0
  };
  grandTotal.unrealizedPnl = grandTotal.currentValue - grandTotal.invested;
  grandTotal.unrealizedPnlPercent = grandTotal.invested > 0 ? (grandTotal.unrealizedPnl / grandTotal.invested) * 100 : 0;
  grandTotal.pnl = grandTotal.unrealizedPnl + grandTotal.realizedPnl;
  const totalInvestedAll = grandTotal.invested + filteredClosedTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
  grandTotal.pnlPercent = totalInvestedAll > 0 ? (grandTotal.pnl / totalInvestedAll) * 100 : 0;

  // Beregn statistikk
  const totalInvested = activeTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0).length;
  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

  const handleCloseTrade = (tradeId: string, exitPrice: number, exitDate?: Date) => {
    updateTrade({
      id: tradeId,
      status: 'CLOSED',
      exitPrice,
      exitDate: exitDate || new Date(),
      exitReason: 'MANUAL',
    });
    loadData();
  };

  // State for lukke-trade dialog
  const [closingTrade, setClosingTrade] = useState<Trade | null>(null);
  const [closeTradeData, setCloseTradeData] = useState({
    exitPrice: '',
    exitDate: new Date().toISOString().split('T')[0],
  });

  const handleDeleteTrade = (tradeId: string) => {
    if (confirm('Er du sikker på at du vil slette denne traden?')) {
      deleteTrade(tradeId);
      loadData();
    }
  };

  // Portfolio management
  const handleCreatePortfolio = () => {
    if (!newPortfolioData.name.trim()) return;
    
    const strategyId = newPortfolioData.strategyId || undefined;
    const strategy = strategyId ? STRATEGIES[strategyId] : null;
    
    createPortfolio({
      name: newPortfolioData.name,
      description: newPortfolioData.description || strategy?.description,
      strategyId: strategyId as StrategyId | undefined,
      allowedStrategies: strategyId ? [strategyId as StrategyId] : Object.keys(STRATEGIES) as StrategyId[],
    });
    
    setNewPortfolioData({ name: '', description: '', strategyId: '', isCustom: true });
    setIsCreatePortfolioModalOpen(false);
    loadData();
  };

  const handleUpdatePortfolio = () => {
    if (!editingPortfolio || !newPortfolioData.name.trim()) return;
    
    updatePortfolio(editingPortfolio.id, {
      name: newPortfolioData.name,
      description: newPortfolioData.description,
      strategyId: newPortfolioData.strategyId as StrategyId | undefined,
    });
    
    setEditingPortfolio(null);
    setNewPortfolioData({ name: '', description: '', strategyId: '', isCustom: true });
    loadData();
  };

  const handleDeletePortfolio = (id: string, name: string) => {
    const portfolio = portfolios.find(p => p.id === id);
    const tradesCount = portfolio?.trades.length || 0;
    
    const message = tradesCount > 0 
      ? `Er du sikker på at du vil slette porteføljen "${name}"?\n\n${tradesCount} trades vil bli flyttet til "Blandet Portefølje".`
      : `Er du sikker på at du vil slette den tomme porteføljen "${name}"?`;
    
    if (confirm(message)) {
      // Flytt trades til Blandet portefølje hvis det finnes noen
      if (tradesCount > 0 && portfolio) {
        const blandetPortfolio = portfolios.find(p => p.id === 'portfolio-mixed');
        if (blandetPortfolio) {
          portfolio.trades.forEach(trade => {
            updateTrade({
              id: trade.id,
              portfolioId: 'portfolio-mixed',
            });
          });
        }
      }
      
      deletePortfolio(id);
      setSelectedPortfolioId('all');
      loadData();
    }
  };

  const openEditPortfolio = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setNewPortfolioData({
      name: portfolio.name,
      description: portfolio.description || '',
      strategyId: portfolio.strategyId || '',
      isCustom: true,
    });
  };

  // Alle strategier for valg (inkludert disabled for manuell bruk)
  const allStrategies = getAllStrategies();

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-emerald border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Portefølje
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Administrer dine trades og porteføljer
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsBulkImportModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline">Bulk Import</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-emerald text-white font-bold rounded-xl hover:bg-brand-emerald/90 transition-colors shadow-lg shadow-brand-emerald/25"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Ny Trade</span>
          </button>
        </div>
      </div>

      {/* Portfolio Tabs - Kompakt pill-design */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Alle porteføljer */}
        <button
          onClick={() => setSelectedPortfolioId('all')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
            selectedPortfolioId === 'all' 
              ? 'bg-brand-slate text-white shadow-md' 
              : 'bg-card border border-border text-muted-foreground hover:border-border/80'
          )}
        >
          <span>📊 Alle</span>
          <span className={clsx(
            'text-xs',
            selectedPortfolioId === 'all' ? 'text-white/70' : 'text-gray-400'
          )}>
            {portfolios.reduce((sum, p) => sum + p.trades.length, 0)}
          </span>
        </button>
        
        {/* Separator */}
        <div className="w-px h-5 bg-border mx-1"></div>
        
        {/* Individuelle porteføljer */}
        {portfolios.map(portfolio => {
          const strategy = portfolio.strategyId ? STRATEGIES[portfolio.strategyId] : null;
          const isSelected = portfolio.id === selectedPortfolioId;
          const activeCount = portfolio.trades.filter(t => t.status === 'ACTIVE').length;
          
          return (
            <div key={portfolio.id} className="relative group">
              <button
                onClick={() => setSelectedPortfolioId(portfolio.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
                  isSelected 
                    ? 'bg-brand-slate text-white shadow-md' 
                    : 'bg-card border border-border text-muted-foreground hover:border-border/80'
                )}
              >
                <span>{strategy?.emoji || '📁'} {portfolio.name}</span>
                <span className={clsx(
                  'text-xs',
                  isSelected ? 'text-white/70' : 'text-muted-foreground'
                )}>
                  {activeCount}
                </span>
              </button>
              {/* Edit/Delete - vises ved hover */}
              <div className="absolute -top-1 -right-1 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); openEditPortfolio(portfolio); }}
                  className="p-0.5 bg-card rounded-full shadow border border-border text-muted-foreground hover:text-brand-emerald"
                  title="Rediger"
                >
                  <Settings className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeletePortfolio(portfolio.id, portfolio.name); }}
                  className="p-0.5 bg-card rounded-full shadow border border-border text-muted-foreground hover:text-brand-rose"
                  title="Slett"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        
        {/* Separator før Lukkede */}
        <div className="w-px h-5 bg-border mx-1"></div>
        
        {/* Lukkede trades tab */}
        <button
          onClick={() => setSelectedPortfolioId('closed')}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all',
            selectedPortfolioId === 'closed' 
              ? 'bg-gray-600 text-white shadow-md' 
              : 'bg-card border border-border text-muted-foreground hover:border-border/80'
          )}
        >
          <Archive className="w-4 h-4" />
          <span>Lukkede</span>
          <span className={clsx(
            'text-xs',
            selectedPortfolioId === 'closed' ? 'text-white/70' : 'text-gray-400'
          )}>
            {allClosedTrades.length}
          </span>
        </button>
        
        {/* Ny portefølje knapp */}
        <button
          onClick={() => setIsCreatePortfolioModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm text-muted-foreground hover:text-brand-emerald hover:bg-muted transition-all"
          title="Ny portefølje"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Aktive Trades</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{activeTrades.length}</div>
        </div>
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Investert</div>
          <div className="text-xl sm:text-3xl font-extrabold text-foreground">
            {totalInvested.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Realisert P/L</div>
          <div className={clsx(
            'text-xl sm:text-3xl font-extrabold',
            totalPnL >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
          )}>
            {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 sm:p-5 border border-blue-200/50">
          <div className="text-xs sm:text-sm text-blue-600 mb-1">💰 Utbytte</div>
          <div className="text-xl sm:text-3xl font-extrabold text-blue-700 dark:text-blue-400">
            +{totalDividends.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
          </div>
        </div>
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
          <div className="text-xs sm:text-sm text-muted-foreground mb-1">Win Rate</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {winRate.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Date Filter Bar - Visible when not on closed tab */}
      {selectedPortfolioId !== 'closed' && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">Periode:</span>
            <div className="relative date-picker-container">
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => { setDateFilter('all'); setShowDatePicker(false); }}
                  className={clsx(
                    'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                    dateFilter === 'all' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Alle
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('today'); setShowDatePicker(false); }}
                  className={clsx(
                    'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                    dateFilter === 'today' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  I dag
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('week'); setShowDatePicker(false); }}
                  className={clsx(
                    'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                    dateFilter === 'week' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Uke
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('month'); setShowDatePicker(false); }}
                  className={clsx(
                    'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                    dateFilter === 'month' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Måned
                </button>
                <button
                  type="button"
                  onClick={() => { setDateFilter('custom'); setShowDatePicker(true); }}
                  className={clsx(
                    'px-2 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1',
                    dateFilter === 'custom' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Calendar className="w-3 h-3" />
                </button>
              </div>
              
              {/* Custom date picker dropdown */}
              {showDatePicker && dateFilter === 'custom' && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[220px]">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Fra</label>
                      <input
                        type="date"
                        value={customDateStart}
                        onChange={(e) => setCustomDateStart(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Til</label>
                      <input
                        type="date"
                        value={customDateEnd}
                        onChange={(e) => setCustomDateEnd(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      className="w-full mt-2 px-3 py-1.5 text-xs font-semibold bg-brand-emerald text-white rounded-lg hover:bg-brand-emerald/90 transition-colors"
                    >
                      Bruk
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {dateFilter !== 'all' && (
            <span className="text-xs text-muted-foreground">
              Filtrerer på {dateFilter === 'today' ? 'i dag' : dateFilter === 'week' ? 'siste uke' : dateFilter === 'month' ? 'siste måned' : 'egendefinert periode'}
            </span>
          )}
        </div>
      )}

      {/* Active Trades - hide when viewing closed trades tab */}
      {selectedPortfolioId !== 'closed' && activeTrades.length > 0 ? (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-emerald" />
              Aktive Trades
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Strategi-filter */}
              {uniqueStrategies.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedStrategies([])}
                    className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                      selectedStrategies.length === 0 
                        ? 'bg-brand-slate text-white' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    Alle
                  </button>
                  {uniqueStrategies.map(strategyId => {
                    const strategy = STRATEGIES[strategyId];
                    const isSelected = selectedStrategies.includes(strategyId);
                    return (
                      <button
                        key={strategyId}
                        onClick={() => toggleStrategy(strategyId)}
                        className={clsx(
                          'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                          isSelected 
                            ? 'text-white shadow-sm' 
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        )}
                        style={isSelected ? { backgroundColor: strategy.color } : {}}
                        title={strategy.name}
                      >
                        {strategy.emoji} {strategy.shortName}
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Toggle kr/% */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setDisplayMode('percent')}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    displayMode === 'percent' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  %
                </button>
                <button
                  onClick={() => setDisplayMode('kr')}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    displayMode === 'kr' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Kr
                </button>
              </div>
              
              {lastUpdated && (
                <span className="text-xs text-muted-foreground">
                  {lastUpdated.toLocaleTimeString('nb-NO')}
                </span>
              )}
              <button
                onClick={handleRefreshQuotes}
                disabled={quotesLoading}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                  quotesLoading 
                    ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                )}
              >
                <RefreshCw className={clsx('w-3.5 h-3.5', quotesLoading && 'animate-spin')} />
                {quotesLoading ? '...' : 'Oppdater'}
              </button>
            </div>
          </div>
          
          {/* Separate tabeller per strategi */}
          <div className="space-y-6">
            {(selectedStrategies.length === 0 ? uniqueStrategies : selectedStrategies).map(strategyId => {
              const strategyActiveTrades = activeTrades.filter(t => t.strategyId === strategyId);
              const strategyClosedTrades = filteredClosedTrades.filter(t => t.strategyId === strategyId);
              
              // Skip hvis ingen relevante trades
              // På spesifikk portefølje: vis hvis det finnes lukkede trades (selv uten aktive)
              // På "Alle": vis kun hvis det finnes aktive trades
              if (selectedPortfolioId === 'all') {
                if (strategyActiveTrades.length === 0) return null;
              } else {
                if (strategyActiveTrades.length === 0 && strategyClosedTrades.length === 0) return null;
              }
              
              // Hvis ingen aktive men har lukkede - vis kun lukkede trades seksjonen
              const hasOnlyClosedTrades = strategyActiveTrades.length === 0 && strategyClosedTrades.length > 0;
              
              const strategyInfo = strategyTotals.find(s => s.strategyId === strategyId);
              const strategy = STRATEGIES[strategyId];
              
              return (
                <div key={strategyId}>
                  {/* Strategi-header */}
                  {uniqueStrategies.length > 1 && (
                    <div className="px-1 py-2 flex items-center gap-2">
                      <span 
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold"
                        style={{ backgroundColor: `${strategy?.color}15`, color: strategy?.color }}
                      >
                        {strategy?.emoji} {strategy?.name}
                      </span>
                      <span className="text-sm text-gray-400">
                        ({strategyActiveTrades.length} aktive{strategyClosedTrades.length > 0 && selectedPortfolioId !== 'all' ? `, ${strategyClosedTrades.length} lukket` : ''})
                      </span>
                    </div>
                  )}
                  
                  {/* Aktive trades tabell - vises kun hvis det finnes aktive trades */}
                  {!hasOnlyClosedTrades && (
                  <div className="bg-card rounded-2xl border border-border overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <colgroup>
                      <col className="w-[12%]" />
                      <col className="w-[12%]" />
                      <col className="w-[7%]" />
                      <col className="w-[10%]" />
                      <col className="w-[20%]" />
                      <col className="w-[8%]" />
                      <col className="w-[10%]" />
                      <col className="w-[8%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead className="bg-card dark:bg-[hsl(var(--table-header-bg))] border-b border-border">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Ticker</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Strategi</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Antall</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Inngang</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Live Status</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase">I dag</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground uppercase">P/L</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Tid</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase">Aksjon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {/* KUN AKTIVE TRADES */}
                      {strategyActiveTrades.map(trade => {
                        const tradeStrategy = STRATEGIES[trade.strategyId];
                        const daysHeld = Math.floor((Date.now() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24));
                        
                        const liveQuote = liveQuotes[trade.ticker];
                        const currentPrice = liveQuote?.price || trade.currentPrice || trade.entryPrice;
                        const hasLivePrice = !!liveQuote?.price;
                        
                        const pnl = (currentPrice - trade.entryPrice) * trade.quantity;
                        const pnlPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
                        const isProfit = pnl >= 0;
                        
                        const totalRange = trade.target - trade.stopLoss;
                        const currentProgress = currentPrice - trade.stopLoss;
                        const progressPercent = Math.max(0, Math.min(100, (currentProgress / totalRange) * 100));
                        const isAboveTarget = currentPrice > trade.target;
                        const isNearStop = currentPrice < trade.entryPrice && currentPrice < trade.stopLoss * 1.05;
                        const isNearTarget = currentPrice > trade.target * 0.95;
                        
                        return (
                          <tr key={trade.id} className="hover:bg-muted transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-foreground">{trade.ticker}</span>
                                {trade.notes && (
                                  <div className="relative group/note">
                                    <span className="text-amber-500 cursor-help">
                                      <StickyNote className="w-3.5 h-3.5" />
                                    </span>
                                    <div className="absolute left-0 top-5 z-50 w-52 px-2 py-1.5 bg-yellow-50 rounded-sm shadow-md opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all duration-150 pointer-events-none border border-yellow-200">
                                      <p className="text-xs text-gray-700">{trade.notes}</p>
                                      <div className="absolute -top-1 left-2 w-2 h-2 bg-yellow-50 border-l border-t border-yellow-200 rotate-45" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              {trade.name && <div className="text-xs text-muted-foreground">{trade.name}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span 
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                                style={{ backgroundColor: `${tradeStrategy?.color}20`, color: tradeStrategy?.color }}
                              >
                                {tradeStrategy?.emoji} {tradeStrategy?.shortName || trade.strategyId}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-foreground">{trade.quantity}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="font-semibold text-foreground">{trade.entryPrice.toFixed(2)} kr</div>
                              <div className="text-xs text-muted-foreground">{new Date(trade.entryDate).toLocaleDateString('nb-NO')}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="min-w-[160px]">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-1.5">
                                    {hasLivePrice ? (
                                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                                    )}
                                    <span className="text-sm font-bold text-foreground">{currentPrice.toFixed(2)}</span>
                                  </div>
                                  <div className="text-right text-xs">
                                    {isAboveTarget ? (
                                      <span className="font-bold text-brand-emerald">✓ Over mål!</span>
                                    ) : (
                                      <span className="text-brand-emerald font-medium">
                                        {displayMode === 'percent' 
                                          ? `${((trade.target - currentPrice) / currentPrice * 100).toFixed(1)}%`
                                          : `${(trade.target - currentPrice).toFixed(0)} kr`
                                        } til mål
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="relative">
                                    <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                                    <div className="absolute left-0 top-0 h-full bg-brand-rose/20" style={{ width: `${((trade.entryPrice - trade.stopLoss) / totalRange) * 100}%` }} />
                                    <div className="absolute top-0 h-full w-px bg-gray-400" style={{ left: `${((trade.entryPrice - trade.stopLoss) / totalRange) * 100}%` }} />
                                    <div className={clsx('h-full rounded-full transition-all', isAboveTarget ? 'bg-brand-emerald' : isNearTarget ? 'bg-brand-emerald/80' : isNearStop ? 'bg-brand-rose' : isProfit ? 'bg-blue-500' : 'bg-amber-500')} style={{ width: `${progressPercent}%` }} />
                                    <div className={clsx('absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white shadow', isProfit ? 'bg-brand-emerald' : 'bg-brand-rose')} style={{ left: `calc(${Math.max(2, Math.min(98, progressPercent))}% - 4px)` }} />
                                  </div>
                                  <div className="flex justify-between mt-0.5 text-[9px]">
                                    <span className="text-brand-rose">{trade.stopLoss.toFixed(0)}</span>
                                    <span className="text-muted-foreground">{trade.entryPrice.toFixed(0)}</span>
                                    <span className="text-brand-emerald">{trade.target.toFixed(0)}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            {/* I DAG - Daglig avkastning (respekterer displayMode) */}
                            <td className="px-4 py-3 text-right">
                              {liveQuote?.changePercent !== undefined ? (
                                displayMode === 'percent' ? (
                                  <div className="flex flex-col items-end">
                                    <div className={clsx(
                                      'font-bold text-sm',
                                      liveQuote.changePercent >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
                                    )}>
                                      {liveQuote.changePercent >= 0 ? '+' : ''}{liveQuote.changePercent.toFixed(2)}%
                                    </div>
                                    <div className={clsx(
                                      'text-xs',
                                      liveQuote.changePercent >= 0 ? 'text-brand-emerald/70' : 'text-brand-rose/70'
                                    )}>
                                      {liveQuote.change >= 0 ? '+' : ''}{liveQuote.change.toFixed(2)} kr
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-end">
                                    <div className={clsx(
                                      'font-bold text-sm',
                                      liveQuote.change >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
                                    )}>
                                      {liveQuote.change >= 0 ? '+' : ''}{liveQuote.change.toFixed(2)} kr
                                    </div>
                                    <div className={clsx(
                                      'text-xs',
                                      liveQuote.changePercent >= 0 ? 'text-brand-emerald/70' : 'text-brand-rose/70'
                                    )}>
                                      {liveQuote.changePercent >= 0 ? '+' : ''}{liveQuote.changePercent.toFixed(2)}%
                                    </div>
                                  </div>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            {/* P/L Total */}
                            <td className="px-4 py-3 text-right">
                              {displayMode === 'percent' ? (
                                <>
                                  <div className={clsx('font-bold', isProfit ? 'text-brand-emerald' : 'text-brand-rose')}>{isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%</div>
                                  <div className={clsx('text-xs', isProfit ? 'text-brand-emerald/70' : 'text-brand-rose/70')}>{isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</div>
                                </>
                              ) : (
                                <>
                                  <div className={clsx('font-bold', isProfit ? 'text-brand-emerald' : 'text-brand-rose')}>{isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</div>
                                  <div className={clsx('text-xs', isProfit ? 'text-brand-emerald/70' : 'text-brand-rose/70')}>{isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%</div>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="text-sm font-medium text-foreground">{daysHeld}d</div>
                              {trade.timeHorizonEnd && (() => {
                                const daysRemaining = Math.max(0, Math.ceil((new Date(trade.timeHorizonEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                                return <div className="text-[10px] text-muted-foreground">{daysRemaining}d igjen</div>;
                              })()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => { setEditingTrade(trade); setIsAddModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Rediger"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => { setClosingTrade(trade); setCloseTradeData({ exitPrice: currentPrice.toFixed(2), exitDate: new Date().toISOString().split('T')[0] }); }} className="p-1.5 text-brand-emerald hover:bg-brand-emerald/10 rounded-lg transition-colors" title="Lukk trade"><Target className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteTrade(trade.id)} className="p-1.5 text-brand-rose hover:bg-brand-rose/10 rounded-lg transition-colors" title="Slett"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    
                    {/* Subtotal for denne strategien */}
                    {strategyInfo && (
                      <tfoot className="bg-card dark:bg-[hsl(var(--subtotal-bg))] border-t border-border">
                        <tr>
                          <td className="px-4 py-3 text-left">
                            <span className="text-sm font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">
                              {strategy?.emoji} Subtotal:
                            </span>
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">{strategyInfo.activeCount}</span>
                            {strategyInfo.closedCount > 0 && selectedPortfolioId !== 'all' && (
                              <span className="text-xs text-muted-foreground dark:text-[hsl(var(--subtotal-text))]/70 ml-1">+{strategyInfo.closedCount}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">{strategyInfo.invested.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">{strategyInfo.currentValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</span>
                          </td>
                          <td className="px-4 py-3"></td>{/* I dag - tom for subtotal */}
                          <td className="px-4 py-3 text-right">
                            {(() => {
                              // Subtotal for aktive trades viser ALLTID kun urealisert P/L
                              const showPnl = strategyInfo.unrealizedPnl;
                              const showPnlPercent = strategyInfo.unrealizedPnlPercent;
                              const isPositive = showPnl >= 0;
                              
                              return displayMode === 'percent' ? (
                                <>
                                  <div className={clsx(
                                    'text-base font-bold',
                                    isPositive ? 'text-brand-emerald' : 'text-brand-rose'
                                  )}>
                                    {isPositive ? '+' : ''}{showPnlPercent.toFixed(1)}%
                                  </div>
                                  <div className={clsx(
                                    'text-xs',
                                    isPositive ? 'text-brand-emerald/70' : 'text-brand-rose/70'
                                  )}>
                                    {isPositive ? '+' : ''}{showPnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className={clsx(
                                    'text-base font-bold',
                                    isPositive ? 'text-brand-emerald' : 'text-brand-rose'
                                  )}>
                                    {isPositive ? '+' : ''}{showPnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                                  </div>
                                  <div className={clsx(
                                    'text-xs',
                                    isPositive ? 'text-brand-emerald/70' : 'text-brand-rose/70'
                                  )}>
                                    {isPositive ? '+' : ''}{showPnlPercent.toFixed(1)}%
                                  </div>
                                </>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3"></td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  </div>
                  )}
                  
                  {/* Lukkede Trades for denne strategien - egen tabell (kun når en spesifikk portefølje er valgt) */}
                  {strategyClosedTrades.length > 0 && selectedPortfolioId !== 'all' && (
                    <div className="mt-4 bg-white rounded-2xl border border-gray-100 overflow-x-auto">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">📦 Lukkede trades ({strategyClosedTrades.length})</span>
                      </div>
                      <table className="w-full min-w-[800px]">
                        <colgroup>
                          <col className="w-[14%]" />
                          <col className="w-[14%]" />
                          <col className="w-[8%]" />
                          <col className="w-[12%]" />
                          <col className="w-[22%]" />
                          <col className="w-[12%]" />
                          <col className="w-[8%]" />
                          <col className="w-[10%]" />
                        </colgroup>
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase">Ticker</th>
                            <th className="text-left px-4 py-2 text-xs font-bold text-gray-400 uppercase">Strategi</th>
                            <th className="text-right px-4 py-2 text-xs font-bold text-gray-400 uppercase">Antall</th>
                            <th className="text-right px-4 py-2 text-xs font-bold text-gray-400 uppercase">Inngang</th>
                            <th className="text-center px-4 py-2 text-xs font-bold text-gray-400 uppercase">Utgang</th>
                            <th className="text-right px-4 py-2 text-xs font-bold text-gray-400 uppercase">Resultat</th>
                            <th className="text-center px-4 py-2 text-xs font-bold text-gray-400 uppercase">Dager</th>
                            <th className="text-center px-4 py-2 text-xs font-bold text-gray-400 uppercase">Aksjon</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {strategyClosedTrades.map(trade => {
                            const tradeStrategy = STRATEGIES[trade.strategyId];
                            const daysHeld = trade.exitDate
                              ? Math.floor((new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24))
                              : Math.floor((Date.now() - new Date(trade.entryDate).getTime()) / (1000 * 60 * 60 * 24));
                            
                            const exitPrice = trade.exitPrice || trade.entryPrice;
                            const pnl = trade.realizedPnL || (exitPrice - trade.entryPrice) * trade.quantity;
                            const pnlPercent = trade.realizedPnLPercent || ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
                            const isProfit = pnl >= 0;
                            
                            return (
                              <tr key={trade.id} className="hover:bg-gray-50/70 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-gray-600">{trade.ticker}</span>
                                    {trade.notes && (
                                      <div className="relative group/note">
                                        <span className="text-amber-500 cursor-help">
                                          <StickyNote className="w-3.5 h-3.5" />
                                        </span>
                                        <div className="absolute left-0 top-5 z-50 w-52 px-2 py-1.5 bg-yellow-50 rounded-sm shadow-md opacity-0 invisible group-hover/note:opacity-100 group-hover/note:visible transition-all duration-150 pointer-events-none border border-yellow-200">
                                          <p className="text-xs text-gray-700">{trade.notes}</p>
                                          <div className="absolute -top-1 left-2 w-2 h-2 bg-yellow-50 border-l border-t border-yellow-200 rotate-45" />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {trade.name && <div className="text-xs text-muted-foreground">{trade.name}</div>}
                                </td>
                                <td className="px-4 py-3">
                                  <span 
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold opacity-60"
                                    style={{ backgroundColor: `${tradeStrategy?.color}20`, color: tradeStrategy?.color }}
                                  >
                                    {tradeStrategy?.emoji} {tradeStrategy?.shortName || trade.strategyId}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-600">{trade.quantity}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="text-gray-600">{trade.entryPrice.toFixed(2)} kr</div>
                                  <div className="text-xs text-gray-400">{new Date(trade.entryDate).toLocaleDateString('nb-NO')}</div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="text-gray-700 font-medium">→ {exitPrice.toFixed(2)} kr</div>
                                  <div className="text-xs text-gray-400">
                                    {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString('nb-NO') : '—'}
                                    {trade.exitReason && <span className="ml-1">({trade.exitReason})</span>}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {displayMode === 'percent' ? (
                                    <>
                                      <div className={clsx('font-bold', isProfit ? 'text-brand-emerald' : 'text-brand-rose')}>{isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%</div>
                                      <div className={clsx('text-xs', isProfit ? 'text-brand-emerald/70' : 'text-brand-rose/70')}>{isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</div>
                                    </>
                                  ) : (
                                    <>
                                      <div className={clsx('font-bold', isProfit ? 'text-brand-emerald' : 'text-brand-rose')}>{isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</div>
                                      <div className={clsx('text-xs', isProfit ? 'text-brand-emerald/70' : 'text-brand-rose/70')}>{isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%</div>
                                    </>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-500">{daysHeld}d</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => { setEditingTrade(trade); setIsAddModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Rediger"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteTrade(trade.id)} className="p-1.5 text-gray-400 hover:text-brand-rose hover:bg-brand-rose/10 rounded-lg transition-colors" title="Slett"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Subtotal for closed trades */}
                        {(() => {
                          const closedInvested = strategyClosedTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
                          const closedExitValue = strategyClosedTrades.reduce((sum, t) => sum + ((t.exitPrice || t.entryPrice) * t.quantity), 0);
                          const closedRealizedPnl = strategyClosedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
                          const closedPnlPercent = closedInvested > 0 ? (closedRealizedPnl / closedInvested) * 100 : 0;
                          const isClosedProfit = closedRealizedPnl >= 0;
                          
                          return (
                            <tfoot className="bg-card dark:bg-[hsl(var(--subtotal-bg))] border-t-2 border-border">
                              <tr>
                                <td className="px-4 py-3 font-bold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">📦 Subtotal:</td>
                                <td className="px-4 py-3"></td>
                                <td className="px-4 py-3 text-right font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">{strategyClosedTrades.length}</td>
                                <td className="px-4 py-3 text-right font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">{closedInvested.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</td>
                                <td className="px-4 py-3 text-center font-semibold text-card-foreground dark:text-[hsl(var(--subtotal-text))]">{closedExitValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</td>
                                <td className="px-4 py-3 text-right">
                                  <div className={clsx('font-bold', isClosedProfit ? 'text-brand-emerald' : 'text-brand-rose')}>
                                    {isClosedProfit ? '+' : ''}{closedPnlPercent.toFixed(1)}%
                                  </div>
                                  <div className={clsx('text-xs', isClosedProfit ? 'text-brand-emerald/70' : 'text-brand-rose/70')}>
                                    {isClosedProfit ? '+' : ''}{closedRealizedPnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                                  </div>
                                </td>
                                <td className="px-4 py-3"></td>
                                <td className="px-4 py-3"></td>
                              </tr>
                            </tfoot>
                          );
                        })()}
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Grand Total - Egen tabell */}
          <div className="mt-6 bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[7%]" />
                <col className="w-[10%]" />
                <col className="w-[20%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
                <col className="w-[10%]" />
              </colgroup>
              <tbody>
                <tr className="bg-card dark:bg-[hsl(var(--total-bg))]">
                  <td className="px-4 py-4 text-left">
                    <span className="font-bold text-card-foreground dark:text-[hsl(var(--total-text))]">Total:</span>
                  </td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-card-foreground dark:text-[hsl(var(--total-text))]">{grandTotal.activeCount}</span>
                    {grandTotal.closedCount > 0 && selectedPortfolioId !== 'all' && (
                      <span className="text-xs text-muted-foreground dark:text-[hsl(var(--total-text))]/70 ml-1">+{grandTotal.closedCount}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-card-foreground dark:text-[hsl(var(--total-text))]">{grandTotal.invested.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-card-foreground dark:text-[hsl(var(--total-text))]">{grandTotal.currentValue.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr</span>
                  </td>
                  <td className="px-4 py-4"></td>{/* I dag - tom for total */}
                  <td className="px-4 py-4 text-right">
                    {(() => {
                      // Grand Total viser ALLTID kun urealisert P/L (aktive trades)
                      const showPnl = grandTotal.unrealizedPnl;
                      const showPnlPercent = grandTotal.unrealizedPnlPercent;
                      const isPositive = showPnl >= 0;
                      
                      return displayMode === 'percent' ? (
                        <>
                          <div className={clsx(
                            'text-base font-bold',
                            isPositive ? 'text-brand-emerald' : 'text-brand-rose'
                          )}>
                            {isPositive ? '+' : ''}{showPnlPercent.toFixed(1)}%
                          </div>
                          <div className={clsx(
                            'text-xs',
                            isPositive ? 'text-brand-emerald/70' : 'text-brand-rose/70'
                          )}>
                            {isPositive ? '+' : ''}{showPnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={clsx(
                            'text-base font-bold',
                            isPositive ? 'text-brand-emerald' : 'text-brand-rose'
                          )}>
                            {isPositive ? '+' : ''}{showPnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                          </div>
                          <div className={clsx(
                            'text-xs',
                            isPositive ? 'text-brand-emerald/70' : 'text-brand-rose/70'
                          )}>
                            {isPositive ? '+' : ''}{showPnlPercent.toFixed(1)}%
                          </div>
                        </>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-4"></td>
                  <td className="px-4 py-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">Ingen aktive trades</h3>
          <p className="text-gray-500 mb-6">Start med å legge til din første trade</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-emerald text-white font-bold rounded-xl hover:bg-brand-emerald/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Legg til Trade
          </button>
        </div>
      )}
      </div>{/* End max-w-7xl container */}

      {/* Add/Edit Trade Modal */}
      <AddTradeModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTrade(null);
        }}
        onSuccess={loadData}
        editTrade={editingTrade}
      />

      {/* Closed Trades View - Shown when "Lukkede" tab is selected */}
      {selectedPortfolioId === 'closed' && (
        <div className="mb-8">
          {/* Date Filter for Closed Trades */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Periode:</span>
              <div className="relative date-picker-container">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => { setDateFilter('all'); setShowDatePicker(false); }}
                    className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                      dateFilter === 'all' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDateFilter('today'); setShowDatePicker(false); }}
                    className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                      dateFilter === 'today' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    I dag
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDateFilter('week'); setShowDatePicker(false); }}
                    className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                      dateFilter === 'week' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Uke
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDateFilter('month'); setShowDatePicker(false); }}
                    className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                      dateFilter === 'month' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Måned
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDateFilter('custom'); setShowDatePicker(true); }}
                    className={clsx(
                      'px-2 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1',
                      dateFilter === 'custom' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Calendar className="w-3 h-3" />
                  </button>
                </div>
                
                {showDatePicker && dateFilter === 'custom' && (
                  <div className="absolute top-full left-0 mt-2 p-3 bg-card border border-border rounded-xl shadow-lg z-50 min-w-[220px]">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Fra</label>
                        <input
                          type="date"
                          value={customDateStart}
                          onChange={(e) => setCustomDateStart(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Til</label>
                        <input
                          type="date"
                          value={customDateEnd}
                          onChange={(e) => setCustomDateEnd(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-border bg-background focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald/20 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="w-full mt-2 px-3 py-1.5 text-xs font-semibold bg-brand-emerald text-white rounded-lg hover:bg-brand-emerald/90 transition-colors"
                      >
                        Bruk
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {dateFilter !== 'all' && (
              <span className="text-xs text-muted-foreground">
                Filtrerer på {dateFilter === 'today' ? 'i dag' : dateFilter === 'week' ? 'siste uke' : dateFilter === 'month' ? 'siste måned' : 'egendefinert periode'}
              </span>
            )}
          </div>

          {/* Stats for Closed Trades */}
          {(() => {
            const totalClosedInvested = filteredClosedTrades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
            const totalClosedRealized = filteredClosedTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0);
            const closedWinCount = filteredClosedTrades.filter(t => (t.realizedPnL || 0) > 0).length;
            const closedWinRate = filteredClosedTrades.length > 0 ? (closedWinCount / filteredClosedTrades.length) * 100 : 0;
            const avgReturn = filteredClosedTrades.length > 0 
              ? filteredClosedTrades.reduce((sum, t) => {
                  const invested = t.entryPrice * t.quantity;
                  return sum + ((t.realizedPnL || 0) / invested * 100);
                }, 0) / filteredClosedTrades.length
              : 0;
            
            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Lukkede Trades</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground">{filteredClosedTrades.length}</div>
                </div>
                <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Investert</div>
                  <div className="text-xl sm:text-3xl font-extrabold text-foreground">
                    {totalClosedInvested.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Realisert P/L</div>
                  <div className={clsx(
                    'text-xl sm:text-3xl font-extrabold',
                    totalClosedRealized >= 0 ? 'text-brand-emerald' : 'text-brand-rose'
                  )}>
                    {totalClosedRealized >= 0 ? '+' : ''}{totalClosedRealized.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border">
                  <div className="text-xs sm:text-sm text-muted-foreground mb-1">Win Rate</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    {closedWinRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Snitt: {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Closed Trades Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <Archive className="w-5 h-5 text-muted-foreground" />
              Alle lukkede trades
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Strategi-filter for closed trades */}
              {(() => {
                const closedStrategies = Array.from(new Set(allClosedTrades.map(t => t.strategyId).filter(Boolean))) as StrategyId[];
                if (closedStrategies.length <= 1) return null;
                return (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedStrategies([])}
                      className={clsx(
                        'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                        selectedStrategies.length === 0 
                          ? 'bg-brand-slate text-white' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      Alle strategier
                    </button>
                    {closedStrategies.map(strategyId => {
                      const strategy = STRATEGIES[strategyId];
                      const isSelected = selectedStrategies.includes(strategyId);
                      return (
                        <button
                          type="button"
                          key={strategyId}
                          onClick={() => toggleStrategy(strategyId)}
                          className={clsx(
                            'px-2 py-1 text-xs font-semibold rounded-md transition-all',
                            isSelected 
                              ? 'text-white shadow-sm' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          )}
                          style={isSelected ? { backgroundColor: strategy.color } : {}}
                          title={strategy.name}
                        >
                          {strategy.emoji} {strategy.shortName}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              
              {/* Toggle kr/% */}
              <div className="flex items-center bg-muted rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setDisplayMode('percent')}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    displayMode === 'percent' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('kr')}
                  className={clsx(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    displayMode === 'kr' 
                      ? 'bg-card text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Kr
                </button>
              </div>
            </div>
          </div>

          {/* Closed Trades Table */}
          {filteredClosedTrades.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Ingen lukkede trades</h3>
              <p className="text-muted-foreground">Lukkede trades vises her når du lukker en trade</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Ticker</th>
                    <th className="text-left p-4 text-xs font-bold text-muted-foreground uppercase">Strategi</th>
                    <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Kjøp</th>
                    <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Salg</th>
                    <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Antall</th>
                    <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">P/L</th>
                    <th className="text-right p-4 text-xs font-bold text-muted-foreground uppercase">Dato</th>
                    <th className="text-center p-4 text-xs font-bold text-muted-foreground uppercase">Aksjon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClosedTrades.map(trade => {
                    const strategy = STRATEGIES[trade.strategyId];
                    const pnl = trade.realizedPnL || 0;
                    const pnlPercent = ((trade.exitPrice || trade.entryPrice) - trade.entryPrice) / trade.entryPrice * 100;
                    const isProfit = pnl >= 0;
                    
                    return (
                      <tr key={trade.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-foreground">{trade.ticker.replace('.OL', '')}</div>
                        </td>
                        <td className="p-4">
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: `${strategy?.color}20`, color: strategy?.color }}
                          >
                            {strategy?.emoji} {strategy?.shortName}
                          </span>
                        </td>
                        <td className="p-4 text-right font-medium text-foreground">
                          {trade.entryPrice.toFixed(2)} kr
                        </td>
                        <td className="p-4 text-right font-medium text-foreground">
                          {trade.exitPrice?.toFixed(2) || '-'} kr
                        </td>
                        <td className="p-4 text-right text-foreground">{trade.quantity}</td>
                        <td className="p-4 text-right">
                          <div className={clsx(
                            'font-bold',
                            isProfit ? 'text-brand-emerald' : 'text-brand-rose'
                          )}>
                            {displayMode === 'kr' ? (
                              <>
                                {isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                              </>
                            ) : (
                              <>
                                {isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right text-sm text-muted-foreground">
                          {trade.exitDate ? new Date(trade.exitDate).toLocaleDateString('nb-NO') : '-'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingTrade(trade)}
                              className="p-1.5 text-muted-foreground hover:text-brand-emerald transition-colors"
                              title="Rediger"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="p-1.5 text-muted-foreground hover:text-brand-rose transition-colors"
                              title="Slett"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Close Trade Modal */}
      {closingTrade && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-brand-slate">
                Lukk Trade: {closingTrade.ticker}
              </h2>
              <button
                onClick={() => setClosingTrade(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Info om traden */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Kjøpt:</span>
                    <span className="ml-2 font-semibold">{closingTrade.entryPrice.toFixed(2)} kr</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dato:</span>
                    <span className="ml-2 font-semibold">{new Date(closingTrade.entryDate).toLocaleDateString('nb-NO')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Antall:</span>
                    <span className="ml-2 font-semibold">{closingTrade.quantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Investert:</span>
                    <span className="ml-2 font-semibold">{(closingTrade.entryPrice * closingTrade.quantity).toLocaleString('nb-NO')} kr</span>
                  </div>
                </div>
              </div>

              {/* Nordnet hurtigfelt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 Lim inn fra Nordnet (valgfritt)
                </label>
                <textarea
                  placeholder="Lim inn salgsdata fra Nordnet her..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all text-sm"
                  rows={2}
                  onChange={(e) => {
                    const text = e.target.value;
                    // Parse Nordnet salgsformat
                    // Format: dato, konto, "Salg", navn, antall, pris, kurtasje, total
                    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length >= 5) {
                      // Finn dato (første linje med dd.mm.yyyy format)
                      const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
                      if (dateMatch) {
                        const [, day, month, year] = dateMatch;
                        const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        setCloseTradeData(prev => ({ ...prev, exitDate: dateStr }));
                      }
                      // Finn pris (søk etter tall med NOK/DKK)
                      const priceMatches = text.match(/([\d\s,]+)\s*(NOK|DKK)/gi);
                      if (priceMatches && priceMatches.length >= 1) {
                        // Andre match er vanligvis prisen (første er antall)
                        const priceStr = priceMatches.length > 1 ? priceMatches[1] : priceMatches[0];
                        const price = parseFloat(priceStr.replace(/\s/g, '').replace(',', '.').replace(/NOK|DKK/gi, ''));
                        if (!isNaN(price) && price > 0) {
                          setCloseTradeData(prev => ({ ...prev, exitPrice: price.toFixed(2) }));
                        }
                      }
                    }
                    e.target.value = ''; // Tøm etter parsing
                  }}
                />
              </div>
              
              {/* Manuell input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salgspris
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={closeTradeData.exitPrice}
                    onChange={(e) => setCloseTradeData(prev => ({ ...prev, exitPrice: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salgsdato
                  </label>
                  <input
                    type="date"
                    value={closeTradeData.exitDate}
                    onChange={(e) => setCloseTradeData(prev => ({ ...prev, exitDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* P/L Preview */}
              {closeTradeData.exitPrice && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Resultat ved salg</div>
                  {(() => {
                    const exitPrice = parseFloat(closeTradeData.exitPrice);
                    const pnl = (exitPrice - closingTrade.entryPrice) * closingTrade.quantity;
                    const pnlPercent = ((exitPrice - closingTrade.entryPrice) / closingTrade.entryPrice) * 100;
                    const isProfit = pnl >= 0;
                    return (
                      <div className={clsx(
                        'text-2xl font-bold',
                        isProfit ? 'text-brand-emerald' : 'text-brand-rose'
                      )}>
                        {isProfit ? '+' : ''}{pnl.toLocaleString('nb-NO', { maximumFractionDigits: 0 })} kr
                        <span className="text-base ml-2">
                          ({isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setClosingTrade(null)}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  const exitPrice = parseFloat(closeTradeData.exitPrice);
                  if (exitPrice > 0) {
                    handleCloseTrade(
                      closingTrade.id, 
                      exitPrice, 
                      new Date(closeTradeData.exitDate)
                    );
                    setClosingTrade(null);
                  }
                }}
                disabled={!closeTradeData.exitPrice || parseFloat(closeTradeData.exitPrice) <= 0}
                className={clsx(
                  'px-6 py-2 font-bold rounded-lg transition-colors',
                  closeTradeData.exitPrice && parseFloat(closeTradeData.exitPrice) > 0
                    ? 'bg-brand-emerald text-white hover:bg-brand-emerald/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                Lukk Trade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Portfolio Modal */}
      {(isCreatePortfolioModalOpen || editingPortfolio) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-brand-slate">
                {editingPortfolio ? 'Rediger Portefølje' : 'Ny Portefølje'}
              </h2>
              <button
                onClick={() => {
                  setIsCreatePortfolioModalOpen(false);
                  setEditingPortfolio(null);
                  setNewPortfolioData({ name: '', description: '', strategyId: '', isCustom: true });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Velg strategi eller custom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type portefølje
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewPortfolioData(prev => ({ ...prev, isCustom: true, strategyId: '' }))}
                    className={clsx(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                      newPortfolioData.isCustom 
                        ? 'bg-brand-emerald text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    Egendefinert
                  </button>
                  <button
                    onClick={() => setNewPortfolioData(prev => ({ ...prev, isCustom: false }))}
                    className={clsx(
                      'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                      !newPortfolioData.isCustom 
                        ? 'bg-brand-emerald text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    Strategi-basert
                  </button>
                </div>
              </div>

              {/* Strategi velger (hvis ikke custom) */}
              {!newPortfolioData.isCustom && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Velg strategi
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                    {allStrategies.map(strategy => (
                      <button
                        key={strategy.id}
                        onClick={() => setNewPortfolioData(prev => ({
                          ...prev,
                          strategyId: strategy.id,
                          name: strategy.name,
                          description: strategy.description,
                        }))}
                        className={clsx(
                          'flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all',
                          newPortfolioData.strategyId === strategy.id
                            ? 'border-brand-emerald bg-brand-emerald/5'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <span className="text-xl">{strategy.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm text-gray-900 truncate">{strategy.name}</div>
                          <div className="text-xs text-gray-500">{strategy.shortName}</div>
                        </div>
                        {!strategy.enabled && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Manuell</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porteføljenavn
                </label>
                <input
                  type="text"
                  value={newPortfolioData.name}
                  onChange={(e) => setNewPortfolioData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={newPortfolioData.isCustom ? 'F.eks. "Min favoritter" eller "Utbytte 2024"' : 'Velg strategi først'}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald"
                />
              </div>

              {/* Beskrivelse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beskrivelse (valgfritt)
                </label>
                <textarea
                  value={newPortfolioData.description}
                  onChange={(e) => setNewPortfolioData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kort beskrivelse av porteføljen..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-emerald/20 focus:border-brand-emerald resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setIsCreatePortfolioModalOpen(false);
                  setEditingPortfolio(null);
                  setNewPortfolioData({ name: '', description: '', strategyId: '', isCustom: true });
                }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio}
                disabled={!newPortfolioData.name.trim()}
                className={clsx(
                  'px-6 py-2 font-bold rounded-lg transition-colors',
                  newPortfolioData.name.trim()
                    ? 'bg-brand-emerald text-white hover:bg-brand-emerald/90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {editingPortfolio ? 'Lagre' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
