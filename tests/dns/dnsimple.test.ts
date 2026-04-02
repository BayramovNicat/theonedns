import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dnsimpleAdapter } from '../../lib/dns/dnsimple';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { api_token: 'test-token', account_id: 'acct-1' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('dnsimpleAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({ data: {} }, 200));
    expect(await dnsimpleAdapter.verify(CREDS, DOMAIN)).toEqual({
      valid: true,
    });
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await dnsimpleAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Invalid API token');
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await dnsimpleAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('DNSimpleProvider.listRecords', () => {
  it('maps records from data array', async () => {
    setFetch(
      mockJson({
        data: [
          { id: 1, name: '', type: 'A', content: '1.2.3.4', ttl: 3600 },
          {
            id: 2,
            name: 'www',
            type: 'CNAME',
            content: 'target.com',
            ttl: 600,
          },
        ],
        pagination: { total_pages: 1 },
      }),
    );
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({ id: '1', name: DOMAIN, type: 'A' });
    expect(records[1]).toMatchObject({ id: '2', name: 'www.example.com' });
  });

  it('paginates across multiple pages', async () => {
    setFetch(
      mockSequence([
        mockJson({
          data: [{ id: 1, name: 'a', type: 'A', content: '1.1.1.1', ttl: 300 }],
          pagination: { total_pages: 2 },
        }),
        mockJson({
          data: [{ id: 2, name: 'b', type: 'A', content: '2.2.2.2', ttl: 300 }],
          pagination: { total_pages: 2 },
        }),
      ]),
    );
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(2);
  });
});

describe('DNSimpleProvider.createRecord', () => {
  it('returns id from data.id', async () => {
    setFetch(mockJson({ data: { id: 99 } }, 201));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '99' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Validation failed' }, 422));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Validation failed');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('DNSimpleProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({ data: {} }, 200));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('DNSimpleProvider.deleteRecord', () => {
  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = dnsimpleAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
