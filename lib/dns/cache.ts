import type { DnsRecord } from './types';

type CacheEntry = {
  records: DnsRecord[];
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000; // 30 seconds

export function getCachedRecords(key: string): DnsRecord[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.records;
}

export function setCachedRecords(key: string, records: DnsRecord[]): void {
  cache.set(key, { records, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}
