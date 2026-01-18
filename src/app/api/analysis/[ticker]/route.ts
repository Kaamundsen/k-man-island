import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchHistoricalData, 
  analyzeStockHistory, 
  calculateValidatedKScore,
  isSpikeStock,
  getSeasonalRecommendation,
  StockAnalysisProfile
} from '@/lib/api/historical-data';

export const dynamic = 'force-dynamic';

interface AnalysisResult {
  ticker: string;
  name: string;
  profile: StockAnalysisProfile;
  kScore: number;
  isSpikeStock: boolean;
  seasonal: {
    recommendation: 'buy' | 'hold' | 'avoid';
    reason: string;
  };
  lastUpdated: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker.toUpperCase();
  
  // Legg til .OL suffix hvis mangler (for Oslo Børs)
  const fullTicker = ticker.includes('.') ? ticker : `${ticker}.OL`;
  
  console.log(`📊 Analyzing ${fullTicker}...`);
  
  try {
    // Hent historisk data
    const history = await fetchHistoricalData(fullTicker, 2);
    
    if (!history || history.candles.length < 50) {
      return NextResponse.json(
        { error: `Ikke nok historisk data for ${fullTicker}` },
        { status: 404 }
      );
    }
    
    // Analyser
    const profile = analyzeStockHistory(history);
    const kScore = calculateValidatedKScore(profile);
    const spikeStock = isSpikeStock(profile);
    const seasonal = getSeasonalRecommendation(profile);
    
    const result: AnalysisResult = {
      ticker: fullTicker,
      name: history.name,
      profile,
      kScore,
      isSpikeStock: spikeStock,
      seasonal,
      lastUpdated: history.lastUpdated,
    };
    
    console.log(`✅ Analysis complete for ${fullTicker}: K-Score ${kScore}, Spike: ${spikeStock}`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`Error analyzing ${fullTicker}:`, error);
    return NextResponse.json(
      { error: `Feil ved analyse av ${fullTicker}` },
      { status: 500 }
    );
  }
}
