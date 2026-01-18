'use client';

import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

interface EarningsEvent {
  ticker: string;
  name: string;
  date: string;
  daysUntil: number;
}

interface EarningsCalendarProps {
  className?: string;
}

export default function EarningsCalendar({ className }: EarningsCalendarProps) {
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch from our stocks API which includes earnings dates
      const response = await fetch('/api/stocks');
      if (!response.ok) throw new Error('Failed to fetch stocks');
      
      const data = await response.json();
      const stocks = data.stocks || data;
      
      // Filter stocks with earnings dates and calculate days until
      const now = new Date();
      const earningsEvents: EarningsEvent[] = stocks
        .filter((s: any) => s.earningsDate)
        .map((s: any) => {
          const earningsDate = new Date(s.earningsDate);
          const daysUntil = Math.ceil((earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            ticker: s.ticker,
            name: s.name,
            date: s.earningsDate,
            daysUntil,
          };
        })
        .filter((e: EarningsEvent) => e.daysUntil >= -7 && e.daysUntil <= 90) // Last week to next 90 days
        .sort((a: EarningsEvent, b: EarningsEvent) => a.daysUntil - b.daysUntil);
      
      setEarnings(earningsEvents);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'bg-gray-100 text-gray-600'; // Past
    if (daysUntil <= 7) return 'bg-red-100 text-red-700'; // This week
    if (daysUntil <= 14) return 'bg-orange-100 text-orange-700'; // Next 2 weeks
    if (daysUntil <= 30) return 'bg-yellow-100 text-yellow-700'; // Next month
    return 'bg-blue-100 text-blue-700'; // Later
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('nb-NO', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  if (loading) {
    return (
      <div className={clsx('bg-white rounded-2xl border border-gray-100 p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-brand-slate">Kvartalsrapporter</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={clsx('bg-white rounded-2xl border border-gray-100 p-6', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-brand-slate">Kvartalsrapporter</h3>
        </div>
        <div className="text-center py-4 text-gray-500 text-sm">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-gray-400" />
          Kunne ikke laste earnings-data
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('bg-white dark:bg-dark-surface rounded-2xl border border-gray-100 dark:border-dark-border p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          <h3 className="font-bold text-brand-slate dark:text-dark-text">Kvartalsrapporter</h3>
        </div>
        <button 
          onClick={fetchEarnings}
          className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {earnings.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-dark-muted text-sm">
          Ingen kommende rapporter funnet
        </div>
      ) : (
        <div className="space-y-2">
          {earnings.slice(0, 8).map((event) => (
            <Link 
              key={`${event.ticker}-${event.date}`}
              href={`/analyse/${event.ticker}`}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-border transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold',
                  getUrgencyColor(event.daysUntil)
                )}>
                  {event.daysUntil <= 0 ? (
                    <span className="text-[10px]">NYLIG</span>
                  ) : (
                    <span>{event.daysUntil}d</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-brand-slate dark:text-dark-text group-hover:text-purple-600 transition-colors">
                    {event.ticker.replace('.OL', '')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted truncate max-w-[120px]">
                    {event.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700 dark:text-dark-text">
                  {formatDate(event.date)}
                </div>
                <div className="text-xs text-gray-400 dark:text-dark-muted">
                  {event.daysUntil <= 0 ? 'Rapportert' : 
                   event.daysUntil === 1 ? 'I morgen' :
                   event.daysUntil <= 7 ? 'Denne uken' : ''}
                </div>
              </div>
            </Link>
          ))}
          
          {earnings.length > 8 && (
            <div className="text-center pt-2">
              <span className="text-xs text-gray-400 dark:text-dark-muted">
                +{earnings.length - 8} flere rapporter
              </span>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-border">
        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Denne uken</span>
        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">2 uker</span>
        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">1 mnd</span>
        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Senere</span>
      </div>
    </div>
  );
}
