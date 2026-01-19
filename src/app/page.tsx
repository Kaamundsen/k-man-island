import { Suspense } from 'react';
import DashboardClient from '@/components/DashboardClient';
import { fetchAllStocksWithKMomentum, fetchLiveStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';

// Disable caching for now - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Loading component
function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="h-10 bg-muted rounded w-64 mb-4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted rounded-3xl h-96 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  console.log('🚀 Starting K-Momentum data fetch...');
  
  let stocks;
  const useKMomentum = process.env.NEXT_PUBLIC_FINNHUB_API_KEY !== undefined;
  
  if (useKMomentum) {
    console.log('✨ Using K-Momentum strategy with Finnhub');
    try {
      stocks = await fetchAllStocksWithKMomentum();
      
      if (stocks.length === 0) {
        console.warn('⚠️ K-Momentum returned no stocks, falling back to Yahoo Finance');
        stocks = await fetchLiveStockData();
      }
    } catch (error) {
      console.error('❌ K-Momentum failed:', error);
      console.log('⚠️ Falling back to Yahoo Finance');
      stocks = await fetchLiveStockData();
    }
  } else {
    console.log('⚠️ No Finnhub API key, using Yahoo Finance fallback');
    stocks = await fetchLiveStockData();
  }
  
  // Final fallback to mock data
  if (stocks.length === 0) {
    console.warn('⚠️ Using mock data as final fallback');
    stocks = mockStocks;
  }

  const timestamp = new Date().toISOString();
  console.log(`✅ Loaded ${stocks.length} stocks for dashboard at ${timestamp}`);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient initialStocks={stocks} initialTimestamp={timestamp} />
    </Suspense>
  );
}
