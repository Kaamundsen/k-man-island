import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ChartDataPoint {
  date: string;
  price: number;
}

/**
 * Henter historiske priser fra Yahoo Finance for prisgrafen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  let ticker = params.ticker.toUpperCase();
  
  // Fjern eventuelle suffixer som allerede finnes for å normalisere
  ticker = ticker.replace('.OL', '').replace('.CO', '').replace('.ST', '');
  
  // Legg til .OL suffix for Oslo Børs aksjer
  // Spesielle tilfeller for andre børser
  let fullTicker = `${ticker}.OL`;
  
  // Danske aksjer (Novo Nordisk etc)
  if (ticker === 'NOVO-B' || ticker === 'NOVOB' || ticker === 'NOVO') {
    fullTicker = 'NOVO-B.CO';
  }
  
  console.log(`📈 Fetching chart data for ${fullTicker}...`);
  
  try {
    // Hent 3 måneder med daglige priser
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (90 * 24 * 60 * 60); // 90 dager
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${fullTicker}?period1=${startDate}&period2=${endDate}&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      next: { revalidate: 3600 }, // Cache i 1 time
    });
    
    if (!response.ok) {
      console.error(`Yahoo Finance error for ${fullTicker}: ${response.status}`);
      return NextResponse.json(
        { error: `Kunne ikke hente data for ${fullTicker}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return NextResponse.json(
        { error: `Ingen historisk data for ${fullTicker}` },
        { status: 404 }
      );
    }
    
    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const closes = quotes.close;
    
    // Bygg chart data array
    const chartData: ChartDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      const closePrice = closes[i];
      
      // Hopp over manglende data
      if (closePrice === null || closePrice === undefined) continue;
      
      const date = new Date(timestamps[i] * 1000);
      
      chartData.push({
        date: date.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }),
        price: Number(closePrice.toFixed(2)),
      });
    }
    
    console.log(`✅ Chart data for ${fullTicker}: ${chartData.length} datapunkter`);
    
    return NextResponse.json({
      ticker: fullTicker,
      data: chartData,
      lastPrice: chartData.length > 0 ? chartData[chartData.length - 1].price : null,
    });
    
  } catch (error) {
    console.error(`Error fetching chart data for ${fullTicker}:`, error);
    return NextResponse.json(
      { error: `Feil ved henting av data for ${fullTicker}` },
      { status: 500 }
    );
  }
}
