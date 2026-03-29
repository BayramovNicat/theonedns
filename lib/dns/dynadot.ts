import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://api.dynadot.com/api3.json';

/**
 * Dynadot has no individual record CRUD — you must read all DNS settings,
 * modify the list, then write all records back via set_dns2.
 */

type DynadotRecord = {
  record_type: string;
  subdomain: string;
  value: string;
};

function encodeId(type: string, subdomain: string) {
  return `${type}:${subdomain}`;
}

function decodeId(id: string) {
  const idx = id.indexOf(':');
  return { type: id.slice(0, idx), subdomain: id.slice(idx + 1) };
}

class DynadotProvider implements DnsProvider {
  constructor(
    private apiKey: string,
    private domain: string,
  ) {}

  private async getDns(): Promise<DynadotRecord[]> {
    const params = new URLSearchParams({
      key: this.apiKey,
      command: 'get_dns',
      domain: this.domain,
    });

    const res = await fetch(`${API}?${params.toString()}`);
    if (!res.ok) return [];

    const data = await res.json();
    if (data.GetDnsResponse?.Status !== 'success') return [];

    const records: DynadotRecord[] = [];
    const dnsResponse = data.GetDnsResponse;

    for (const r of dnsResponse.DnsRecord ?? []) {
      records.push({
        record_type: r.RecordType,
        subdomain: r.SubDomain ?? '',
        value: r.Value,
      });
    }

    return records;
  }

  private async setDns(records: DynadotRecord[]) {
    const params = new URLSearchParams({
      key: this.apiKey,
      command: 'set_dns2',
      domain: this.domain,
    });

    records.forEach((r, i) => {
      params.set(`subdomain${i}`, r.subdomain);
      params.set(`sub_record_type${i}`, r.record_type);
      params.set(`sub_record${i}`, r.value);
    });

    const res = await fetch(`${API}?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to update DNS records on Dynadot');
    }

    const data = await res.json();
    if (data.SetDns2Response?.Status !== 'success') {
      throw new Error(data.SetDns2Response?.Error ?? 'Dynadot API error');
    }
  }

  async listRecords(): Promise<DnsRecord[]> {
    const hosts = await this.getDns();
    const records: DnsRecord[] = [];

    for (const r of hosts) {
      records.push({
        id: encodeId(r.record_type.toUpperCase(), r.subdomain),
        name:
          r.subdomain === '' ? this.domain : `${r.subdomain}.${this.domain}`,
        type: r.record_type.toUpperCase(),
        content: r.value,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const hosts = await this.getDns();

    hosts.push({
      record_type: params.type.toLowerCase(),
      subdomain: params.subdomain,
      value: params.content,
    });

    await this.setDns(hosts);

    return { id: encodeId(params.type, params.subdomain) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const { type, subdomain } = decodeId(recordId);
    const hosts = await this.getDns();

    const idx = hosts.findIndex(
      (r) => r.record_type.toUpperCase() === type && r.subdomain === subdomain,
    );

    if (idx === -1) throw new Error('Record not found');

    hosts[idx].value = params.content;
    if (params.type) hosts[idx].record_type = params.type.toLowerCase();

    await this.setDns(hosts);
  }

  async deleteRecord(recordId: string) {
    const { type, subdomain } = decodeId(recordId);
    const hosts = await this.getDns();

    const filtered = hosts.filter(
      (r) =>
        !(r.record_type.toUpperCase() === type && r.subdomain === subdomain),
    );

    if (filtered.length === hosts.length) return;

    await this.setDns(filtered);
  }
}

export const dynadotAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const params = new URLSearchParams({
      key: creds.api_key,
      command: 'get_dns',
      domain,
    });

    const res = await fetch(`${API}?${params.toString()}`);

    if (!res.ok)
      return { valid: false, error: `Verification failed (${res.status})` };

    const data = await res.json();

    if (data.GetDnsResponse?.Status === 'success') return { valid: true };

    const error = data.GetDnsResponse?.Error;
    if (error?.includes('invalid key'))
      return { valid: false, error: 'Invalid API key' };
    if (error?.includes('not found'))
      return {
        valid: false,
        error: 'Domain not found in your Dynadot account',
      };

    return { valid: false, error: error ?? 'Verification failed' };
  },

  createProvider(creds, domain) {
    return new DynadotProvider(creds.api_key, domain);
  },
};
