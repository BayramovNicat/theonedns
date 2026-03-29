import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://api.linode.com/v4';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

class LinodeProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private domainId: string,
    private domain: string,
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${API}/domains/${this.domainId}/records?page=${page}&page_size=500`,
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
          content: r.target,
          ttl: r.ttl_sec || undefined,
          priority: r.priority,
        });
      }

      if (page >= (data.pages ?? 1)) break;
      page++;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/domains/${this.domainId}/records`, {
      method: 'POST',
      headers: this.hdrs,
      body: JSON.stringify({
        type: params.type,
        name: params.subdomain,
        target: params.content,
        ttl_sec: params.ttl ?? 300,
        ...(params.priority != null && { priority: params.priority }),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const msg = data?.errors?.[0]?.reason ?? 'Failed to create DNS record';
      throw new Error(msg);
    }

    const data = await res.json();
    return { id: String(data.id) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = { target: params.content };
    if (params.type) body.type = params.type;
    if (params.ttl != null) body.ttl_sec = params.ttl;
    if (params.priority != null) body.priority = params.priority;

    const res = await fetch(
      `${API}/domains/${this.domainId}/records/${recordId}`,
      {
        method: 'PUT',
        headers: this.hdrs,
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const msg = data?.errors?.[0]?.reason ?? 'Failed to update DNS record';
      throw new Error(msg);
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/domains/${this.domainId}/records/${recordId}`,
      { method: 'DELETE', headers: this.hdrs },
    );

    if (!res.ok && res.status !== 200) {
      const data = await res.json().catch(() => null);
      const msg = data?.errors?.[0]?.reason ?? 'Failed to delete DNS record';
      throw new Error(msg);
    }
  }
}

export const linodeAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    // List domains to find the matching domain ID
    const res = await fetch(`${API}/domains`, {
      headers: headers(creds.api_token),
    });

    if (!res.ok) {
      if (res.status === 401)
        return { valid: false, error: 'Invalid API token' };
      return { valid: false, error: `Verification failed (${res.status})` };
    }

    const data = await res.json();
    const match = (data.data ?? []).find(
      (d: { domain: string }) => d.domain === domain,
    );

    if (!match)
      return {
        valid: false,
        error: 'Domain not found in your Linode account',
      };

    return { valid: true };
  },

  createProvider(creds, domain) {
    return new LinodeProvider(creds.api_token, creds.domain_id, domain);
  },
};
