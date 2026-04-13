import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalData, DailyCandle } from '@/lib/api/historical-data';
import { getFinnhubCandles } from '@/lib/api/finnhub';
import { MIN_BARS_FOR_ANALYSIS, RECOMMENDED_BARS } from '@/lib/constants';

/**
 * GET /api/chart/[ticker]
 * 
 * Returns historical candle data for charts.
 * Primary: Yahoo Finance (2 years)
 * Fallback: Finnhub (250 days)
 * 
 * Query params:
 *   - days: number (default: 180)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '180', 10);
  
  console.log(`📊 Chart API: Fetching ${days} days for ${ticker}`);
  
  try {
    // Try Yahoo Finance first (preferred - 2 years of data)
    const history = await fetchHistoricalData(ticker, 2);
    
    if (history && history.candles.length >= 30) {
      // Sort by date ascending (oldest first)
      const sortedCandles = [...history.candles].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Limit to requested days
      const limitedCandles = sortedCandles.slice(-days);
      
      console.log(`✅ Yahoo Finance: ${limitedCandles.length} candles for ${ticker}`);
      
      return NextResponse.json({
        ticker,
        source: 'yahoo',
        candles: limitedCandles,
        count: limitedCandles.length,
        totalAvailable: history.candles.length,
        lastUpdated: history.lastUpdated,
        insufficientHistory: history.candles.length < MIN_BARS_FOR_ANALYSIS,
        minBarsRequired: MIN_BARS_FOR_ANALYSIS,
      });
    }
    
    // Fallback to Finnhub
    console.log(`⚠️ Yahoo failed for ${ticker}, trying Finnhub...`);
    const finnhubData = await getFinnhubCandles(ticker, Math.min(days, 365));
    
    if (finnhubData && finnhubData.c && finnhubData.c.length > 0) {
      const candles: DailyCandle[] = finnhubData.t.map((timestamp, i) => ({
        date: new Date(timestamp * 1000).toISOString().split('T')[0],
        open: finnhubData.o[i],
        high: finnhubData.h[i],
        low: finnhubData.l[i],
        close: finnhubData.c[i],
        volume: finnhubData.v[i],
        change: i > 0 ? finnhubData.c[i] - finnhubData.c[i - 1] : 0,
        changePercent: i > 0 
          ? ((finnhubData.c[i] - finnhubData.c[i - 1]) / finnhubData.c[i - 1]) * 100 
          : 0,
      }));
      
      console.log(`✅ Finnhub: ${candles.length} candles for ${ticker}`);
      
      return NextResponse.json({
        ticker,
        source: 'finnhub',
        candles,
        count: candles.length,
        totalAvailable: candles.length,
        lastUpdated: new Date().toISOString(),
        insufficientHistory: candles.length < MIN_BARS_FOR_ANALYSIS,
        minBarsRequired: MIN_BARS_FOR_ANALYSIS,
      });
    }
    
    // Complete fallback - deterministic fake data with clear warning
    console.warn(`❌ No data sources available for ${ticker}, using fallback`);
    
    return NextResponse.json({
      ticker,
      source: 'fallback',
      candles: [],
      count: 0,
      totalAvailable: 0,
      lastUpdated: new Date().toISOString(),
      insufficientHistory: true,
      error: 'No data available - both Yahoo Finance and Finnhub failed',
    }, { status: 503 });
    
  } catch (error) {
    console.error(`Chart API error for ${ticker}:`, error);
    
    return NextResponse.json({
      ticker,
      source: 'error',
      candles: [],
      count: 0,
      totalAvailable: 0,
      lastUpdated: new Date().toISOString(),
      insufficientHistory: true,
      error: 'Failed to fetch chart data',
    }, { status: 500 });
  }
}
