import { mock } from 'bun:test';

mock.module('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

import { describe, expect, it, spyOn } from 'bun:test';
import { rateLimit } from '../lib/rate-limit';

// Use unique key prefixes per describe block to avoid shared bucket state
let keyCounter = 0;
function uniqueKey(prefix = 'test') {
  return `${prefix}-${++keyCounter}`;
}

describe('rateLimit — first request', () => {
  it('returns null (allowed) for a brand new key', () => {
    expect(rateLimit(uniqueKey(), 5, 60_000)).toBeNull();
  });
});

describe('rateLimit — token consumption', () => {
  it('allows up to max requests then denies the next', () => {
    const key = uniqueKey();
    const max = 3;

    // First request consumes one token on creation (max-1 remain)
    expect(rateLimit(key, max, 60_000)).toBeNull();
    expect(rateLimit(key, max, 60_000)).toBeNull();
    expect(rateLimit(key, max, 60_000)).toBeNull();
    // 4th request: bucket empty
    const res = rateLimit(key, max, 60_000);
    expect(res).not.toBeNull();
    expect((res as { status: number }).status).toBe(429);
  });

  it('returns a 429 response body mentioning "Too many requests"', () => {
    const key = uniqueKey();
    rateLimit(key, 1, 60_000); // uses the 1 token
    const res = rateLimit(key, 1, 60_000) as unknown as {
      body: { error: string };
      status: number;
    };
    expect(res).not.toBeNull();
    expect(res.body.error).toMatch(/too many requests/i);
    expect(res.status).toBe(429);
  });
});

describe('rateLimit — refill', () => {
  it('refills tokens after the window elapses', () => {
    const key = uniqueKey();
    const max = 2;
    const now = Date.now();
    const spy = spyOn(Date, 'now');

    // t=0: drain bucket
    spy.mockReturnValue(now);
    rateLimit(key, max, 1_000); // 1 token left
    rateLimit(key, max, 1_000); // 0 tokens

    // t=0: denied
    expect(rateLimit(key, max, 1_000)).not.toBeNull();

    // t=1001ms: full window elapsed → full refill
    spy.mockReturnValue(now + 1_001);
    expect(rateLimit(key, max, 1_000)).toBeNull();

    spy.mockRestore();
  });

  it('does not refill when insufficient time has passed', () => {
    const key = uniqueKey();
    const max = 1;
    const now = Date.now();
    const spy = spyOn(Date, 'now');

    spy.mockReturnValue(now);
    rateLimit(key, max, 60_000); // uses the only token

    // t=100ms: nowhere near a full window
    spy.mockReturnValue(now + 100);
    expect(rateLimit(key, max, 60_000)).not.toBeNull();

    spy.mockRestore();
  });
});

describe('rateLimit — cleanup', () => {
  it('runs cleanup without error when called repeatedly', () => {
    const now = Date.now();
    const spy = spyOn(Date, 'now');

    // Advance time > 60s to trigger cleanup
    spy.mockReturnValue(now + 61_000);
    expect(() => rateLimit(uniqueKey(), 10, 60_000)).not.toThrow();

    spy.mockRestore();
  });
});

describe('rateLimit — default parameters', () => {
  it('uses max=30 and windowMs=60000 by default', () => {
    const key = uniqueKey();
    // Drain all 30 tokens
    for (let i = 0; i < 30; i++) {
      expect(rateLimit(key)).toBeNull();
    }
    expect(rateLimit(key)).not.toBeNull();
  });
});
