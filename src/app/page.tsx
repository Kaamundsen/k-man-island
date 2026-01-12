import { Suspense } from 'react';
import DashboardContent from '@/components/DashboardContent';
import { fetchLiveStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';

// Disable caching for now - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  console.log('Fetching stock data...');
  
  // Fetch live data, fallback to mock if fails
  let stocks = await fetchLiveStockData();
  
  console.log(`Fetched ${stocks.length} stocks from API`);
  
  // If no live data, use mock data
  if (stocks.length === 0) {
    console.warn('⚠️ Using mock data as fallback - API failed');
    stocks = mockStocks;
  } else {
    console.log('✓ Using live data from Yahoo Finance');
  }

  return (
    <Suspense fallback={<div className="p-8">Laster...</div>}>
      <DashboardContent initialStocks={stocks} />
    </Suspense>
  );
}
