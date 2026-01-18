import { NextResponse } from 'next/server';
import { fetchLiveStockData } from '@/lib/api/stock-data';

// API route for automatisk nattlig analyse
// Kan kalles fra en ekstern cron-tjeneste (f.eks. cron-job.org, Vercel Cron, GitHub Actions)
// Anbefalt kjøretid: 06:00 CET (før børsåpning)

export async function GET(request: Request) {
  // Verifiser at request kommer fra autorisert kilde
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // I produksjon, verifiser secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    console.log('🌙 Starting nightly analysis cron job...');
    
    // Hent ferske data og kjør full analyse
    const stocks = await fetchLiveStockData();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Sammenstill resultat
    const summary = {
      timestamp: new Date().toISOString(),
      duration: `${duration}s`,
      stocksAnalyzed: stocks.length,
      buySignals: stocks.filter(s => s.signal === 'BUY').length,
      holdSignals: stocks.filter(s => s.signal === 'HOLD').length,
      sellSignals: stocks.filter(s => s.signal === 'SELL').length,
      topStocks: stocks
        .filter(s => s.signal === 'BUY')
        .sort((a, b) => b.kScore - a.kScore)
        .slice(0, 5)
        .map(s => ({
          ticker: s.ticker,
          name: s.name,
          kScore: s.kScore,
          changePercent: s.changePercent,
        })),
    };
    
    console.log('✅ Nightly analysis complete:', summary);
    
    // Her kan man også:
    // - Sende email-varsler
    // - Lagre til database
    // - Trigge push-notifikasjoner
    
    return NextResponse.json({
      success: true,
      message: 'Nightly analysis completed',
      summary,
    });
    
  } catch (error) {
    console.error('❌ Nightly analysis failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Eksempel cron-job setup:
// 
// 1. Vercel Cron (vercel.json):
// {
//   "crons": [{
//     "path": "/api/cron/analyse",
//     "schedule": "0 5 * * 1-5"  // 05:00 UTC (06:00 CET) på hverdager
//   }]
// }
//
// 2. GitHub Actions:
// name: Nightly Analysis
// on:
//   schedule:
//     - cron: '0 5 * * 1-5'
// jobs:
//   analyze:
//     runs-on: ubuntu-latest
//     steps:
//       - name: Trigger Analysis
//         run: |
//           curl -X GET "https://your-domain.com/api/cron/analyse" \
//             -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
//
// 3. cron-job.org (gratis):
// URL: https://your-domain.com/api/cron/analyse
// Schedule: 0 5 * * 1-5
// Headers: Authorization: Bearer YOUR_SECRET
