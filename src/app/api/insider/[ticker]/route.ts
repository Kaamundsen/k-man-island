import { NextRequest, NextResponse } from 'next/server';
import { getInsiderTransactions } from '@/lib/api/finnhub';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker;
    const data = await getInsiderTransactions(ticker);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in insider API:', error);
    return NextResponse.json({ error: 'Failed to fetch insider data' }, { status: 500 });
  }
}
