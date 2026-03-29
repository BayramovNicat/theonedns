import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://api.dnsimple.com/v2';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

class DNSimpleProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private accountId: string,
    private domain: string,
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${API}/${this.accountId}/zones/${this.domain}/records?per_page=100&page=${page}`,
        { headers: this.hdrs },
      );
      if (!res.ok) break;

      const data = await res.json();
      const items = data.data ?? [];

      for (const r of items) {
        records.push({
          id: String(r.id),
          name: r.name === '' ? this.domain : `${r.name}.${this.domain}`,
          type: r.type,
          content: r.content,
          ttl: r.ttl,
          priority: r.priority,
        });
      }

      if (!data.pagination || page >= data.pagination.total_pages) break;
      page++;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(
      `${API}/${this.accountId}/zones/${this.domain}/records`,
      {
        method: 'POST',
        headers: this.hdrs,
        body: JSON.stringify({
          type: params.type,
          name: params.subdomain,
          content: params.content,
          ttl: params.ttl ?? 3600,
          ...(params.priority != null && { priority: params.priority }),
        }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to create DNS record');
    }

    const data = await res.json();
    return { id: String(data.data.id) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = { content: params.content };
    if (params.type) body.type = params.type;
    if (params.ttl != null) body.ttl = params.ttl;
    if (params.priority != null) body.priority = params.priority;

    const res = await fetch(
      `${API}/${this.accountId}/zones/${this.domain}/records/${recordId}`,
      {
        method: 'PATCH',
        headers: this.hdrs,
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to update DNS record');
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/${this.accountId}/zones/${this.domain}/records/${recordId}`,
      { method: 'DELETE', headers: this.hdrs },
    );

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to delete DNS record');
    }
  }
}

export const dnsimpleAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/${creds.account_id}/zones/${domain}`, {
      headers: headers(creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'Invalid API token' };
    if (res.status === 404)
      return {
        valid: false,
        error: 'Domain not found in your DNSimple account',
      };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new DNSimpleProvider(creds.api_token, creds.account_id, domain);
  },
};
