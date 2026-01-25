import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import StockAnalyseContent from '@/components/StockAnalyseContent';
import { fetchLiveStockData, fetchSingleStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AnalysePageProps {
  params: Promise<{
    ticker: string;
  }>;
}

export default async function AnalysePage({ params }: AnalysePageProps) {
  const { ticker } = await params;
  
  // Fetch live data, fallback to mock if fails
  let stocks = await fetchLiveStockData();
  
  if (stocks.length === 0) {
    console.warn('⚠️ Using mock data as fallback - API failed');
    stocks = mockStocks;
  }

  // Find the stock - try with and without .OL suffix
  let stock = stocks.find(s => 
    s.ticker === ticker || 
    s.ticker === `${ticker}.OL` ||
    s.ticker.replace('.OL', '') === ticker
  );

  // If not found in main list, try to fetch single stock data
  if (!stock) {
    const normalizedTicker = ticker.toUpperCase().endsWith('.OL') 
      ? ticker.toUpperCase() 
      : `${ticker.toUpperCase()}.OL`;
    
    console.log(`Stock ${normalizedTicker} not in main list, fetching single stock data...`);
    
    const singleStockData = await fetchSingleStockData(normalizedTicker);
    
    if (singleStockData) {
      stock = singleStockData;
      // Add to stocks array for context
      stocks = [...stocks, singleStockData];
    }
  }

  if (!stock) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-8">Laster analyse...</div>}>
      <StockAnalyseContent stock={stock} allStocks={stocks} />
    </Suspense>
  );
}
