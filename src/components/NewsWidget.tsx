'use client';

import { useState, useEffect } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import { NewsItem as FinnhubNewsItem } from '@/lib/api/finnhub';

interface NewsWidgetProps {
  ticker: string;
}

export default function NewsWidget({ ticker }: NewsWidgetProps) {
  const [news, setNews] = useState<FinnhubNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const response = await fetch(`/api/news/${ticker}`);
        if (response.ok) {
          const data = await response.json();
          setNews(data);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      }
      setLoading(false);
    }
    
    fetchNews();
  }, [ticker]);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} dag${days > 1 ? 'er' : ''} siden`;
    if (hours > 0) return `${hours} time${hours > 1 ? 'r' : ''} siden`;
    return 'Nylig';
  };

  return (
    <div className="bg-surface rounded-2xl p-6 border border-surface-border">
      <div className="flex items-center gap-2 mb-6">
        <Newspaper className="w-5 h-5 text-brand-slate" />
        <h3 className="text-xl font-bold text-brand-slate">Siste Nyheter</h3>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Laster nyheter...</div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-brand-slate mb-2 group-hover:text-brand-emerald transition-colors line-clamp-2">
                    {item.headline}
                  </h4>
                  {item.summary && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>📅 {formatTimeAgo(item.datetime)}</span>
                    <span>•</span>
                    <span>📰 {item.source}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">Ingen nyheter funnet siste 30 dager</div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-bold text-brand-slate mb-3">Eksterne kilder</h4>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://newsweb.oslobors.no/search?issuer=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-brand-slate text-white rounded-lg text-sm font-semibold hover:bg-brand-slate/90 transition-colors"
          >
            📊 Newsweb
          </a>
          <a
            href={`https://www.e24.no/sok?q=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            📰 E24
          </a>
          <a
            href={`https://www.dn.no/sok/?query=${ticker}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            📈 DN
          </a>
        </div>
      </div>
    </div>
  );
}
