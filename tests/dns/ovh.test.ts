import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { ovhAdapter } from '../../lib/dns/ovh';
import { mockJson, mockJsonThrows, mockSequence, setFetch } from './helpers';

const CREDS = { app_key: 'ak', app_secret: 'as', consumer_key: 'ck' };
const DOMAIN = 'example.com';

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('ovhAdapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockJson({ name: DOMAIN }, 200));
    expect(await ovhAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid on 401/403', async () => {
    setFetch(mockJson({}, 403));
    const r = await ovhAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/invalid credentials/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockJson({}, 404));
    const r = await ovhAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });
});

describe('OvhProvider.listRecords', () => {
  // OVH fetches IDs per type, then fetches each record individually
  it('fetches record details for each ID per type', async () => {
    // 7 record types queried; only A returns IDs [1, 2], rest return []
    const responses = [
      mockJson([1, 2]), // A: ids
      mockJson({
        id: 1,
        subDomain: '',
        fieldType: 'A',
        target: '1.2.3.4',
        ttl: 300,
      }),
      mockJson({
        id: 2,
        subDomain: 'www',
        fieldType: 'A',
        target: '5.6.7.8',
        ttl: 300,
      }),
      mockJson([]), // AAAA
      mockJson([]), // CNAME
      mockJson([]), // MX
      mockJson([]), // TXT
      mockJson([]), // NS
      mockJson([]), // SRV
    ];
    setFetch(mockSequence(responses));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: '1',
      name: DOMAIN,
      type: 'A',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({
      id: '2',
      name: 'www.example.com',
      type: 'A',
      content: '5.6.7.8',
    });
  });

  it('skips a type when its ID list request fails', async () => {
    const responses = [
      mockJson({}, 401), // A: fails
      mockJson([]), // AAAA
      mockJson([]), // CNAME
      mockJson([]), // MX
      mockJson([]), // TXT
      mockJson([]), // NS
      mockJson([]), // SRV
    ];
    setFetch(mockSequence(responses));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('OvhProvider.createRecord', () => {
  // createRecord: POST record → POST refresh
  it('returns id and triggers refresh', async () => {
    setFetch(
      mockSequence([
        mockJson({ id: 42 }, 200), // POST record
        mockJson({}, 200), // POST refresh
      ]),
    );
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'www',
      type: 'A',
      content: '1.2.3.4',
    });
    expect(result.id).toBe('42');
  });

  it('throws on failure', async () => {
    setFetch(mockJson({ message: 'Invalid' }, 400));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Invalid');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('Failed to create DNS record');
  });
});

describe('OvhProvider.updateRecord', () => {
  it('resolves and triggers refresh', async () => {
    setFetch(
      mockSequence([
        mockJson({}, 200), // PUT
        mockJson({}, 200), // refresh
      ]),
    );
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).resolves.toBeUndefined();
  });

  it('throws on PUT failure', async () => {
    setFetch(mockJson({ message: 'Not found' }, 404));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Not found');
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('5', { content: 'new' }),
    ).rejects.toThrow('Failed to update DNS record');
  });
});

describe('OvhProvider.deleteRecord', () => {
  it('resolves and triggers refresh', async () => {
    setFetch(
      mockSequence([
        mockJson({}, 200), // DELETE
        mockJson({}, 200), // refresh
      ]),
    );
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('resolves on 404 (already gone) and still triggers refresh', async () => {
    setFetch(
      mockSequence([
        mockJson({}, 404), // DELETE
        mockJson({}, 200), // refresh
      ]),
    );
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).resolves.toBeUndefined();
  });

  it('uses fallback message when response body is not JSON', async () => {
    setFetch(mockJsonThrows(500));
    const provider = ovhAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('5')).rejects.toThrow(
      'Failed to delete DNS record',
    );
  });
});
