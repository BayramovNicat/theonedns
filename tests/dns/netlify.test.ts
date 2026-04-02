import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { netlifyAdapter } from '../../lib/dns/netlify';
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

describe('netlifyAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({ id: 'zone-1' }, 200));
    expect(await netlifyAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await netlifyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/token/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await netlifyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('NetlifyProvider.listRecords', () => {
  it('maps hostname and value fields', async () => {
    setFetch(
      mockJson([
        {
          id: 'r1',
          hostname: 'example.com',
          type: 'A',
          value: '1.2.3.4',
          ttl: 3600,
        },
      ]),
    );
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0]).toMatchObject({
      id: 'r1',
      name: 'example.com',
      type: 'A',
      content: '1.2.3.4',
    });
  });

  it('paginates until page has fewer than 100 records', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      hostname: 'h',
      type: 'A',
      value: '1.1.1.1',
    }));
    const page2 = [{ id: 'r100', hostname: 'h', type: 'A', value: '2.2.2.2' }];
    setFetch(mockSequence([mockJson(page1), mockJson(page2)]));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(101);
  });
});

describe('NetlifyProvider.createRecord', () => {
  it('returns id from response', async () => {
    setFetch(mockJson({ id: 'new-id' }, 201));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: 'new-id' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Invalid' }, 422));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Invalid');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('NetlifyProvider.updateRecord', () => {
  // updateRecord: GET existing → DELETE → POST new
  it('resolves on success (3 fetches)', async () => {
    setFetch(
      mockSequence([
        mockJson({
          id: 'r1',
          type: 'A',
          hostname: 'www.example.com',
          ttl: 3600,
        }),
        mockJson({}, 204),
        mockJson({ id: 'r2' }, 201),
      ]),
    );
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws if GET fails', async () => {
    setFetch(mockJson({}, 404));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '1' }),
    ).rejects.toThrow();
  });

  it('throws if DELETE fails', async () => {
    setFetch(
      mockSequence([
        mockJson({
          id: 'r1',
          type: 'A',
          hostname: 'www.example.com',
          ttl: 3600,
        }),
        mockJson({ message: 'Cannot delete' }, 500),
      ]),
    );
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: '1' }),
    ).rejects.toThrow();
  });
});

describe('NetlifyProvider.deleteRecord', () => {
  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = netlifyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
