import { NextRequest, NextResponse } from 'next/server';
import { getCompanyNews } from '@/lib/api/finnhub';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker;
    const data = await getCompanyNews(ticker);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
