import { Suspense } from 'react';
import DashboardClient from '@/components/DashboardClient';
import { fetchAllStocksWithKMomentum, fetchLiveStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';
import { isFinnhubEnabled, logProviderStatus } from '@/lib/api/market-provider';

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
  // Log provider status once at startup
  logProviderStatus();
  
  let stocks;
  
  // Use Finnhub only if explicitly enabled via environment variable
  if (isFinnhubEnabled()) {
    try {
      stocks = await fetchAllStocksWithKMomentum();
      
      if (stocks.length === 0) {
        // Fallback to Yahoo (already logged by provider)
        stocks = await fetchLiveStockData();
      }
    } catch (error) {
      // Fallback to Yahoo on error
      stocks = await fetchLiveStockData();
    }
  } else {
    // Default: Yahoo Finance
    stocks = await fetchLiveStockData();
  }
  
  // Final fallback to mock data
  if (stocks.length === 0) {
    console.log('⚠️ Using mock data as fallback');
    stocks = mockStocks;
  }

  const timestamp = new Date().toISOString();
  console.log(`✅ Loaded ${stocks.length} stocks`);

  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardClient initialStocks={stocks} initialTimestamp={timestamp} />
    </Suspense>
  );
}
