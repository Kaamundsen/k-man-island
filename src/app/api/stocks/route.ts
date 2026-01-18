import { NextResponse } from 'next/server';
import { fetchLiveStockData } from '@/lib/api/stock-data';

// API route for å hente ferske aksjedata
export async function GET() {
  try {
    console.log('🔄 Refreshing stock data via API...');
    const stocks = await fetchLiveStockData();
    
    if (stocks.length === 0) {
      return NextResponse.json(
        { error: 'No stock data available' },
        { status: 503 }
      );
    }
    
    console.log(`✅ Returning ${stocks.length} stocks`);
    return NextResponse.json({
      stocks,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
