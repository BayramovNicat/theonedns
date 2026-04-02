import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { hostingerAdapter } from '../../lib/dns/hostinger';
import { mockJson, mockJsonThrows, setFetch } from './helpers';

const CREDS = { api_token: 'test-token' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('hostingerAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson([], 200));
    expect(await hostingerAdapter.verify(CREDS, DOMAIN)).toEqual({
      valid: true,
    });
  });

  it('returns invalid on 401/403', async () => {
    setFetch(mockJson({}, 401));
    const r = await hostingerAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api token/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await hostingerAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('HostingerProvider.listRecords', () => {
  it('maps empty name to domain', async () => {
    setFetch(
      mockJson([
        { id: 1, name: '', type: 'A', content: '1.2.3.4', ttl: 300 },
        {
          id: 2,
          name: 'www',
          type: 'CNAME',
          content: 'target.com',
          ttl: 600,
          priority: undefined,
        },
      ]),
    );
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0]).toMatchObject({
      id: '1',
      name: DOMAIN,
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({ name: 'www.example.com' });
  });

  it('returns empty on failed fetch', async () => {
    setFetch(mockJson({}, 500));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('HostingerProvider.createRecord', () => {
  it('returns id from response', async () => {
    setFetch(mockJson({ id: 88 }, 201));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '88' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Invalid' }, 422));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Invalid');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('HostingerProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('HostingerProvider.deleteRecord', () => {
  it('resolves on 200', async () => {
    setFetch(mockJson({}, 200));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('resolves on 404 (idempotent)', async () => {
    setFetch(mockJson({}, 404));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = hostingerAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
