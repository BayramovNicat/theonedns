import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { digitaloceanAdapter } from '../../lib/dns/digitalocean';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { api_token: 'test-token' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('digitaloceanAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({ domain: { name: DOMAIN } }, 200));
    expect(await digitaloceanAdapter.verify(CREDS, DOMAIN)).toEqual({
      valid: true,
    });
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await digitaloceanAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api token/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await digitaloceanAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it('returns generic error for other statuses', async () => {
    setFetch(mockJson({}, 500));
    const r = await digitaloceanAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('500');
  });
});

describe('DigitalOceanProvider.listRecords', () => {
  it('maps @ name to domain', async () => {
    setFetch(
      mockJson({
        domain_records: [
          { id: 1, name: '@', type: 'A', data: '1.2.3.4', ttl: 3600 },
          {
            id: 2,
            name: 'www',
            type: 'CNAME',
            data: 'target.com',
            ttl: 600,
            priority: undefined,
          },
        ],
        links: {},
      }),
    );
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0]).toMatchObject({
      id: '1',
      name: DOMAIN,
      type: 'A',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({ id: '2', name: 'www.example.com' });
  });

  it('paginates via links.pages.next', async () => {
    setFetch(
      mockSequence([
        mockJson({
          domain_records: [{ id: 1, name: 'a', type: 'A', data: '1.1.1.1' }],
          links: { pages: { next: 'url' } },
        }),
        mockJson({
          domain_records: [{ id: 2, name: 'b', type: 'A', data: '2.2.2.2' }],
          links: {},
        }),
      ]),
    );
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(2);
  });

  it('stops on failed fetch', async () => {
    setFetch(mockJson({}, 500));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('DigitalOceanProvider.createRecord', () => {
  it('returns id from domain_record', async () => {
    setFetch(mockJson({ domain_record: { id: 99 } }, 201));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '99' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Invalid' }, 422));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Invalid');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('DigitalOceanProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({ domain_record: {} }, 200));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('DigitalOceanProvider.deleteRecord', () => {
  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = digitaloceanAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
