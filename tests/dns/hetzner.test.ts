import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { hetznerAdapter } from '../../lib/dns/hetzner';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { api_token: 'test-token', zone_id: 'zone-1' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('hetznerAdapter.verify', () => {
  it('returns valid:true when zone matches', async () => {
    setFetch(mockJson({ zones: [{ name: DOMAIN }] }, 200));
    expect(await hetznerAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid when zone not in list', async () => {
    setFetch(mockJson({ zones: [{ name: 'other.com' }] }, 200));
    const r = await hetznerAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await hetznerAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Invalid API token');
  });

  it('returns invalid on other errors', async () => {
    setFetch(mockJson({}, 500));
    const r = await hetznerAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('500');
  });
});

describe('HetznerProvider.listRecords', () => {
  it('maps @ name to domain', async () => {
    setFetch(
      mockJson({
        records: [
          { id: 'r1', name: '@', type: 'A', value: '1.2.3.4', ttl: 300 },
          {
            id: 'r2',
            name: 'www',
            type: 'CNAME',
            value: 'example.com',
            ttl: 3600,
          },
        ],
      }),
    );
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0].name).toBe(DOMAIN);
    expect(records[1].name).toBe('www.example.com');
  });

  it('returns empty on failed fetch', async () => {
    setFetch(mockJson({}, 500));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('HetznerProvider.createRecord', () => {
  it('returns id from response', async () => {
    setFetch(mockJson({ record: { id: 'new-id' } }, 201));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: 'new-id' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: { message: 'Invalid record' } }, 422));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'w', type: 'A', content: '1' }),
    ).rejects.toThrow('Invalid record');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('HetznerProvider.updateRecord', () => {
  // Hetzner updateRecord fetches existing record first, then PUTs
  it('resolves on success', async () => {
    setFetch(
      mockSequence([
        mockJson({ record: { type: 'A', name: 'www', ttl: 300 } }),
        mockJson({ record: { id: 'r1' } }),
      ]),
    );
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws if GET fails', async () => {
    setFetch(mockJson({}, 404));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '5.6.7.8' }),
    ).rejects.toThrow();
  });

  it('throws if PUT fails', async () => {
    setFetch(
      mockSequence([
        mockJson({ record: { type: 'A', name: 'www', ttl: 300 } }),
        mockJson({ error: { message: 'Conflict' } }, 409),
      ]),
    );
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '5.6.7.8' }),
    ).rejects.toThrow('Conflict');
  });

  it('uses fallback message when PUT response body is not JSON', async () => {
    setFetch(
      mockSequence([
        mockJson({ record: { type: 'A', name: 'www', ttl: 300 } }),
        mockJsonThrows(500),
      ]),
    );
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '5.6.7.8' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('HetznerProvider.deleteRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: { message: 'Not found' } }, 422));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = hetznerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
