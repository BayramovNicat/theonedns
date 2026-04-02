import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { cloudflareAdapter } from '../../lib/dns/cloudflare';

const CREDS = { api_token: 'test-token', zone_id: 'zone-abc' };
const DOMAIN = 'example.com';

type FakeFetch = (url: unknown, init?: RequestInit) => Promise<Response>;

// Cast once here so every call site stays clean
function setFetch(fn: FakeFetch) {
  globalThis.fetch = fn as unknown as typeof fetch;
}

// Helper: build a mock fetch that returns the given body
function mockFetch(body: unknown, ok = true): FakeFetch {
  return mock(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
    } as Response),
  );
}

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ── verify ─────────────────────────────────────────────────────────────────

describe('cloudflareAdapter.verify', () => {
  it('returns valid:true when the API call succeeds', async () => {
    setFetch(mockFetch({ success: true }));
    const result = await cloudflareAdapter.verify(CREDS, DOMAIN);
    expect(result).toEqual({ valid: true });
  });

  it('returns valid:false with error message on failure', async () => {
    setFetch(
      mockFetch({ success: false, errors: [{ message: 'Invalid API token' }] }),
    );
    const result = await cloudflareAdapter.verify(CREDS, DOMAIN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid API token');
  });

  it('falls back to a default error message when no errors array', async () => {
    setFetch(mockFetch({ success: false }));
    const result = await cloudflareAdapter.verify(CREDS, DOMAIN);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid token or zone ID');
  });

  it('sends Authorization header with the token', async () => {
    let capturedInit: RequestInit | undefined;
    setFetch(
      mock((_url: unknown, init?: RequestInit) => {
        capturedInit = init;
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }),
    );

    await cloudflareAdapter.verify(CREDS, DOMAIN);
    expect(
      (capturedInit?.headers as Record<string, string>)?.Authorization,
    ).toBe('Bearer test-token');
  });
});

// ── createProvider / listRecords ───────────────────────────────────────────

describe('CloudflareProvider.listRecords', () => {
  it('returns mapped records from a single page', async () => {
    setFetch(
      mockFetch({
        success: true,
        result: [
          {
            id: 'r1',
            name: 'example.com',
            type: 'A',
            content: '1.2.3.4',
            ttl: 1,
            proxied: false,
          },
          {
            id: 'r2',
            name: 'mail.example.com',
            type: 'MX',
            content: 'mx.example.com',
            ttl: 3600,
            priority: 10,
          },
        ],
      }),
    );

    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();

    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      id: 'r1',
      name: 'example.com',
      type: 'A',
      content: '1.2.3.4',
      ttl: undefined, // ttl=1 maps to undefined
      priority: undefined,
      proxied: false,
    });
    expect(records[1].ttl).toBe(3600);
    expect(records[1].priority).toBe(10);
  });

  it('paginates until a page has fewer than 100 results', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      name: 'example.com',
      type: 'A',
      content: `1.1.1.${i}`,
      ttl: 3600,
    }));
    const page2 = [
      {
        id: 'r100',
        name: 'example.com',
        type: 'A',
        content: '2.2.2.2',
        ttl: 3600,
      },
    ];

    let call = 0;
    setFetch(
      mock(() => {
        const result = call++ === 0 ? page1 : page2;
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, result }),
        } as Response);
      }),
    );

    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(101);
  });
});

// ── createRecord ───────────────────────────────────────────────────────────

describe('CloudflareProvider.createRecord', () => {
  it('returns the new record id on success', async () => {
    setFetch(mockFetch({ success: true, result: { id: 'new-id' } }));
    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'www',
      type: 'A',
      content: '1.2.3.4',
    });
    expect(result).toEqual({ id: 'new-id' });
  });

  it('throws with the API error message on failure', async () => {
    setFetch(
      mockFetch({
        success: false,
        errors: [{ message: 'Record already exists' }],
      }),
    );
    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).rejects.toThrow('Record already exists');
  });

  it('includes priority in the request body when provided', async () => {
    let capturedBody: unknown;
    setFetch(
      mock((_url: unknown, init?: RequestInit) => {
        capturedBody = JSON.parse(init?.body as string);
        return Promise.resolve({
          json: () => Promise.resolve({ success: true, result: { id: 'x' } }),
        } as Response);
      }),
    );

    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await provider.createRecord({
      subdomain: 'mail',
      type: 'MX',
      content: 'mx.example.com',
      priority: 10,
    });
    expect((capturedBody as Record<string, unknown>).priority).toBe(10);
  });
});

// ── updateRecord ───────────────────────────────────────────────────────────

describe('CloudflareProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockFetch({ success: true }));
    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('rec-id', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockFetch({ success: false, errors: [{ message: 'Not found' }] }));
    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('rec-id', { content: '5.6.7.8' }),
    ).rejects.toThrow('Not found');
  });
});

// ── deleteRecord ───────────────────────────────────────────────────────────

describe('CloudflareProvider.deleteRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockFetch({ success: true, result: { id: 'rec-id' } }));
    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('rec-id')).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(
      mockFetch({ success: false, errors: [{ message: 'Record not found' }] }),
    );
    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('rec-id')).rejects.toThrow(
      'Record not found',
    );
  });

  it('uses DELETE method', async () => {
    let method: string | undefined;
    setFetch(
      mock((_url: unknown, init?: RequestInit) => {
        method = init?.method;
        return Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        } as Response);
      }),
    );

    const provider = cloudflareAdapter.createProvider(CREDS, DOMAIN);
    await provider.deleteRecord('rec-id');
    expect(method).toBe('DELETE');
  });
});
