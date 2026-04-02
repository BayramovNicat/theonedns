import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { bunnyAdapter } from '../../lib/dns/bunny';
import { mockJson, mockJsonThrows, setFetch } from './helpers';

const CREDS = { api_key: 'test-key', zone_id: '123' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('bunnyAdapter.verify', () => {
  it('returns valid:true on success', async () => {
    setFetch(mockJson({}, 200));
    expect(await bunnyAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401', async () => {
    setFetch(mockJson({}, 401));
    const r = await bunnyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('Invalid API key');
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await bunnyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toBe('DNS zone not found');
  });

  it('returns generic error for other status', async () => {
    setFetch(mockJson({}, 500));
    const r = await bunnyAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('500');
  });
});

describe('BunnyProvider.listRecords', () => {
  it('maps numeric type IDs to string type names', async () => {
    setFetch(
      mockJson({
        Records: [
          {
            Id: 1,
            Name: 'www',
            Type: 0,
            Value: '1.2.3.4',
            Ttl: 300,
            Priority: 0,
          },
          {
            Id: 2,
            Name: '',
            Type: 3,
            Value: 'mail.example.com',
            Ttl: 600,
            Priority: 10,
          },
        ],
      }),
    );
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: '1',
      name: 'www.example.com',
      type: 'A',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({
      id: '2',
      name: DOMAIN,
      type: 'MX',
      priority: 10,
    });
  });

  it('skips records with unknown type IDs', async () => {
    setFetch(
      mockJson({
        Records: [{ Id: 9, Name: 'x', Type: 99, Value: 'v', Ttl: 300 }],
      }),
    );
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(0);
  });

  it('returns empty array on failed fetch', async () => {
    setFetch(mockJson({}, 500));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('BunnyProvider.createRecord', () => {
  it('returns the new record id', async () => {
    setFetch(mockJson({ Id: 42 }, 201));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    expect(
      await provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).toEqual({ id: '42' });
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ Message: 'Duplicate record' }, 422));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({
        subdomain: 'www',
        type: 'A',
        content: '1.2.3.4',
      }),
    ).rejects.toThrow('Duplicate record');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'www', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });

  it('sends PUT method', async () => {
    let method: string | undefined;
    setFetch(
      mock((_, init?: RequestInit) => {
        method = init?.method;
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ Id: 1 }),
        } as Response);
      }),
    );
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await provider.createRecord({ subdomain: 'x', type: 'TXT', content: 'v' });
    expect(method).toBe('PUT');
  });
});

describe('BunnyProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ Message: 'Not found' }, 404));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('BunnyProvider.deleteRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 200));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('resolves on 404 (already gone)', async () => {
    setFetch(mockJson({}, 404));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ Message: 'Server error' }, 500));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow('Server error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = bunnyAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
