import { Suspense } from 'react';
import AnalyseContent from '@/components/AnalyseContent';
import { fetchLiveStockData } from '@/lib/api/stock-data';
import { mockStocks } from '@/lib/mock-data';

// Disable caching - always fetch fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalysePage() {
  // Fetch live data, fallback to mock if fails
  let stocks = await fetchLiveStockData();
  
  if (stocks.length === 0) {
    console.warn('⚠️ Using mock data as fallback - API failed');
    stocks = mockStocks;
  }

  return (
    <Suspense fallback={<div className="p-8">Laster analyse...</div>}>
      <AnalyseContent stocks={stocks} />
    </Suspense>
  );
}
