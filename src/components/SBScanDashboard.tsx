'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SBScanResult, getScoreExplanation } from '@/lib/analysis/sb-scan';
import { 
  Loader2, 
  RefreshCcw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  Info,
  Layers,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';
import { clsx } from 'clsx';

interface SBScanDashboardProps {
  className?: string;
}

type SortKey = 'sbScore' | 'percentToResistance' | 'percentToSupport' | 'atrPercent' | 'ticker';
type SortDirection = 'asc' | 'desc';

// Priority tier based on score
type PriorityTier = 'high' | 'medium' | 'low';

function getPriorityTier(score: number): PriorityTier {
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// Structure strength for tie-break (Impuls > Trend > Range > Chop)
function getStructureStrength(structure: string): number {
  switch (structure) {
    case 'Impuls': return 4;
    case 'Trend': return 3;
    case 'Range': return 2;
    case 'Chop': return 1;
    default: return 0;
  }
}

/**
 * Tie-break comparison for stocks with equal SB-scores
 */
function compareSBScanResults(a: SBScanResult, b: SBScanResult): number {
  // Primary: SB-Score (descending)
  if (a.sbScore !== b.sbScore) {
    return b.sbScore - a.sbScore;
  }
  
  // Tie-break 1: % to resistance (ascending - lower is better)
  if (Math.abs(a.percentToResistance - b.percentToResistance) > 0.1) {
    return a.percentToResistance - b.percentToResistance;
  }
  
  // Tie-break 2: ATR% (descending - higher is better)
  if (Math.abs(a.atrPercent - b.atrPercent) > 0.1) {
    return b.atrPercent - a.atrPercent;
  }
  
  // Tie-break 3: Structure strength (descending)
  const structureA = getStructureStrength(a.structure);
  const structureB = getStructureStrength(b.structure);
  if (structureA !== structureB) {
    return structureB - structureA;
  }
  
  // Tie-break 4: lastUpdated (descending - newest first)
  return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
}

// Get rank medal for top 3
function getRankMedal(rank: number): string | null {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return null;
  }
}

export default function SBScanDashboard({ className }: SBScanDashboardProps) {
  const [results, setResults] = useState<SBScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('sbScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Tooltip state
  const [hoveredTicker, setHoveredTicker] = useState<string | null>(null);
  
  // Filter state - DEFAULT OFF (shows all stocks)
  const [filterHighPriority, setFilterHighPriority] = useState(false);

  // Fetch SB-Scan results
  const fetchResults = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = forceRefresh ? '/api/sb-scan?forceRefresh=true' : '/api/sb-scan';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error && data.results?.length === 0) {
        setError(data.error);
      } else {
        setResults(data.results || []);
        setLastUpdated(data.lastUpdated);
        setFromCache(data.fromCache || false);
      }
    } catch (err) {
      setError('Kunne ikke laste SB-Scan data');
      console.error('SB-Scan fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Handle sorting
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection(key === 'ticker' ? 'asc' : 'desc');
    }
  };

  // Ranked results using tie-break sorting
  const rankedResults = useMemo(() => {
    return [...results].sort(compareSBScanResults);
  }, [results]);

  // Sort and filter results - ALWAYS shows all stocks, filter is optional
  const sortedResults = useMemo(() => {
    let filtered = filterHighPriority 
      ? rankedResults.filter(r => r.sbScore >= 50)
      : rankedResults;
    
    if (sortKey === 'sbScore') {
      return sortDirection === 'desc' 
        ? filtered 
        : [...filtered].reverse();
    }
    
    return [...filtered].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      
      switch (sortKey) {
        case 'ticker':
          aVal = a.ticker;
          bVal = b.ticker;
          break;
        case 'percentToResistance':
          aVal = a.percentToResistance;
          bVal = b.percentToResistance;
          break;
        case 'percentToSupport':
          aVal = a.percentToSupport;
          bVal = b.percentToSupport;
          break;
        case 'atrPercent':
          aVal = a.atrPercent;
          bVal = b.atrPercent;
          break;
        default:
          return 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [rankedResults, sortKey, sortDirection, filterHighPriority]);

  // Top picks (highest priority with tie-break ranking)
  const topPicks = useMemo(() => {
    return rankedResults
      .filter(r => r.sbScore >= 50)
      .slice(0, 10);
  }, [rankedResults]);

  // Stats
  const stats = useMemo(() => {
    const highPriority = results.filter(r => r.sbScore >= 50).length;
    const mediumPriority = results.filter(r => r.sbScore >= 30 && r.sbScore < 50).length;
    const lowPriority = results.filter(r => r.sbScore < 30).length;
    return { highPriority, mediumPriority, lowPriority };
  }, [results]);

  // Render score badge with priority-based styling
  const renderScoreBadge = (score: number) => {
    const tier = getPriorityTier(score);
    let bgColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    
    if (tier === 'high') bgColor = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
    else if (tier === 'medium') bgColor = 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
    
    return (
      <span className={clsx('px-2 py-1 rounded-lg font-bold text-sm', bgColor)}>
        {score}
      </span>
    );
  };

  // Render scenario hint badge
  const renderScenarioHint = (result: SBScanResult) => {
    const configs = {
      'A-candidate': { 
        bg: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', 
        icon: <ArrowUpRight className="w-3 h-3" />,
        label: 'Breakout-hint'
      },
      'B-candidate': { 
        bg: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', 
        icon: <ArrowDownRight className="w-3 h-3" />,
        label: 'Pullback-hint'
      },
      'C/no-edge': { 
        bg: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', 
        icon: <Clock className="w-3 h-3" />,
        label: 'Vent'
      },
    };
    
    const config = configs[result.scenarioHint];
    
    return (
      <span 
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium',
          config.bg
        )}
        title={result.scenarioReason}
      >
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Render structure badge
  const renderStructureBadge = (structure: string) => {
    const configs: Record<string, string> = {
      'Impuls': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Trend': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      'Range': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      'Chop': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };
    
    return (
      <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', configs[structure] || 'bg-gray-50 text-gray-600')}>
        {structure}
      </span>
    );
  };

  // Render momentum indicator
  const renderMomentum = (bias: 'positive' | 'negative' | 'neutral') => {
    if (bias === 'positive') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    if (bias === 'negative') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  // Sortable column header
  const SortableHeader = ({ label, sortKeyName, className: headerClass }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={clsx(
        'flex items-center gap-1 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors',
        headerClass
      )}
    >
      {label}
      {sortKey === sortKeyName && (
        <span className="text-brand-emerald">
          {sortDirection === 'desc' ? '↓' : '↑'}
        </span>
      )}
    </button>
  );

  if (loading && results.length === 0) {
    return (
      <div className={clsx('bg-card rounded-3xl border border-border p-12', className)}>
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <div className="text-center">
            <p className="font-semibold text-foreground">Kjører SB-Scan...</p>
            <p className="text-sm text-muted-foreground">Prioriterer aksjer i watchlisten</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header with principle explanation */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">SB-Scan Prioritering</h2>
              <p className="text-sm text-muted-foreground">
                {results.length} aksjer rangert
                {lastUpdated && (
                  <span className="ml-2">
                    • {fromCache ? 'Cache' : 'Oppdatert'} {new Date(lastUpdated).toLocaleTimeString('nb-NO')}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => fetchResults(true)}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white dark:bg-card hover:bg-muted rounded-lg transition-colors disabled:opacity-50 border border-border"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            Oppdater
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-white/50 dark:bg-card/50 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">SB-Scan = Hva bør jeg se på først?</p>
              <p className="text-muted-foreground">
                SB-Scan rangerer aksjer etter prioritet, men fjerner aldri muligheter. 
                Alle aksjer kan åpnes for dyp SB-Levels analyse. 
                <span className="font-medium text-foreground"> Kun SB-Levels avgjør om en trade er tradeable.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Priority stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-sm font-medium text-muted-foreground">Høy prioritet</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.highPriority}</div>
          <div className="text-xs text-muted-foreground">Score ≥50 – se på disse først</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-sm font-medium text-muted-foreground">Moderat prioritet</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.mediumPriority}</div>
          <div className="text-xs text-muted-foreground">Score 30-49 – kan være interessante</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-slate-400"></div>
            <span className="text-sm font-medium text-muted-foreground">Lav prioritet</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.lowPriority}</div>
          <div className="text-xs text-muted-foreground">Score &lt;30 – ikke i fokus nå</div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Top Picks */}
      {topPicks.length > 0 && (
        <div className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-foreground">
                Top {topPicks.length}: Se på disse først
              </h3>
              <span className="text-xs text-muted-foreground ml-2">
                Rangert med tie-break logikk
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Ved lik score: nærmest motstand → høyest ATR → sterkest struktur
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {topPicks.map((result, index) => {
              const rank = index + 1;
              const medal = getRankMedal(rank);
              const isTopThree = rank <= 3;
              
              return (
                <Link
                  key={result.ticker}
                  href={`/analyse/${result.ticker}`}
                  className={clsx(
                    'rounded-xl p-3 border transition-colors group relative',
                    isTopThree 
                      ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-700 hover:border-indigo-400' 
                      : 'bg-muted/50 border-border hover:border-indigo-300 dark:hover:border-indigo-600'
                  )}
                >
                  <div className="absolute -top-2 -left-2">
                    {medal ? (
                      <span className="text-xl">{medal}</span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                        {rank}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2 mt-1">
                    <span className={clsx(
                      'font-bold transition-colors',
                      isTopThree 
                        ? 'text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-200' 
                        : 'text-foreground group-hover:text-indigo-600'
                    )}>
                      {result.ticker.replace('.OL', '')}
                    </span>
                    {renderScoreBadge(result.sbScore)}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {renderScenarioHint(result)}
                  </div>
                  
                  {isTopThree && (
                    <div className="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-700 text-xs text-indigo-600 dark:text-indigo-400">
                      <div className="flex justify-between">
                        <span>Til motst:</span>
                        <span className="font-medium">{result.percentToResistance.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ATR:</span>
                        <span className="font-medium">{result.atrPercent.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={filterHighPriority}
              onChange={(e) => setFilterHighPriority(e.target.checked)}
              className="rounded border-border text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-muted-foreground">
              Vis kun høy prioritet (score ≥50)
            </span>
          </label>
          {filterHighPriority && (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {results.length - sortedResults.length} aksjer skjult (klikk for å vise alle)
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Viser {sortedResults.length} av {results.length} aksjer
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden">
        <div className="grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr,0.8fr,1fr,1fr,0.8fr] gap-4 px-6 py-4 bg-muted border-b border-border">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">#</div>
          <SortableHeader label="Ticker / Navn" sortKeyName="ticker" />
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Struktur</div>
          <SortableHeader label="% til Motst." sortKeyName="percentToResistance" />
          <SortableHeader label="% til Støtte" sortKeyName="percentToSupport" />
          <SortableHeader label="ATR%" sortKeyName="atrPercent" />
          <SortableHeader label="Prioritet" sortKeyName="sbScore" />
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scenario-hint</div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Analyse</div>
        </div>

        <div className="divide-y divide-border">
          {sortedResults.map((result, index) => {
            const tier = getPriorityTier(result.sbScore);
            const globalRank = rankedResults.findIndex(r => r.ticker === result.ticker) + 1;
            const medal = sortKey === 'sbScore' && sortDirection === 'desc' ? getRankMedal(index + 1) : null;
            const isTopThree = sortKey === 'sbScore' && sortDirection === 'desc' && index < 3;
            
            return (
              <div
                key={result.ticker}
                className={clsx(
                  'grid grid-cols-[0.5fr,2fr,1fr,1fr,1fr,0.8fr,1fr,1fr,0.8fr] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group relative',
                  tier === 'high' && 'bg-indigo-50/30 dark:bg-indigo-900/10',
                  isTopThree && 'bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-900/20',
                )}
                onMouseEnter={() => setHoveredTicker(result.ticker)}
                onMouseLeave={() => setHoveredTicker(null)}
              >
                <div className="flex items-center">
                  {medal ? (
                    <span className="text-lg">{medal}</span>
                  ) : (
                    <span className={clsx(
                      'text-sm font-bold',
                      tier === 'high' ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'
                    )}>
                      {sortKey === 'sbScore' ? index + 1 : globalRank}
                    </span>
                  )}
                </div>
                
                <Link href={`/analyse/${result.ticker}`} className="block">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'text-lg font-bold transition-colors',
                      isTopThree ? 'text-indigo-700 dark:text-indigo-300 group-hover:text-indigo-900' : 'text-foreground group-hover:text-indigo-600'
                    )}>
                      {result.ticker.replace('.OL', '')}
                    </span>
                    {renderMomentum(result.momentumBias)}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{result.name}</div>
                </Link>

                <div className="flex items-center">
                  {renderStructureBadge(result.structure)}
                </div>

                <div className="flex items-center">
                  <span className={clsx(
                    'font-semibold',
                    result.percentToResistance <= 3 ? 'text-green-600' : 
                    result.percentToResistance <= 5 ? 'text-amber-600' : 'text-muted-foreground'
                  )}>
                    {result.percentToResistance.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center">
                  <span className={clsx(
                    'font-semibold',
                    result.percentToSupport <= 3 ? 'text-blue-600' : 
                    result.percentToSupport <= 5 ? 'text-amber-600' : 'text-muted-foreground'
                  )}>
                    {result.percentToSupport.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-muted-foreground">
                    {result.atrPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {renderScoreBadge(result.sbScore)}
                  <button
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title={getScoreExplanation(result)}
                  >
                    <Info className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center">
                  {renderScenarioHint(result)}
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href={`/analyse/${result.ticker}`}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    SB-Levels
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {hoveredTicker === result.ticker && (
                  <div className="absolute left-12 top-full mt-1 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-80">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                      <span className="text-sm font-medium text-foreground">
                        Rang #{globalRank} {medal && <span className="ml-1">{medal}</span>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Score: {result.sbScore}
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1 mb-3">
                      <div className="text-xs font-medium text-foreground mb-1">Score-komponenter:</div>
                      <div className="flex justify-between">
                        <span>Nær nivå:</span>
                        <span className="font-medium">+{result.scoreBreakdown.nearResistance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Struktur ({result.structure}):</span>
                        <span className="font-medium">+{result.scoreBreakdown.structureScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volatilitet:</span>
                        <span className="font-medium">+{result.scoreBreakdown.volatilityScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Momentum:</span>
                        <span className="font-medium">+{result.scoreBreakdown.momentumScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ikke chop:</span>
                        <span className="font-medium">+{result.scoreBreakdown.notChopScore}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs bg-muted/50 rounded-lg p-2 mb-3">
                      <div className="font-medium text-foreground mb-1">Tie-break faktorer:</div>
                      <div className="text-muted-foreground space-y-0.5">
                        <div className="flex justify-between">
                          <span>1. % til motstand:</span>
                          <span className="font-medium">{result.percentToResistance.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>2. ATR%:</span>
                          <span className="font-medium">{result.atrPercent.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>3. Struktur-styrke:</span>
                          <span className="font-medium">{result.structure}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs">
                      <p className="text-muted-foreground">{result.scenarioReason}</p>
                      <p className="text-indigo-600 mt-1 font-medium">
                        Klikk "SB-Levels" for å se om denne er tradeable →
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 bg-muted border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {sortedResults.length} aksjer vist
            {filterHighPriority && ` (${results.length - sortedResults.length} skjult av filter)`}
          </span>
          <span className="text-xs text-muted-foreground">
            Alle aksjer kan alltid åpnes for dyp analyse
          </span>
        </div>
      </div>
    </div>
  );
}
