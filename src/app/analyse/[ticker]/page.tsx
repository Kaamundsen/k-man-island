import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import StockAnalyseContent from '@/components/StockAnalyseContent';
import { fetchLiveStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AnalysePageProps {
  params: {
    ticker: string;
  };
}

export default async function AnalysePage({ params }: AnalysePageProps) {
  // Fetch live data, fallback to mock if fails
  let stocks = await fetchLiveStockData();
  
  if (stocks.length === 0) {
    console.warn('⚠️ Using mock data as fallback - API failed');
    stocks = mockStocks;
  }

  // Find the stock - try with and without .OL suffix
  const ticker = params.ticker;
  const stock = stocks.find(s => 
    s.ticker === ticker || 
    s.ticker === `${ticker}.OL` ||
    s.ticker.replace('.OL', '') === ticker
  );

  if (!stock) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8">Laster analyse...</div>}>
      <StockAnalyseContent stock={stock} allStocks={stocks} />
    </Suspense>
  );
}
