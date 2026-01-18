'use client';

import { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Star, 
  TrendingUp, 
  TrendingDown,
  ExternalLink,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { getMentionsForStock, type ArticleTip, type StockMention } from '@/lib/store/article-tips';

interface StockMentionsWidgetProps {
  ticker: string;
}

export default function StockMentionsWidget({ ticker }: StockMentionsWidgetProps) {
  const [mentions, setMentions] = useState<Array<{ article: ArticleTip; mention: StockMention }>>([]);

  useEffect(() => {
    setMentions(getMentionsForStock(ticker));
  }, [ticker]);

  if (mentions.length === 0) {
    return null; // Don't show anything if no mentions
  }

  return (
    <div className="bg-surface dark:bg-dark-surface rounded-2xl p-6 border border-surface-border dark:border-dark-border">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-brand-slate dark:text-dark-text" />
        <h3 className="text-xl font-bold text-brand-slate dark:text-dark-text">
          Artikkel-nevnelser ({mentions.length})
        </h3>
      </div>

      <div className="space-y-3">
        {mentions.map(({ article, mention }, index) => (
          <div 
            key={article.id}
            className={clsx(
              'p-4 rounded-xl border',
              mention.isTopPick 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                : mention.sentiment === 'positive'
                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900'
                : mention.sentiment === 'negative'
                ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {mention.isTopPick && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-bold">
                    <Star className="w-3 h-3" />
                    Topp-pick
                  </span>
                )}
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                  {article.source}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-dark-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.publishedDate).toLocaleDateString('nb-NO')}
              </span>
            </div>

            {/* Article Title */}
            <h4 className="font-semibold text-brand-slate dark:text-white text-sm mb-2 line-clamp-2">
              {article.title}
            </h4>

            {/* Highlight/Comment about this stock */}
            <p className="text-sm text-gray-600 dark:text-dark-muted mb-3">
              {mention.highlight}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mention.sentiment === 'positive' && (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                )}
                {mention.sentiment === 'negative' && (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={clsx(
                  'text-xs font-medium',
                  mention.sentiment === 'positive' ? 'text-green-600' :
                  mention.sentiment === 'negative' ? 'text-red-600' : 'text-gray-500'
                )}>
                  {mention.mentionType === 'insider_buy' ? 'Innsidekjøp' :
                   mention.mentionType === 'insider_sell' ? 'Innsidesalg' :
                   mention.mentionType === 'analyst_upgrade' ? 'Oppjustering' :
                   mention.mentionType === 'analyst_downgrade' ? 'Nedjustering' :
                   mention.mentionType === 'technical_signal' ? 'Teknisk signal' :
                   mention.mentionType === 'news' ? 'Nyhet' : 'Tips'}
                </span>
              </div>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-emerald hover:underline flex items-center gap-1"
                >
                  Les mer
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Link to all articles */}
      <Link
        href="/artikler"
        className="mt-4 flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl text-sm text-gray-600 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
      >
        Se alle artikler og tips
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ============ Compact Version for Dashboard ============

export function StockMentionsBadge({ ticker }: { ticker: string }) {
  const [mentionCount, setMentionCount] = useState(0);
  const [hasTopPick, setHasTopPick] = useState(false);

  useEffect(() => {
    const mentions = getMentionsForStock(ticker);
    setMentionCount(mentions.length);
    setHasTopPick(mentions.some(m => m.mention.isTopPick));
  }, [ticker]);

  if (mentionCount === 0) return null;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
      hasTopPick 
        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
    )}>
      {hasTopPick && <Star className="w-3 h-3" />}
      <Newspaper className="w-3 h-3" />
      {mentionCount}
    </span>
  );
}
