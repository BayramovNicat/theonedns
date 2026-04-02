import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { dynadotAdapter } from '../../lib/dns/dynadot';
import { mockJson, mockSequence, setFetch } from './helpers';

const CREDS = { api_key: 'test-key' };
const DOMAIN = 'example.com';

const DNS_RESPONSE = {
  GetDnsResponse: {
    Status: 'success',
    DnsRecord: [
      { RecordType: 'A', SubDomain: '', Value: '1.2.3.4' },
      { RecordType: 'CNAME', SubDomain: 'www', Value: 'target.com' },
    ],
  },
};

const SET_OK = { SetDns2Response: { Status: 'success' } };

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('dynadotAdapter.verify', () => {
  it('returns valid:true when GetDnsResponse.Status is success', async () => {
    setFetch(mockJson(DNS_RESPONSE));
    expect(await dynadotAdapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('returns invalid for invalid key error', async () => {
    setFetch(
      mockJson({ GetDnsResponse: { Status: 'error', Error: 'invalid key' } }),
    );
    const r = await dynadotAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api key/i);
  });

  it('returns invalid when domain not found', async () => {
    setFetch(
      mockJson({
        GetDnsResponse: { Status: 'error', Error: 'domain not found' },
      }),
    );
    const r = await dynadotAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/not found/i);
  });

  it('returns invalid on HTTP failure', async () => {
    setFetch(mockJson({}, 500));
    const r = await dynadotAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('500');
  });
});

describe('DynadotProvider.listRecords', () => {
  it('maps records with empty subdomain to domain', async () => {
    setFetch(mockJson(DNS_RESPONSE));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: 'A:',
      name: DOMAIN,
      type: 'A',
      content: '1.2.3.4',
    });
    expect(records[1]).toMatchObject({
      id: 'CNAME:www',
      name: 'www.example.com',
      content: 'target.com',
    });
  });

  it('returns empty on HTTP failure', async () => {
    setFetch(mockJson({}, 500));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('DynadotProvider.createRecord', () => {
  it('returns composite id and calls setDns', async () => {
    setFetch(mockSequence([mockJson(DNS_RESPONSE), mockJson(SET_OK)]));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'mail',
      type: 'MX',
      content: 'mx.example.com',
    });
    expect(result.id).toBe('MX:mail');
  });

  it('throws when setDns fails', async () => {
    setFetch(
      mockSequence([
        mockJson(DNS_RESPONSE),
        mockJson({ SetDns2Response: { Status: 'error', Error: 'API error' } }),
      ]),
    );
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('API error');
  });
});

describe('DynadotProvider.updateRecord', () => {
  it('updates matching record and calls setDns', async () => {
    setFetch(mockSequence([mockJson(DNS_RESPONSE), mockJson(SET_OK)]));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws when record not found', async () => {
    setFetch(mockJson(DNS_RESPONSE));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('TXT:notexist', { content: 'v' }),
    ).rejects.toThrow('Record not found');
  });
});

describe('DynadotProvider.deleteRecord', () => {
  it('removes record and calls setDns', async () => {
    setFetch(mockSequence([mockJson(DNS_RESPONSE), mockJson(SET_OK)]));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('CNAME:www')).resolves.toBeUndefined();
  });

  it('is a no-op if record not found', async () => {
    setFetch(mockJson(DNS_RESPONSE));
    const provider = dynadotAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('TXT:ghost')).resolves.toBeUndefined();
  });
});
