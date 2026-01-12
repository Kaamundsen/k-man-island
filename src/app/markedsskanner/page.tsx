import { Suspense } from 'react';
import MarkedsskannerContent from '@/components/MarkedsskannerContent';
import { fetchLiveStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MarkedsskannerPage() {
  // Fetch live data, fallback to mock if fails
  let stocks = await fetchLiveStockData();
  
  if (stocks.length === 0) {
    console.warn('⚠️ Using mock data as fallback - API failed');
    stocks = mockStocks;
  }

  return (
    <Suspense fallback={<div className="p-8">Laster markedsskanner...</div>}>
      <MarkedsskannerContent stocks={stocks} />
    </Suspense>
  );
}
