// AI/ML-basert prediksjonsmodul
// Forberedt for fremtidig integrasjon med maskinlæringsmodeller

import { Stock } from '@/lib/types';

export interface PredictionInput {
  ticker: string;
  currentPrice: number;
  historicalPrices: number[];  // Siste 60 dager
  volume: number[];
  kScore: number;
  rsi: number;
  sma50?: number;
  sma200?: number;
}

export interface PredictionOutput {
  ticker: string;
  predictedDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  confidence: number;  // 0-100
  predictedPriceChange: number;  // Prosent
  timeHorizon: string;
  keyFactors: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Enkel regelbasert "AI" prediksjon (kan erstattes med ML-modell senere)
export function predictStockMovement(input: PredictionInput): PredictionOutput {
  let confidence = 50;
  let direction: 'UP' | 'DOWN' | 'SIDEWAYS' = 'SIDEWAYS';
  let predictedChange = 0;
  const factors: string[] = [];
  
  // K-Score analyse
  if (input.kScore >= 80) {
    confidence += 15;
    direction = 'UP';
    predictedChange += 3;
    factors.push('Høy K-Score indikerer sterk momentum');
  } else if (input.kScore >= 70) {
    confidence += 10;
    direction = 'UP';
    predictedChange += 2;
    factors.push('God K-Score tyder på positiv trend');
  } else if (input.kScore < 50) {
    confidence += 10;
    direction = 'DOWN';
    predictedChange -= 2;
    factors.push('Lav K-Score varsler om svakhet');
  }
  
  // RSI analyse
  if (input.rsi >= 70) {
    if (direction === 'UP') {
      confidence -= 10;
      factors.push('RSI overkjøpt - mulig kortsiktig korreksjon');
    }
  } else if (input.rsi <= 30) {
    if (direction === 'DOWN') {
      confidence -= 10;
      factors.push('RSI oversolgt - mulig bounce');
    }
  } else if (input.rsi >= 45 && input.rsi <= 55) {
    confidence += 5;
    factors.push('RSI i sunn midtsone');
  }
  
  // SMA analyse
  if (input.sma50 && input.sma200) {
    if (input.currentPrice > input.sma50 && input.sma50 > input.sma200) {
      confidence += 10;
      if (direction !== 'DOWN') direction = 'UP';
      predictedChange += 1;
      factors.push('Golden cross - pris over SMA50 og SMA200');
    } else if (input.currentPrice < input.sma50 && input.sma50 < input.sma200) {
      confidence += 10;
      if (direction !== 'UP') direction = 'DOWN';
      predictedChange -= 1;
      factors.push('Death cross - pris under SMA50 og SMA200');
    }
  }
  
  // Pris-momentum (siste 5 dager)
  if (input.historicalPrices.length >= 5) {
    const recent5 = input.historicalPrices.slice(-5);
    const momentum = ((recent5[4] - recent5[0]) / recent5[0]) * 100;
    
    if (momentum > 3) {
      confidence += 5;
      predictedChange += 1;
      factors.push(`Sterk kortsiktig momentum (+${momentum.toFixed(1)}% siste 5 dager)`);
    } else if (momentum < -3) {
      confidence += 5;
      predictedChange -= 1;
      factors.push(`Negativ kortsiktig momentum (${momentum.toFixed(1)}% siste 5 dager)`);
    }
  }
  
  // Volum-analyse
  if (input.volume.length >= 20) {
    const avgVolume = input.volume.slice(0, -5).reduce((a, b) => a + b, 0) / (input.volume.length - 5);
    const recentVolume = input.volume.slice(-5).reduce((a, b) => a + b, 0) / 5;
    
    if (recentVolume > avgVolume * 1.5) {
      confidence += 5;
      factors.push('Økende volum bekrefter trend');
    }
  }
  
  // Juster retning basert på predictedChange
  if (predictedChange > 1) direction = 'UP';
  else if (predictedChange < -1) direction = 'DOWN';
  else direction = 'SIDEWAYS';
  
  // Bestem risiko
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (confidence >= 70 && Math.abs(predictedChange) <= 5) {
    riskLevel = 'LOW';
  } else if (confidence < 50 || Math.abs(predictedChange) > 10) {
    riskLevel = 'HIGH';
  }
  
  return {
    ticker: input.ticker,
    predictedDirection: direction,
    confidence: Math.min(95, Math.max(30, confidence)),
    predictedPriceChange: predictedChange,
    timeHorizon: '2-4 uker',
    keyFactors: factors.slice(0, 4),
    riskLevel,
  };
}

// Batch-prediksjon for flere aksjer
export function predictMultipleStocks(stocks: Stock[]): PredictionOutput[] {
  return stocks.map(stock => {
    // Simuler historisk data siden vi ikke har det direkte
    const historicalPrices = Array.from({ length: 60 }, (_, i) => 
      stock.price * (1 + (Math.random() - 0.5) * 0.02 * (60 - i) / 60)
    );
    
    const volume = Array.from({ length: 20 }, () => 
      1000000 + Math.random() * 500000
    );
    
    return predictStockMovement({
      ticker: stock.ticker,
      currentPrice: stock.price,
      historicalPrices,
      volume,
      kScore: stock.kScore,
      rsi: stock.rsi,
      sma50: (stock as any).sma50 ?? ((stock as any).sma?.["50"] ?? null),
      sma200: (stock as any).sma200 ?? ((stock as any).sma?.["200"] ?? null),
    });
  });
}

// Eksporter prediksjoner som kan vises i UI
export function formatPrediction(prediction: PredictionOutput): string {
  const emoji = prediction.predictedDirection === 'UP' ? '📈' :
                prediction.predictedDirection === 'DOWN' ? '📉' : '➡️';
  
  return `${emoji} ${prediction.ticker.replace('.OL', '')}: ` +
         `${prediction.predictedDirection} (${prediction.confidence}% sikkerhet) - ` +
         `Forventet ${prediction.predictedPriceChange >= 0 ? '+' : ''}${prediction.predictedPriceChange.toFixed(1)}%`;
}
