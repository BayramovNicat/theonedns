import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { linodeAdapter } from '../../lib/dns/linode';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { api_token: 'test-token', domain_id: '555' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('linodeAdapter.verify', () => {
  it('returns valid:true when domain found in list', async () => {
    setFetch(mockJson({ data: [{ domain: DOMAIN }] }));
    expect(await linodeAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid when domain not in list', async () => {
    setFetch(mockJson({ data: [{ domain: 'other.com' }] }));
    const r = await linodeAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await linodeAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Invalid API token');
  });

  it('returns invalid on other error', async () => {
    setFetch(mockJson({}, 500));
    const r = await linodeAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('500');
  });
});

describe('LinodeProvider.listRecords', () => {
  it('maps records with empty name to domain', async () => {
    setFetch(
      mockJson({
        data: [
          { id: 1, name: '', type: 'A', target: '1.2.3.4', ttl_sec: 300 },
          {
            id: 2,
            name: 'www',
            type: 'CNAME',
            target: 'target.com',
            ttl_sec: 0,
          },
        ],
        pages: 1,
      }),
    );
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0]).toMatchObject({
      id: '1',
      name: DOMAIN,
      content: '1.2.3.4',
      ttl: 300,
    });
    expect(records[1]).toMatchObject({
      name: 'www.example.com',
      ttl: undefined,
    });
  });

  it('paginates', async () => {
    setFetch(
      mockSequence([
        mockJson({
          data: [
            { id: 1, name: 'a', type: 'A', target: '1.1.1.1', ttl_sec: 300 },
          ],
          pages: 2,
        }),
        mockJson({
          data: [
            { id: 2, name: 'b', type: 'A', target: '2.2.2.2', ttl_sec: 300 },
          ],
          pages: 2,
        }),
      ]),
    );
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(2);
  });
});

describe('LinodeProvider.createRecord', () => {
  it('returns id from response', async () => {
    setFetch(mockJson({ id: 77 }, 200));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '77' });
  });

  it('throws with Linode error reason', async () => {
    setFetch(mockJson({ errors: [{ reason: 'TTL out of range' }] }, 400));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('TTL out of range');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('LinodeProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({ id: 1 }, 200));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ errors: [{ reason: 'Not found' }] }, 404));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('LinodeProvider.deleteRecord', () => {
  it('resolves on 200', async () => {
    setFetch(mockJson({}, 200));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ errors: [{ reason: 'Error' }] }, 500));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = linodeAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
