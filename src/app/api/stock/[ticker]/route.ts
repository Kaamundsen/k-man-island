import { NextResponse } from 'next/server';
import { fetchSingleStockData } from '@/lib/api/stock-data';
import { isInBaseUniverse } from '@/lib/store/universe-store';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ ticker: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { ticker } = await params;
    
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker is required' },
        { status: 400 }
      );
    }
    
    // Normalize ticker
    const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
      ? ticker.toUpperCase() 
      : `${ticker.toUpperCase()}.OL`;
    
    // Check if ticker exists in our known universe
    const isKnown = isInBaseUniverse(normalizedTicker);
    
    // Fetch stock data
    const stockData = await fetchSingleStockData(normalizedTicker);
    
    if (!stockData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Stock not found',
          ticker: normalizedTicker,
          isKnown,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      ticker: normalizedTicker,
      isKnown,
      data: stockData,
    });
  } catch (error) {
    console.error('Error in stock API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
