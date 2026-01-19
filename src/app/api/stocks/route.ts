import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveStockData } from '@/lib/api/stock-data';

/**
 * GET /api/stocks
 * 
 * Fetch live stock data from Yahoo Finance.
 * Query params:
 *   - limit: number (optional, default: 50, max: 100)
 *   - refresh: boolean (optional, force fresh fetch)
 * 
 * Returns:
 *   - stocks: Stock[]
 *   - timestamp: ISO string
 *   - count: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    
    console.log(`🔄 API /stocks - Refreshing stock data (limit: ${limit})...`);
    
    const stocks = await fetchLiveStockData(limit);
    
    if (stocks.length === 0) {
      return NextResponse.json(
        { 
          error: 'No stock data available',
          timestamp: new Date().toISOString(),
          count: 0,
        },
        { status: 503 }
      );
    }
    
    console.log(`✅ API /stocks - Returning ${stocks.length} stocks`);
    
    return NextResponse.json({
      stocks,
      timestamp: new Date().toISOString(),
      count: stocks.length,
    });
    
  } catch (error) {
    console.error('Error in /api/stocks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
