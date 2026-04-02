import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { vultrAdapter } from '../../lib/dns/vultr';
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

describe('vultrAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({}, 200));
    expect(await vultrAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401/403', async () => {
    setFetch(mockJson({}, 401));
    const r = await vultrAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api token/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await vultrAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('VultrProvider.listRecords', () => {
  it('maps records with empty name to domain', async () => {
    setFetch(
      mockJson({
        records: [
          { id: 'r1', name: '', type: 'A', data: '1.2.3.4', ttl: 300 },
          {
            id: 'r2',
            name: 'www',
            type: 'CNAME',
            data: 'target.com',
            ttl: 600,
          },
        ],
        meta: { links: { next: '' } },
      }),
    );
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0].name).toBe(DOMAIN);
    expect(records[1].name).toBe('www.example.com');
    expect(records[1].content).toBe('target.com');
  });

  it('follows cursor pagination', async () => {
    setFetch(
      mockSequence([
        mockJson({
          records: [{ id: 'r1', name: 'a', type: 'A', data: '1.1.1.1' }],
          meta: { links: { next: 'cursor1' } },
        }),
        mockJson({
          records: [{ id: 'r2', name: 'b', type: 'A', data: '2.2.2.2' }],
          meta: { links: { next: '' } },
        }),
      ]),
    );
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(2);
  });
});

describe('VultrProvider.createRecord', () => {
  it('returns id from record', async () => {
    setFetch(mockJson({ record: { id: 'new-id' } }, 201));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: 'new-id' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: 'Duplicate' }, 400));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Duplicate');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('VultrProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 204));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: 'Not found' }, 404));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('VultrProvider.deleteRecord', () => {
  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ error: 'Server error' }, 500));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow('Server error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = vultrAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
