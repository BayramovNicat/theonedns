import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { vercelAdapter } from '../../lib/dns/vercel';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { api_token: 'test-token' };
const CREDS_TEAM = { api_token: 'test-token', team_id: 'team-xyz' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('vercelAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({}, 200));
    expect(await vercelAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await vercelAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Invalid API token');
  });

  it('returns invalid on 403', async () => {
    setFetch(mockJson({}, 403));
    const r = await vercelAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/permission/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await vercelAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it('appends teamId to query when provided', async () => {
    let capturedUrl = '';
    setFetch(
      mock((url: unknown) => {
        capturedUrl = String(url);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        } as Response);
      }),
    );
    await vercelAdapter.verify(CREDS_TEAM, DOMAIN);
    expect(capturedUrl).toContain('teamId=team-xyz');
  });
});

describe('VercelProvider.listRecords', () => {
  it('maps records correctly', async () => {
    setFetch(
      mockJson({
        records: [
          {
            id: 'r1',
            name: 'www',
            type: 'CNAME',
            value: 'cname.vercel-dns.com',
            ttl: 60,
          },
          {
            id: 'r2',
            name: '',
            type: 'A',
            value: '1.2.3.4',
            ttl: 300,
            mxPriority: undefined,
          },
        ],
        pagination: null,
      }),
    );
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: 'r1',
      name: 'www.example.com',
      type: 'CNAME',
      content: 'cname.vercel-dns.com',
    });
    expect(records[1]).toMatchObject({ id: 'r2', name: DOMAIN, type: 'A' });
  });

  it('paginates via pagination.next', async () => {
    setFetch(
      mockSequence([
        mockJson({
          records: [{ id: 'r1', name: 'a', type: 'A', value: '1.1.1.1' }],
          pagination: { next: 9999 },
        }),
        mockJson({
          records: [{ id: 'r2', name: 'b', type: 'A', value: '2.2.2.2' }],
          pagination: null,
        }),
      ]),
    );
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(2);
  });

  it('stops on failed request', async () => {
    setFetch(mockJson({}, 401));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('VercelProvider.createRecord', () => {
  it('returns uid as id', async () => {
    setFetch(mockJson({ uid: 'new-uid' }, 200));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: 'new-uid' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: { message: 'Already exists' } }, 409));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).rejects.toThrow('Already exists');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'www', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('VercelProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: { message: 'Not found' } }, 404));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('r1', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('VercelProvider.deleteRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ error: { message: 'Not found' } }, 404));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = vercelAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('r1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
