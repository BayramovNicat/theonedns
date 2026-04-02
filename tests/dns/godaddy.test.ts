import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { godaddyAdapter } from '../../lib/dns/godaddy';
import { mockJson, mockJsonThrows, setFetch } from './helpers';

const CREDS = { api_key: 'key', api_secret: 'secret' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('godaddyAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({}, 200));
    expect(await godaddyAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401/403', async () => {
    setFetch(mockJson({}, 401));
    const r = await godaddyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api key/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await godaddyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('GoDaddyProvider.listRecords', () => {
  it('maps records and encodes composite IDs', async () => {
    setFetch(
      mockJson([
        { name: '@', type: 'A', data: '1.2.3.4', ttl: 3600 },
        { name: 'www', type: 'CNAME', data: 'proxy.example.com', ttl: 600 },
      ]),
    );
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: 'A:@',
      name: DOMAIN,
      type: 'A',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({
      id: 'CNAME:www',
      name: 'www.example.com',
    });
  });

  it('returns empty on failed fetch', async () => {
    setFetch(mockJson({}, 401));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('GoDaddyProvider.createRecord', () => {
  it('returns composite id', async () => {
    setFetch(mockJson({}, 200));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'mail',
      type: 'MX',
      content: 'mx.example.com',
      priority: 10,
    });
    expect(result.id).toBe('MX:mail');
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Duplicate' }, 422));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Duplicate');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('GoDaddyProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:www', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:www', { content: '1' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:www', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('GoDaddyProvider.deleteRecord', () => {
  it('resolves on 200', async () => {
    setFetch(mockJson({}, 200));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).resolves.toBeUndefined();
  });

  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ message: 'Server error' }, 500));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).rejects.toThrow(
      'Server error',
    );
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = godaddyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
