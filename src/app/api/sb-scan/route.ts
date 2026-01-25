import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalData } from '@/lib/api/historical-data';
import { sbScan, SBScanResult, PriceData } from '@/lib/analysis/sb-scan';
import { fetchLiveStockData } from '@/lib/api/stock-data';

/**
 * SB-Scan API - Lightweight quick scan for all stocks
 * 
 * GET /api/sb-scan
 * Query params:
 *   - limit: number (default: 50, max: 200)
 *   - forceRefresh: boolean (default: false)
 * 
 * Returns sorted SB-Scan results for the watchlist
 */

// In-memory cache for SB-Scan results
interface SBScanCache {
  results: SBScanResult[];
  timestamp: number;
}

let sbScanCache: SBScanCache | null = null;

// Cache duration: 15 minutes for market hours, 60 minutes for off-hours
function getCacheDuration(): number {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Oslo' }));
  const day = osloTime.getDay();
  const hours = osloTime.getHours();
  const minutes = osloTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Weekend
  if (day === 0 || day === 6) {
    return 60 * 60 * 1000; // 60 minutes
  }
  
  // Market hours: 09:00 - 16:30
  const marketOpen = 9 * 60;
  const marketClose = 16 * 60 + 30;
  
  if (timeInMinutes >= marketOpen && timeInMinutes <= marketClose) {
    return 15 * 60 * 1000; // 15 minutes during market hours
  }
  
  return 60 * 60 * 1000; // 60 minutes off-hours
}

function isCacheValid(): boolean {
  if (!sbScanCache || sbScanCache.results.length === 0) {
    return false;
  }
  
  const cacheAge = Date.now() - sbScanCache.timestamp;
  return cacheAge < getCacheDuration();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)));
  const forceRefresh = searchParams.get('forceRefresh') === 'true';
  
  // Check cache first
  if (!forceRefresh && isCacheValid() && sbScanCache) {
    console.log(`📊 SB-Scan: Using cached results (${sbScanCache.results.length} stocks)`);
    
    return NextResponse.json({
      results: sbScanCache.results.slice(0, limit),
      totalCount: sbScanCache.results.length,
      fromCache: true,
      cacheAge: Math.round((Date.now() - sbScanCache.timestamp) / 1000),
      lastUpdated: new Date(sbScanCache.timestamp).toISOString(),
    });
  }
  
  console.log('📊 SB-Scan: Running fresh scan...');
  
  try {
    // Fetch current stock list
    const stocks = await fetchLiveStockData();
    
    if (stocks.length === 0) {
      return NextResponse.json({
        results: [],
        totalCount: 0,
        error: 'No stocks available',
      }, { status: 503 });
    }
    
    console.log(`📊 SB-Scan: Processing ${stocks.length} stocks...`);
    
    // Fetch historical data and run SB-Scan for each stock (in parallel batches)
    const batchSize = 10;
    const results: SBScanResult[] = [];
    
    for (let i = 0; i < stocks.length; i += batchSize) {
      const batch = stocks.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (stock) => {
          try {
            // Fetch 60 days of historical data (lightweight)
            const history = await fetchHistoricalData(stock.ticker, 0.16); // ~60 days
            
            if (history && history.candles && history.candles.length >= 10) {
              const candles: PriceData[] = history.candles.map(c => ({
                date: c.date,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume,
              }));
              
              return sbScan(stock.ticker, stock.name, candles, stock.price);
            }
            return null;
          } catch (error) {
            console.warn(`SB-Scan: Failed to process ${stock.ticker}:`, error);
            return null;
          }
        })
      );
      
      // Filter out nulls and add to results
      batchResults.forEach(result => {
        if (result) results.push(result);
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < stocks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Sort by SB-Score descending
    results.sort((a, b) => b.sbScore - a.sbScore);
    
    // Update cache
    sbScanCache = {
      results,
      timestamp: Date.now(),
    };
    
    console.log(`📊 SB-Scan: Completed - ${results.length} stocks scanned`);
    
    return NextResponse.json({
      results: results.slice(0, limit),
      totalCount: results.length,
      fromCache: false,
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('SB-Scan API error:', error);
    
    // Return cached results if available, even if expired
    if (sbScanCache && sbScanCache.results.length > 0) {
      return NextResponse.json({
        results: sbScanCache.results.slice(0, limit),
        totalCount: sbScanCache.results.length,
        fromCache: true,
        stale: true,
        cacheAge: Math.round((Date.now() - sbScanCache.timestamp) / 1000),
        lastUpdated: new Date(sbScanCache.timestamp).toISOString(),
        error: 'Using stale cache due to error',
      });
    }
    
    return NextResponse.json({
      results: [],
      totalCount: 0,
      error: 'Failed to run SB-Scan',
    }, { status: 500 });
  }
}
