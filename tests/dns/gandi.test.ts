import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { gandiAdapter } from '../../lib/dns/gandi';
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

describe('gandiAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({}, 200));
    expect(await gandiAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401/403', async () => {
    setFetch(mockJson({}, 401));
    const r = await gandiAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api token/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await gandiAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('GandiProvider.listRecords', () => {
  it('expands rrsets with multiple values into individual records', async () => {
    setFetch(
      mockJson([
        {
          rrset_name: '@',
          rrset_type: 'A',
          rrset_values: ['1.2.3.4', '5.6.7.8'],
          rrset_ttl: 300,
        },
        {
          rrset_name: 'www',
          rrset_type: 'CNAME',
          rrset_values: ['target.com'],
          rrset_ttl: 600,
        },
      ]),
    );
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    // Two values for @ means two records
    expect(records).toHaveLength(3);
    expect(records[0]).toMatchObject({
      id: 'A:@',
      name: DOMAIN,
      type: 'A',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({
      id: 'A:@',
      name: DOMAIN,
      type: 'A',
      content: '5.6.7.8',
    });
    expect(records[2]).toMatchObject({
      id: 'CNAME:www',
      name: 'www.example.com',
    });
  });

  it('returns empty on failed fetch', async () => {
    setFetch(mockJson({}, 401));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('GandiProvider.createRecord', () => {
  it('returns composite id', async () => {
    setFetch(mockJson({ message: 'DNS Record Created' }, 201));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'mail',
      type: 'MX',
      content: 'mx.example.com',
    });
    expect(result.id).toBe('MX:mail');
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Conflict' }, 409));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Conflict');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('GandiProvider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockJson({}, 201));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:www', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:www', { content: '1' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:www', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('GandiProvider.deleteRecord', () => {
  it('resolves on 204', async () => {
    setFetch(mockJson({}, 204));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).resolves.toBeUndefined();
  });

  it('resolves on 404 (idempotent)', async () => {
    setFetch(mockJson({}, 404));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).resolves.toBeUndefined();
  });

  it('throws on unexpected error', async () => {
    setFetch(mockJson({ message: 'Error' }, 500));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).rejects.toThrow('Error');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = gandiAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('A:www')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
