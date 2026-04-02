import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { porkbunAdapter } from '../../lib/dns/porkbun';
import { mockJson, mockJsonThrows, setFetch } from './helpers';

const CREDS = { api_key: 'pk1_key', secret_api_key: 'sk1_secret' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('porkbunAdapter.verify', () => {
  it('returns valid:true when status is SUCCESS', async () => {
    setFetch(mockJson({ status: 'SUCCESS' }, 200));
    expect(await porkbunAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid when status is not SUCCESS', async () => {
    setFetch(mockJson({ status: 'ERROR', message: 'Domain not found' }, 200));
    const r = await porkbunAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Domain not found');
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await porkbunAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api key/i);
  });
});

describe('PorkbunProvider.listRecords', () => {
  it('maps records including ttl and priority conversion', async () => {
    setFetch(
      mockJson({
        status: 'SUCCESS',
        records: [
          {
            id: '1',
            name: 'example.com',
            type: 'A',
            content: '1.2.3.4',
            ttl: '300',
            prio: '0',
          },
          {
            id: '2',
            name: 'mail.example.com',
            type: 'MX',
            content: 'mx.example.com',
            ttl: '600',
            prio: '10',
          },
        ],
      }),
    );
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: '1',
      type: 'A',
      content: '1.2.3.4',
      ttl: 300,
    });
    expect(records[1]).toMatchObject({ id: '2', type: 'MX', priority: 10 });
  });

  it('returns empty on failed fetch', async () => {
    setFetch(mockJson({}, 500));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });

  it('returns empty when status is not SUCCESS', async () => {
    setFetch(mockJson({ status: 'ERROR' }, 200));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('PorkbunProvider.createRecord', () => {
  it('returns id from response', async () => {
    setFetch(mockJson({ id: '42' }, 200));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '42' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Record exists' }, 400));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Record exists');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('PorkbunProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({ status: 'SUCCESS' }, 200));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('PorkbunProvider.deleteRecord', () => {
  it('resolves on 200', async () => {
    setFetch(mockJson({ status: 'SUCCESS' }, 200));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('resolves on 404 (already gone)', async () => {
    setFetch(mockJson({}, 404));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = porkbunAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
