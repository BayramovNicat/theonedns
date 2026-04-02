import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { namecomAdapter } from '../../lib/dns/namecom';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { username: 'user', api_token: 'token' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('namecomAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({ domainName: DOMAIN }, 200));
    expect(await namecomAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await namecomAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/username|api token/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await namecomAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it('sends Basic auth header', async () => {
    let authHeader = '';
    setFetch(
      mock((_, init?: RequestInit) => {
        authHeader =
          (init?.headers as Record<string, string>)?.Authorization ?? '';
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({}),
        } as Response);
      }),
    );
    await namecomAdapter.verify(CREDS, DOMAIN);
    expect(authHeader).toMatch(/^Basic /);
    // base64 of "user:token"
    expect(authHeader).toBe(`Basic ${btoa('user:token')}`);
  });
});

describe('NamecomProvider.listRecords', () => {
  it('maps fqdn trimming trailing dot', async () => {
    setFetch(
      mockJson({
        records: [
          {
            id: 1,
            fqdn: 'example.com.',
            type: 'A',
            answer: '1.2.3.4',
            ttl: 300,
          },
          {
            id: 2,
            fqdn: 'www.example.com.',
            type: 'CNAME',
            answer: 'target.com',
            ttl: 600,
          },
        ],
      }),
    );
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records[0]).toMatchObject({
      id: '1',
      name: 'example.com',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({ name: 'www.example.com' });
  });

  it('paginates via nextPage', async () => {
    setFetch(
      mockSequence([
        mockJson({
          records: [
            { id: 1, fqdn: 'a.example.com.', type: 'A', answer: '1.1.1.1' },
          ],
          nextPage: 2,
        }),
        mockJson({
          records: [
            { id: 2, fqdn: 'b.example.com.', type: 'A', answer: '2.2.2.2' },
          ],
        }),
      ]),
    );
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(2);
  });
});

describe('NamecomProvider.createRecord', () => {
  it('returns id from response', async () => {
    setFetch(mockJson({ id: 55 }, 201));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '55' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Conflict' }, 409));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Conflict');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('NamecomProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({ id: 1 }, 200));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('NamecomProvider.deleteRecord', () => {
  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('resolves on 404 (idempotent)', async () => {
    setFetch(mockJson({}, 404));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = namecomAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
