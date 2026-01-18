// Redis-kompatibel cache med in-memory fallback
// Kan enkelt byttes til Redis ved å sette REDIS_URL environment variable

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

// In-memory cache (fallback når Redis ikke er tilgjengelig)
const memoryCache = new Map<string, CacheEntry<unknown>>();

// Cache-konfigurasjoner for ulike datatyper
export const CACHE_TTL = {
  STOCK_QUOTES: 30 * 1000,           // 30 sekunder - live priser
  HISTORICAL_DATA: 24 * 60 * 60 * 1000,  // 24 timer - historisk data
  ANALYSIS: 5 * 60 * 1000,           // 5 minutter - analyser
  NEWS: 15 * 60 * 1000,              // 15 minutter - nyheter
  EARNINGS: 6 * 60 * 60 * 1000,      // 6 timer - earnings kalender
};

// Redis client (lazy-loaded)
let redisClient: RedisLikeClient | null = null;

interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX?: number }): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

async function getRedisClient(): Promise<RedisLikeClient | null> {
  if (redisClient) return redisClient;
  
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('📦 Using in-memory cache (no REDIS_URL configured)');
    return null;
  }
  
  try {
    // Dynamisk import for å unngå build-feil hvis redis ikke er installert
    const { createClient } = await import('redis');
    const client = createClient({ url: redisUrl });
    await client.connect();
    redisClient = client as unknown as RedisLikeClient;
    console.log('🔴 Connected to Redis');
    return redisClient;
  } catch (error) {
    console.warn('⚠️ Redis connection failed, using in-memory cache:', error);
    return null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  
  if (redis) {
    try {
      const data = await redis.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }
  }
  
  // Fallback til memory cache
  const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  
  // Expired eller ikke funnet
  if (entry) {
    memoryCache.delete(key);
  }
  
  return null;
}

export async function cacheSet<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const redis = await getRedisClient();
  
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), { EX: Math.floor(ttlMs / 1000) });
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  
  // Alltid sett i memory cache som backup
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export async function cacheDelete(key: string): Promise<void> {
  const redis = await getRedisClient();
  
  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }
  
  memoryCache.delete(key);
}

export async function cacheClear(pattern?: string): Promise<void> {
  const redis = await getRedisClient();
  
  if (redis && pattern) {
    try {
      const keys = await redis.keys(pattern);
      for (const key of keys) {
        await redis.del(key);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }
  
  // Clear memory cache
  if (pattern) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }
}

// Hjelpefunksjoner for spesifikke cache-typer
export async function getStockQuote(ticker: string): Promise<unknown | null> {
  return cacheGet(`quote:${ticker}`);
}

export async function setStockQuote(ticker: string, data: unknown): Promise<void> {
  return cacheSet(`quote:${ticker}`, data, CACHE_TTL.STOCK_QUOTES);
}

export async function getHistoricalData(ticker: string): Promise<unknown | null> {
  return cacheGet(`history:${ticker}`);
}

export async function setHistoricalData(ticker: string, data: unknown): Promise<void> {
  return cacheSet(`history:${ticker}`, data, CACHE_TTL.HISTORICAL_DATA);
}

export async function getAnalysis(ticker: string): Promise<unknown | null> {
  return cacheGet(`analysis:${ticker}`);
}

export async function setAnalysis(ticker: string, data: unknown): Promise<void> {
  return cacheSet(`analysis:${ticker}`, data, CACHE_TTL.ANALYSIS);
}

// Cache statistikk
export function getCacheStats(): {
  memoryEntries: number;
  memorySize: string;
  redisConnected: boolean;
} {
  let memorySize = 0;
  for (const [, value] of memoryCache) {
    memorySize += JSON.stringify(value).length;
  }
  
  return {
    memoryEntries: memoryCache.size,
    memorySize: `${(memorySize / 1024).toFixed(2)} KB`,
    redisConnected: redisClient !== null,
  };
}
