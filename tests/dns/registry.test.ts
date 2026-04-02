import { describe, expect, it } from 'bun:test';
import { getAdapter, getProvider, isSupported } from '../../lib/dns/registry';

const KNOWN_PLATFORMS = [
  'cloudflare',
  'vercel',
  'netlify',
  'digitalocean',
  'hetzner',
  'godaddy',
  'gcloud',
  'porkbun',
  'dnsimple',
  'namecom',
  'route53',
  'vultr',
  'linode',
  'gandi',
  'ovh',
  'namecheap',
  'bunny',
  'dynadot',
  'hostinger',
];

describe('isSupported', () => {
  it.each(KNOWN_PLATFORMS)('returns true for %s', (platform) => {
    expect(isSupported(platform)).toBe(true);
  });

  it('returns false for an unknown platform', () => {
    expect(isSupported('unknown-provider')).toBe(false);
  });

  it('is case-sensitive', () => {
    expect(isSupported('Cloudflare')).toBe(false);
    expect(isSupported('CLOUDFLARE')).toBe(false);
  });
});

describe('getAdapter', () => {
  it('returns an adapter with verify and createProvider for known platforms', () => {
    for (const platform of KNOWN_PLATFORMS) {
      const adapter = getAdapter(platform);
      expect(typeof adapter.verify).toBe('function');
      expect(typeof adapter.createProvider).toBe('function');
    }
  });

  it('throws for an unknown platform', () => {
    expect(() => getAdapter('bogus')).toThrow('Unsupported platform: bogus');
  });
});

describe('getProvider', () => {
  it('returns a provider with the DnsProvider interface', () => {
    const provider = getProvider(
      'cloudflare',
      { api_token: 't', zone_id: 'z' },
      'example.com',
    );
    expect(typeof provider.listRecords).toBe('function');
    expect(typeof provider.createRecord).toBe('function');
    expect(typeof provider.updateRecord).toBe('function');
    expect(typeof provider.deleteRecord).toBe('function');
  });

  it('throws for an unknown platform', () => {
    expect(() => getProvider('bogus', {}, 'example.com')).toThrow(
      'Unsupported platform: bogus',
    );
  });
});
