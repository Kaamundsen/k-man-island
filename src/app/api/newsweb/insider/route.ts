import { NextResponse } from 'next/server';
import { fetchInsiderNotices, getRecentInsiderBuys } from '@/lib/api/newsweb';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const days = parseInt(searchParams.get('days') || '30');
    const buysOnly = searchParams.get('buysOnly') === 'true';
    
    let notices;
    
    if (buysOnly) {
      notices = await getRecentInsiderBuys(days);
    } else {
      notices = await fetchInsiderNotices();
    }
    
    // Filter by ticker if provided
    if (ticker) {
      const normalizedTicker = ticker.toUpperCase().replace('.OL', '');
      notices = notices.filter(n => 
        n.ticker.toUpperCase().replace('.OL', '') === normalizedTicker
      );
    }
    
    return NextResponse.json({
      success: true,
      count: notices.length,
      notices,
    });
  } catch (error) {
    console.error('Error in insider API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insider data' },
      { status: 500 }
    );
  }
}
