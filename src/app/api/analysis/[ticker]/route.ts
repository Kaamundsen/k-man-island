import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalData, analyzeStockHistory, calculateValidatedKScore } from '@/lib/api/historical-data';
import { analyzeKMomentum, DEFAULT_CONFIG } from '@/lib/api/k-momentum';
import { getFinnhubCandles, getFinnhubQuote } from '@/lib/api/finnhub';
import { MIN_BARS_FOR_ANALYSIS, RECOMMENDED_BARS } from '@/lib/constants';

/**
 * GET /api/analysis/[ticker]
 * 
 * Full technical analysis using historical data.
 * Requires minimum 200 days of history for reliable signals.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params.ticker;
  
  console.log(`🔬 Analysis API: Running analysis for ${ticker}`);
  
  try {
    // 1. Fetch historical data
    const history = await fetchHistoricalData(ticker, 2);
    
    let dataSource: 'yahoo' | 'finnhub' | 'fallback' = 'fallback';
    let historyDays = 0;
    let candles: any = null;
    let currentPrice = 0;
    
    if (history && history.candles.length > 0) {
      dataSource = 'yahoo';
      historyDays = history.candles.length;
      currentPrice = history.candles[history.candles.length - 1].close;
      
      // Convert to Finnhub format for K-Momentum analysis
      candles = {
        c: history.candles.map(c => c.close),
        h: history.candles.map(c => c.high),
        l: history.candles.map(c => c.low),
        o: history.candles.map(c => c.open),
        v: history.candles.map(c => c.volume),
        t: history.candles.map(c => new Date(c.date).getTime() / 1000),
        s: 'ok',
      };
    } else {
      // Fallback to Finnhub
      console.log(`⚠️ Yahoo failed for ${ticker}, trying Finnhub...`);
      const finnhubCandles = await getFinnhubCandles(ticker, 500);
      const quote = await getFinnhubQuote(ticker);
      
      if (finnhubCandles && finnhubCandles.c && finnhubCandles.c.length > 0) {
        dataSource = 'finnhub';
        historyDays = finnhubCandles.c.length;
        currentPrice = quote?.c || finnhubCandles.c[finnhubCandles.c.length - 1];
        candles = finnhubCandles;
      }
    }
    
    const insufficientHistory = historyDays < MIN_BARS_FOR_ANALYSIS;
    
    // 2. GUARDRAIL: If insufficient history, return HOLD with warning - NO BUY/SELL allowed
    if (insufficientHistory || !candles) {
      console.warn(`⚠️ GUARDRAIL: Insufficient history for ${ticker}: ${historyDays}/${MIN_BARS_FOR_ANALYSIS} days - signal blocked`);
      
      return NextResponse.json({
        ticker,
        dataSource,
        historyDays,
        insufficientHistory: true,
        minBarsRequired: MIN_BARS_FOR_ANALYSIS,
        recommendedBars: RECOMMENDED_BARS,
        analysis: {
          signal: 'HOLD', // ALWAYS HOLD when insufficient data - guardrail
          signalBlocked: true,
          kScore: 50, // Neutral score
          rsi: 50,
          confidence: 'none',
          reason: `GUARDRAIL: Utilstrekkelig historikk (${historyDays}/${MIN_BARS_FOR_ANALYSIS} dager) - signal sperret`,
          warnings: [
            'BUY/SELL-signaler er sperret pga utilstrekkelig data',
            `Minimum ${MIN_BARS_FOR_ANALYSIS} dager kreves, anbefalt ${RECOMMENDED_BARS} dager`,
          ],
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    // 3. Run K-Momentum analysis
    const kmResult = analyzeKMomentum(candles, currentPrice, DEFAULT_CONFIG);
    
    // 4. Calculate validated K-Score if we have enough data
    let validatedKScore = kmResult.score;
    let profile = null;
    
    if (history && historyDays >= 250) {
      try {
        profile = analyzeStockHistory(history);
        validatedKScore = calculateValidatedKScore(profile);
      } catch (err) {
        console.warn(`Could not calculate validated K-Score for ${ticker}:`, err);
      }
    }
    
    // 5. Determine signal with safety checks
    let signal: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
    let confidence: 'high' | 'medium' | 'low' = 'low';
    
    if (kmResult.passed && validatedKScore >= 70) {
      signal = 'BUY';
      confidence = historyDays >= 400 ? 'high' : 'medium';
    } else if (!kmResult.passed && kmResult.failedFilters.length > 2) {
      signal = 'SELL';
      confidence = 'medium';
    }
    
    // 6. Calculate RSI
    const rsi = calculateRSI(candles.c, 14);
    
    console.log(`✅ Analysis complete for ${ticker}: ${signal} (K-Score: ${validatedKScore}, History: ${historyDays}d)`);
    
    return NextResponse.json({
      ticker,
      dataSource,
      historyDays,
      insufficientHistory: false,
      analysis: {
        signal,
        kScore: validatedKScore,
        rsi: Math.round(rsi * 10) / 10,
        confidence,
        kmResult: {
          passed: kmResult.passed,
          score: kmResult.score,
          failedFilters: kmResult.failedFilters,
          suggestedEntry: kmResult.suggestedEntry,
          suggestedStop: kmResult.suggestedStop,
          suggestedTarget: kmResult.suggestedTarget,
          riskRewardRatio: kmResult.riskRewardRatio,
        },
        profile: profile ? {
          return1m: profile.return1m,
          return3m: profile.return3m,
          return6m: profile.return6m,
          currentVsSMA50: profile.currentVsSMA50,
          currentVsSMA200: profile.currentVsSMA200,
          avgDailyMove: profile.avgDailyMove,
          spikeFrequency: profile.spikeFrequency,
        } : null,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error(`Analysis API error for ${ticker}:`, error);
    
    return NextResponse.json({
      ticker,
      dataSource: 'error',
      historyDays: 0,
      insufficientHistory: true,
      analysis: {
        signal: 'HOLD',
        kScore: 50,
        rsi: 50,
        confidence: 'low',
        reason: 'Analyse feilet',
        warnings: ['Kunne ikke kjøre analyse'],
      },
      error: 'Failed to analyze stock',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * Calculate RSI
 */
function calculateRSI(closes: number[], period: number = 14): number {
  if (closes.length < period + 1) return 50;
  
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  
  const recentChanges = changes.slice(-period);
  const gains = recentChanges.filter(c => c > 0).reduce((sum, c) => sum + c, 0) / period;
  const losses = Math.abs(recentChanges.filter(c => c < 0).reduce((sum, c) => sum + c, 0)) / period;
  
  if (losses === 0) return 100;
  
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}
