import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { route53Adapter } from '../../lib/dns/route53';
import { mockSequence, mockText, setFetch } from './helpers';

const CREDS = {
  access_key_id: 'AKIATEST',
  secret_access_key: 'secretkey',
  hosted_zone_id: '/hostedzone/Z1234567890',
};
const DOMAIN = 'example.com';

const RRSET_XML = `<?xml version="1.0" encoding="UTF-8"?>
<ListResourceRecordSetsResponse>
  <ResourceRecordSets>
    <ResourceRecordSet>
      <Name>example.com.</Name>
      <Type>A</Type>
      <TTL>300</TTL>
      <ResourceRecords>
        <ResourceRecord><Value>1.2.3.4</Value></ResourceRecord>
      </ResourceRecords>
    </ResourceRecordSet>
    <ResourceRecordSet>
      <Name>www.example.com.</Name>
      <Type>CNAME</Type>
      <TTL>600</TTL>
      <ResourceRecords>
        <ResourceRecord><Value>target.com</Value></ResourceRecord>
      </ResourceRecords>
    </ResourceRecordSet>
  </ResourceRecordSets>
  <IsTruncated>false</IsTruncated>
</ListResourceRecordSetsResponse>`;

const CHANGE_OK_XML = `<?xml version="1.0"?>
<ChangeResourceRecordSetsResponse>
  <ChangeInfo><Id>/change/C123</Id><Status>PENDING</Status></ChangeInfo>
</ChangeResourceRecordSetsResponse>`;

let originalFetch: typeof globalThis.fetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('route53Adapter.verify', () => {
  it('returns valid:true on 200', async () => {
    setFetch(mockText('<GetHostedZoneResponse/>', 200));
    expect(await route53Adapter.verify(CREDS, DOMAIN)).toEqual({ valid: true });
  });

  it('strips /hostedzone/ prefix from zone id', async () => {
    let capturedUrl = '';
    setFetch((url) => {
      capturedUrl = String(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
        json: () => Promise.resolve({}),
      } as Response);
    });
    await route53Adapter.verify(CREDS, DOMAIN);
    expect(capturedUrl).toContain('/Z1234567890');
    expect(capturedUrl).not.toContain('/hostedzone/');
  });

  it('returns invalid on 403', async () => {
    setFetch(mockText('', 403));
    const r = await route53Adapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/aws credentials/i);
  });

  it('returns invalid on 404', async () => {
    setFetch(mockText('', 404));
    const r = await route53Adapter.verify(CREDS, DOMAIN);
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/hosted zone not found/i);
  });
});

describe('Route53Provider.listRecords', () => {
  it('parses XML rrsets and strips trailing dots', async () => {
    setFetch(mockText(RRSET_XML));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    const records = await provider.listRecords();
    expect(records).toHaveLength(2);
    expect(records[0]).toMatchObject({
      name: 'example.com',
      type: 'A',
      content: '1.2.3.4',
      ttl: 300,
    });
    expect(records[1]).toMatchObject({
      name: 'www.example.com',
      type: 'CNAME',
      content: 'target.com',
    });
  });

  it('paginates via IsTruncated', async () => {
    const page1 = RRSET_XML.replace(
      '<IsTruncated>false</IsTruncated>',
      '<IsTruncated>true</IsTruncated><NextRecordName>next.example.com.</NextRecordName><NextRecordType>A</NextRecordType>',
    );
    const page2 = `<?xml version="1.0"?>
<ListResourceRecordSetsResponse>
  <ResourceRecordSets>
    <ResourceRecordSet>
      <Name>mail.example.com.</Name><Type>MX</Type><TTL>3600</TTL>
      <ResourceRecords><ResourceRecord><Value>mx.example.com</Value></ResourceRecord></ResourceRecords>
    </ResourceRecordSet>
  </ResourceRecordSets>
  <IsTruncated>false</IsTruncated>
</ListResourceRecordSetsResponse>`;
    setFetch(mockSequence([mockText(page1), mockText(page2)]));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    expect(await provider.listRecords()).toHaveLength(3);
  });
});

describe('Route53Provider.createRecord', () => {
  it('returns composite id', async () => {
    setFetch(mockText(CHANGE_OK_XML));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    const result = await provider.createRecord({
      subdomain: 'www',
      type: 'A',
      content: '1.2.3.4',
    });
    expect(result.id).toMatch(/^A:/);
  });

  it('throws on failure', async () => {
    const errXml =
      '<ErrorResponse><Error><Message>InvalidInput</Message></Error></ErrorResponse>';
    setFetch(mockText(errXml, 400));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.createRecord({ subdomain: 'x', type: 'A', content: '1' }),
    ).rejects.toThrow('InvalidInput');
  });
});

describe('Route53Provider.updateRecord', () => {
  it('resolves on success', async () => {
    setFetch(mockText(CHANGE_OK_XML));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:example.com.', { content: '5.6.7.8' }),
    ).resolves.toBeUndefined();
  });

  it('throws on failure', async () => {
    const errXml =
      '<ErrorResponse><Error><Message>NoSuchHostedZone</Message></Error></ErrorResponse>';
    setFetch(mockText(errXml, 404));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.updateRecord('A:example.com.', { content: '1' }),
    ).rejects.toThrow('NoSuchHostedZone');
  });
});

describe('Route53Provider.deleteRecord', () => {
  // deleteRecord: GET current values → POST DELETE change
  it('resolves when record exists', async () => {
    setFetch(
      mockSequence([
        mockText(RRSET_XML), // GET current rrset
        mockText(CHANGE_OK_XML), // POST DELETE
      ]),
    );
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.deleteRecord('A:example.com.'),
    ).resolves.toBeUndefined();
  });

  it('resolves silently when GET fails (record gone)', async () => {
    setFetch(mockText('', 404));
    const provider = route53Adapter.createProvider(CREDS, DOMAIN);
    await expect(
      provider.deleteRecord('A:example.com.'),
    ).resolves.toBeUndefined();
  });
});
