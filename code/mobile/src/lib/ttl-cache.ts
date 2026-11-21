interface CacheEntry<T> {
  data: T;
  updatedAt: number;
  ttlMs: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  return entry ? (entry.data as T) : null;
}

export function isCacheFresh(key: string): boolean {
  const entry = cacheStore.get(key);
  if (!entry) return false;
  return Date.now() - entry.updatedAt < entry.ttlMs;
}

export function setCached<T>(key: string, data: T, ttlMs = 45_000): void {
  cacheStore.set(key, {
    data,
    updatedAt: Date.now(),
    ttlMs,
  });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}

export function clearAllCache(): void {
  cacheStore.clear();
}
