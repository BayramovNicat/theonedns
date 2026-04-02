import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { namecheapAdapter } from '../../lib/dns/namecheap';
import { mockSequence, mockText, setFetch } from './helpers';

const CREDS = { api_user: 'user', api_key: 'key' };
const DOMAIN = 'example.com';

const SUCCESS_XML = `<?xml version="1.0"?>
<ApiResponse Status="OK">
  <CommandResponse>
    <DomainDNSGetHostsResult>
      <host HostId="1" Name="@" Type="A" Address="1.2.3.4" TTL="1800" />
      <host HostId="2" Name="www" Type="CNAME" Address="example.com" TTL="600" />
    </DomainDNSGetHostsResult>
  </CommandResponse>
</ApiResponse>`;

const ERROR_XML = `<?xml version="1.0"?>
<ApiResponse Status="ERROR">
  <Errors><Err1>API Key is invalid</Err1></Errors>
</ApiResponse>`;

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('namecheapAdapter.verify', () => {
  it('returns valid:true when response contains Status="OK"', async () => {
    setFetch(mockText(SUCCESS_XML));
    expect(await namecheapAdapter.verify(CREDS, DOMAIN)).toEqual({
      valid: true,
    });
  });

  it('returns invalid for invalid API key error', async () => {
    setFetch(mockText(ERROR_XML));
    const r = await namecheapAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/api key/i);
  });

  it('returns invalid on HTTP error', async () => {
    setFetch(mockText('', 500));
    const r = await namecheapAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toContain('500');
  });

  it('returns invalid for IP whitelist error', async () => {
    const _xml = `${SUCCESS_XML.replace(
      'Status="OK"',
      'Status="ERROR"',
    ).replace(
      'DomainDNSGetHostsResult',
      'DomainDNSGetHostsResult',
    )}<!-- Invalid request IP -->`;
    setFetch(
      mockText(
        `<?xml version="1.0"?><ApiResponse Status="ERROR">Invalid request IP</ApiResponse>`,
      ),
    );
    const r = await namecheapAdapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
  });
});

describe('NamecheapProvider.listRecords', () => {
  it('parses XML host records', async () => {
    setFetch(mockText(SUCCESS_XML));
    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      id: '1',
      name: DOMAIN,
      type: 'A',
      content: '1.2.3.4',
      ttl: 1800,
    });
    expect(records[1]).toMatchObject({
      id: '2',
      name: 'www.example.com',
      type: 'CNAME',
    });
  });

  it('returns empty on HTTP failure', async () => {
    setFetch(mockText('', 500));
    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toEqual([]);
  });
});

describe('NamecheapProvider.createRecord', () => {
  // createRecord: getHosts (GET) → setHosts (POST) → getHosts again (POST) to get new ID
  it('adds record and returns id from re-fetched hosts', async () => {
    const afterXml = `<?xml version="1.0"?>
<ApiResponse Status="OK">
  <CommandResponse>
    <DomainDNSGetHostsResult>
      <host HostId="1" Name="@" Type="A" Address="1.2.3.4" TTL="1800" />
      <host HostId="99" Name="mail" Type="MX" Address="mx.example.com" TTL="1800" />
    </DomainDNSGetHostsResult>
  </CommandResponse>
</ApiResponse>`;

    const setOkXml = `<?xml version="1.0"?><ApiResponse Status="OK"></ApiResponse>`;

    setFetch(
      mockSequence([
        mockText(SUCCESS_XML), // getHosts
        mockText(setOkXml), // setHosts
        mockText(afterXml), // getHosts again
      ]),
    );

    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'mail',
      type: 'MX',
      content: 'mx.example.com',
    });
    expect(result.id).toBe('99');
  });
});

describe('NamecheapProvider.updateRecord', () => {
  it('updates the matching host by id', async () => {
    const setOkXml = `<?xml version="1.0"?><ApiResponse Status="OK"></ApiResponse>`;
    setFetch(mockSequence([mockText(SUCCESS_XML), mockText(setOkXml)]));
    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('1', { content: '9.9.9.9' }),
    ).resolves.toBeUndefined();
  });

  it('throws when record id not found', async () => {
    setFetch(mockText(SUCCESS_XML));
    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('999', { content: '1' }),
    ).rejects.toThrow('Record not found');
  });
});

describe('NamecheapProvider.deleteRecord', () => {
  it('removes the record and calls setHosts', async () => {
    const setOkXml = `<?xml version="1.0"?><ApiResponse Status="OK"></ApiResponse>`;
    setFetch(mockSequence([mockText(SUCCESS_XML), mockText(setOkXml)]));
    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('1')).resolves.toBeUndefined();
  });

  it('is a no-op if record id not found', async () => {
    setFetch(mockText(SUCCESS_XML));
    const provider = namecheapAdapter.createProvider(CREDS, DOMAIN);
    await expect(provider.deleteRecord('999')).resolves.toBeUndefined();
  });
});
