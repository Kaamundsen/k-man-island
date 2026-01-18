import { NextRequest, NextResponse } from 'next/server';
import { getFinnhubQuote, getFinnhubCandles } from '@/lib/api/finnhub';

export interface QuoteResponse {
  [ticker: string]: {
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    previousClose: number;
  } | null;
}

// Cache for quotes når børsen er stengt
const quotesCache: Map<string, { data: QuoteResponse[string]; timestamp: number }> = new Map();
const CACHE_DURATION_CLOSED = 24 * 60 * 60 * 1000; // 24 timer når stengt
const CACHE_DURATION_OPEN = 30 * 1000; // 30 sekunder når åpen (for ferskere data)

// Sjekk om Oslo Børs er åpen
function isOsloBorsOpen(): { isOpen: boolean; reason: string } {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  
  const day = osloTime.getDay(); // 0 = søndag, 6 = lørdag
  const hours = osloTime.getHours();
  const minutes = osloTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Helg
  if (day === 0 || day === 6) {
    return { isOpen: false, reason: 'weekend' };
  }
  
  // Åpningstid: 09:00 - 16:30
  const openTime = 9 * 60; // 09:00
  const closeTime = 16 * 60 + 30; // 16:30
  
  if (timeInMinutes < openTime) {
    return { isOpen: false, reason: 'before_open' };
  }
  
  if (timeInMinutes >= closeTime) {
    return { isOpen: false, reason: 'after_close' };
  }
  
  return { isOpen: true, reason: 'open' };
}

// Normaliser ticker til Oslo Børs format
function normalizeOsloTicker(ticker: string): string {
  // Hvis ticker ikke har suffix og ser norsk ut, legg til .OL
  if (!ticker.includes('.') && !ticker.includes('/')) {
    return `${ticker}.OL`;
  }
  return ticker;
}

// Sjekk cache
function getCachedQuote(ticker: string, marketOpen: boolean): QuoteResponse[string] | null {
  const cached = quotesCache.get(ticker);
  if (!cached) return null;
  
  const maxAge = marketOpen ? CACHE_DURATION_OPEN : CACHE_DURATION_CLOSED;
  const age = Date.now() - cached.timestamp;
  
  if (age < maxAge) {
    return cached.data;
  }
  
  return null;
}

// Lagre i cache
function setCachedQuote(ticker: string, data: QuoteResponse[string]): void {
  quotesCache.set(ticker, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rawTickers = searchParams.get('tickers')?.split(',') || [];
  
  if (rawTickers.length === 0) {
    return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });
  }

  // Sjekk om Oslo Børs er åpen
  const marketStatus = isOsloBorsOpen();
  
  // Normaliser og begrens til 10 tickers
  const tickers = rawTickers.slice(0, 10).map(t => normalizeOsloTicker(t.trim()));
  const quotes: QuoteResponse = {};
  
  // Hvis børsen er stengt, prøv å bruke cache først
  if (!marketStatus.isOpen) {
    console.log(`🔒 Oslo Børs stengt (${marketStatus.reason}) - bruker cache`);
    
    let allCached = true;
    for (const ticker of tickers) {
      const originalTicker = rawTickers.find(t => normalizeOsloTicker(t.trim()) === ticker) || ticker;
      const cached = getCachedQuote(ticker, false);
      
      if (cached) {
        quotes[originalTicker] = cached;
      } else {
        allCached = false;
      }
    }
    
    // Hvis alt er cachet, returner med en gang
    if (allCached && Object.keys(quotes).length === tickers.length) {
      console.log(`📦 Returnerer ${Object.keys(quotes).length} cached quotes (børs stengt)`);
      return NextResponse.json(quotes, {
        headers: { 'X-Market-Status': marketStatus.reason }
      });
    }
  }
  
  for (const ticker of tickers) {
    const originalTicker = rawTickers.find(t => normalizeOsloTicker(t.trim()) === ticker) || ticker;
    
    // Sjekk cache først (selv når åpen, for rask respons)
    const cached = getCachedQuote(ticker, marketStatus.isOpen);
    if (cached) {
      quotes[originalTicker] = cached;
      console.log(`📦 Cache hit for ${ticker}: ${cached.price} (${cached.changePercent >= 0 ? '+' : ''}${cached.changePercent?.toFixed(2) || 0}%)`);
      continue;
    }
    
    try {
      // Metode 1: Prøv Finnhub quote
      let quote = await getFinnhubQuote(ticker);
      
      if (quote && quote.c > 0) {
        const quoteData = {
          price: quote.c,
          change: quote.d || 0,
          changePercent: quote.dp || 0,
          high: quote.h || quote.c,
          low: quote.l || quote.c,
          previousClose: quote.pc || quote.c,
        };
        quotes[originalTicker] = quoteData;
        setCachedQuote(ticker, quoteData);
        console.log(`✅ Finnhub quote for ${ticker}: ${quote.c}`);
        continue;
      }
      
      // Metode 2: Prøv å hente siste candle fra Finnhub
      const candles = await getFinnhubCandles(ticker, 5);
      if (candles && candles.c && candles.c.length > 0) {
        const lastPrice = candles.c[candles.c.length - 1];
        const prevPrice = candles.c.length > 1 ? candles.c[candles.c.length - 2] : lastPrice;
        const change = lastPrice - prevPrice;
        const changePercent = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        
        const quoteData = {
          price: lastPrice,
          change,
          changePercent,
          high: candles.h?.[candles.h.length - 1] || lastPrice,
          low: candles.l?.[candles.l.length - 1] || lastPrice,
          previousClose: prevPrice,
        };
        quotes[originalTicker] = quoteData;
        setCachedQuote(ticker, quoteData);
        console.log(`✅ Finnhub candle for ${ticker}: ${lastPrice}`);
        continue;
      }
      
      // Metode 3: Prøv Yahoo Finance v10 quote API (mer real-time)
      try {
        const yahooQuoteResponse = await fetch(
          `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}?modules=price`,
          { 
            cache: 'no-store',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        
        if (yahooQuoteResponse.ok) {
          const data = await yahooQuoteResponse.json();
          const priceData = data.quoteSummary?.result?.[0]?.price;
          
          if (priceData?.regularMarketPrice?.raw) {
            const currentPrice = priceData.regularMarketPrice.raw;
            const prevClose = priceData.regularMarketPreviousClose?.raw || currentPrice;
            const change = priceData.regularMarketChange?.raw || (currentPrice - prevClose);
            const changePercent = priceData.regularMarketChangePercent?.raw 
              ? priceData.regularMarketChangePercent.raw * 100 
              : (prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0);
            
            const quoteData = {
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              high: priceData.regularMarketDayHigh?.raw || currentPrice,
              low: priceData.regularMarketDayLow?.raw || currentPrice,
              previousClose: prevClose,
            };
            quotes[originalTicker] = quoteData;
            setCachedQuote(ticker, quoteData);
            console.log(`✅ Yahoo v10 quote for ${ticker}: ${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) prev: ${prevClose.toFixed(2)}`);
            continue;
          }
        }
      } catch (yahooV10Error) {
        console.error(`Yahoo v10 error for ${ticker}:`, yahooV10Error);
      }
      
      // Metode 4: Fallback til Yahoo chart API
      try {
        const yahooResponse = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`,
          { 
            cache: 'no-store',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          }
        );
        
        if (yahooResponse.ok) {
          const data = await yahooResponse.json();
          const result = data.chart?.result?.[0];
          const meta = result?.meta;
          const quotes_arr = result?.indicators?.quote?.[0];
          
          if (meta) {
            // Bruk siste pris fra intraday data hvis tilgjengelig
            let currentPrice = meta.regularMarketPrice;
            if (quotes_arr?.close) {
              const closes = quotes_arr.close.filter((c: number | null) => c !== null);
              if (closes.length > 0) {
                currentPrice = closes[closes.length - 1];
              }
            }
            
            const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
            const change = currentPrice - prevClose;
            const changePercent = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
            
            const quoteData = {
              price: currentPrice,
              change: change,
              changePercent: changePercent,
              high: meta.regularMarketDayHigh || currentPrice,
              low: meta.regularMarketDayLow || currentPrice,
              previousClose: prevClose,
            };
            quotes[originalTicker] = quoteData;
            setCachedQuote(ticker, quoteData);
            console.log(`✅ Yahoo chart for ${ticker}: ${currentPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) prev: ${prevClose.toFixed(2)}`);
            continue;
          }
        }
      } catch (yahooError) {
        console.error(`Yahoo chart error for ${ticker}:`, yahooError);
      }
      
      quotes[originalTicker] = null;
      console.log(`❌ No quote available for ${ticker}`);
      
    } catch (error) {
      console.error(`Error fetching quote for ${ticker}:`, error);
      quotes[originalTicker] = null;
    }
    
    // Kort pause mellom requests (bare hvis børsen er åpen, ellers raskere)
    if (marketStatus.isOpen) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`📊 Returnerer ${Object.keys(quotes).length} quotes (børs: ${marketStatus.isOpen ? 'åpen' : 'stengt'})`);
  
  return NextResponse.json(quotes, {
    headers: { 'X-Market-Status': marketStatus.reason }
  });
}
