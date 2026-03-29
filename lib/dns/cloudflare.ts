import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://api.cloudflare.com/client/v4';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

class CloudflareProvider implements DnsProvider {
  constructor(
    private token: string,
    private zoneId: string,
    private domain: string,
  ) {}

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${API}/zones/${this.zoneId}/dns_records?per_page=100&page=${page}`,
        { headers: headers(this.token) },
      );
      const data = await res.json();
      if (!data.success) break;

      for (const r of data.result) {
        records.push({
          id: r.id,
          name: r.name,
          type: r.type,
          content: r.content,
          ttl: r.ttl === 1 ? undefined : r.ttl,
          priority: r.priority,
          proxied: r.proxied,
        });
      }

      if (data.result.length < 100) break;
      page++;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const name = `${params.subdomain}.${this.domain}`;
    const res = await fetch(`${API}/zones/${this.zoneId}/dns_records`, {
      method: 'POST',
      headers: headers(this.token),
      body: JSON.stringify({
        type: params.type,
        name,
        content: params.content,
        proxied: params.proxied ?? false,
        ttl: params.ttl ?? 1,
        ...(params.priority != null && { priority: params.priority }),
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(
        data.errors?.[0]?.message ?? 'Failed to create DNS record',
      );
    }
    return { id: data.result.id };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = {
      content: params.content,
      proxied: params.proxied ?? false,
    };
    if (params.type) body.type = params.type;
    if (params.ttl != null) body.ttl = params.ttl;
    if (params.priority != null) body.priority = params.priority;

    const res = await fetch(
      `${API}/zones/${this.zoneId}/dns_records/${recordId}`,
      {
        method: 'PATCH',
        headers: headers(this.token),
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    if (!data.success) {
      throw new Error(
        data.errors?.[0]?.message ?? 'Failed to update DNS record',
      );
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/zones/${this.zoneId}/dns_records/${recordId}`,
      { method: 'DELETE', headers: headers(this.token) },
    );

    const data = await res.json();
    if (!data.success) {
      throw new Error(
        data.errors?.[0]?.message ?? 'Failed to delete DNS record',
      );
    }
  }
}

export const cloudflareAdapter: PlatformAdapter = {
  async verify(creds) {
    const res = await fetch(
      `${API}/zones/${creds.zone_id}/dns_records?per_page=1`,
      { headers: headers(creds.api_token) },
    );
    const data = await res.json();

    if (data.success) return { valid: true };
    return {
      valid: false,
      error: data.errors?.[0]?.message ?? 'Invalid token or zone ID',
    };
  },

  createProvider(creds, domain) {
    return new CloudflareProvider(creds.api_token, creds.zone_id, domain);
  },
};
