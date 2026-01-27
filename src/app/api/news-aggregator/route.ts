/**
 * News Aggregator API
 * 
 * Henter nyheter fra RSS feeds server-side for å unngå CORS
 * Respekterer betalingsmurer - henter kun overskrifter og ingresser
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseRSSFeed, findTickersInText, detectSentiment, detectCategory, type NewsItem } from '@/lib/api/news-feeds';

// Cache for RSS feeds (5 min)
const feedCache: Map<string, { data: NewsItem[], timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutter

// RSS Feed URLs
const FEEDS = {
  E24_BORS: 'https://e24.no/rss2/?seksjon=boers-og-finans',
  E24_NYHETER: 'https://e24.no/rss2/',
  INVESTORNYTT: 'https://www.investornytt.no/feed/',
  DN_BORS: 'https://www.dn.no/rss/bors',
  FINANSAVISEN: 'https://www.finansavisen.no/rss',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const source = searchParams.get('source') || 'all';
  const forceRefresh = searchParams.get('refresh') === 'true';
  
  try {
    // Sjekk cache (skip hvis force refresh)
    const cacheKey = `${source}-${ticker || 'all'}`;
    const cached = feedCache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ 
        news: cached.data,
        cached: true,
        cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
      });
    }
    
    const allNews: NewsItem[] = [];
    const activeSources: string[] = [];
    
    // Helper function to fetch and parse RSS
    const fetchRSS = async (feedUrl: string, sourceName: string, sourceId: string): Promise<void> => {
      try {
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; StockTracker/1.0)',
          },
          next: { revalidate: 300 },
        });
        
        if (response.ok) {
          const xmlText = await response.text();
          const items = parseRSSFeed(xmlText);
          activeSources.push(sourceName);
          
          for (const item of items.slice(0, 15)) {
            const tickers = findTickersInText(item.title + ' ' + (item.description || ''));
            
            if (ticker && tickers.length > 0 && !tickers.includes(ticker.replace('.OL', ''))) {
              continue;
            }
            
            allNews.push({
              id: `${sourceId}-${Buffer.from(item.link).toString('base64').slice(0, 10)}`,
              title: item.title,
              summary: item.description || '',
              source: sourceName,
              url: item.link,
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              tickers,
              category: detectCategory(item.title + ' ' + (item.description || '')),
              sentiment: detectSentiment(item.title + ' ' + (item.description || '')),
            });
          }
        }
      } catch (e) {
        console.warn(`${sourceName} RSS fetch failed:`, e);
      }
    }
    
    // Fetch all feeds in parallel
    const fetchPromises: Promise<void>[] = [];
    
    if (source === 'all' || source === 'e24') {
      fetchPromises.push(fetchRSS(FEEDS.E24_BORS, 'E24', 'e24'));
    }
    
    if (source === 'all' || source === 'investornytt') {
      fetchPromises.push(fetchRSS(FEEDS.INVESTORNYTT, 'Investornytt', 'inv'));
    }
    
    if (source === 'all' || source === 'dn') {
      fetchPromises.push(fetchRSS(FEEDS.DN_BORS, 'DN', 'dn'));
    }
    
    if (source === 'all' || source === 'finansavisen') {
      fetchPromises.push(fetchRSS(FEEDS.FINANSAVISEN, 'Finansavisen', 'fa'));
    }
    
    await Promise.all(fetchPromises);
    
    // Sorter etter dato (nyeste først)
    allNews.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Lagre i cache
    feedCache.set(cacheKey, { data: allNews, timestamp: Date.now() });
    
    return NextResponse.json({
      news: allNews,
      cached: false,
      totalItems: allNews.length,
      sources: activeSources,
    });
    
  } catch (error) {
    console.error('News aggregator error:', error);
    return NextResponse.json(
      { error: 'Kunne ikke hente nyheter', news: [] },
      { status: 500 }
    );
  }
}
