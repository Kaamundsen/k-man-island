type CacheEntry<T> = { key: string; value: T; ts: number };

const mem = new Map<string, CacheEntry<any>>();

export function cacheGet<T>(key: string): T | null {
  const hit = mem.get(key);
  return hit ? (hit.value as T) : null;
}

export function cacheSet<T>(key: string, value: T): void {
  mem.set(key, { key, value, ts: Date.now() });
}

export function makeCoreCacheKey(
  asOfDate: string,
  version: string,
  universeHash: string
): string {
  return `core:${version}:${asOfDate}:${universeHash}`;
}
