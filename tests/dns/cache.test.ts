import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import {
  getCachedRecords,
  invalidateCache,
  setCachedRecords,
} from '../../lib/dns/cache';
import type { DnsRecord } from '../../lib/dns/types';

const KEY = 'test-key';

const RECORDS: DnsRecord[] = [
  { id: '1', name: 'example.com', type: 'A', content: '1.2.3.4' },
  {
    id: '2',
    name: 'mail.example.com',
    type: 'MX',
    content: 'mail.example.com',
    priority: 10,
  },
];

afterEach(() => {
  invalidateCache(KEY);
});

describe('getCachedRecords', () => {
  it('returns null when no entry exists', () => {
    expect(getCachedRecords('no-such-key')).toBeNull();
  });

  it('returns records after they are set', () => {
    setCachedRecords(KEY, RECORDS);
    const result = getCachedRecords(KEY);
    expect(result).toEqual(RECORDS);
  });

  it('returns null after the TTL expires', () => {
    const now = Date.now();
    const dateSpy = spyOn(Date, 'now');

    // Set at t=now
    dateSpy.mockReturnValue(now);
    setCachedRecords(KEY, RECORDS);

    // Read at t=now+31s (past the 30s TTL)
    dateSpy.mockReturnValue(now + 31_000);
    const result = getCachedRecords(KEY);

    dateSpy.mockRestore();
    expect(result).toBeNull();
  });

  it('still returns records just before TTL expires', () => {
    const now = Date.now();
    const dateSpy = spyOn(Date, 'now');

    dateSpy.mockReturnValue(now);
    setCachedRecords(KEY, RECORDS);

    dateSpy.mockReturnValue(now + 29_000);
    const result = getCachedRecords(KEY);

    dateSpy.mockRestore();
    expect(result).toEqual(RECORDS);
  });
});

describe('setCachedRecords', () => {
  it('overwrites existing entry', () => {
    const updated: DnsRecord[] = [
      {
        id: '99',
        name: 'new.example.com',
        type: 'CNAME',
        content: 'target.com',
      },
    ];
    setCachedRecords(KEY, RECORDS);
    setCachedRecords(KEY, updated);
    expect(getCachedRecords(KEY)).toEqual(updated);
  });

  it('stores an empty array', () => {
    setCachedRecords(KEY, []);
    expect(getCachedRecords(KEY)).toEqual([]);
  });
});

describe('invalidateCache', () => {
  it('removes an existing entry', () => {
    setCachedRecords(KEY, RECORDS);
    invalidateCache(KEY);
    expect(getCachedRecords(KEY)).toBeNull();
  });

  it('is a no-op for a non-existent key', () => {
    expect(() => invalidateCache('ghost-key')).not.toThrow();
  });
});
