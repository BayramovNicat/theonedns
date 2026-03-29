import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://api.vercel.com';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

class VercelProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private domain: string,
    private teamId?: string,
  ) {
    this.hdrs = headers(token);
  }

  private qs() {
    return this.teamId ? `?teamId=${this.teamId}` : '';
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let until: number | null = null;

    while (true) {
      const url = new URL(`${API}/v5/domains/${this.domain}/records`);
      url.searchParams.set('limit', '100');
      if (this.teamId) url.searchParams.set('teamId', this.teamId);
      if (until) url.searchParams.set('until', String(until));

      const res = await fetch(url.toString(), { headers: this.hdrs });
      if (!res.ok) break;

      const data = await res.json();
      for (const r of data.records) {
        records.push({
          id: r.id,
          name: r.name ? `${r.name}.${this.domain}` : this.domain,
          type: r.type,
          content: r.value,
          ttl: r.ttl,
          priority: r.mxPriority,
        });
      }

      if (!data.pagination?.next) break;
      until = data.pagination.next;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(
      `${API}/v2/domains/${this.domain}/records${this.qs()}`,
      {
        method: 'POST',
        headers: this.hdrs,
        body: JSON.stringify({
          name: params.subdomain,
          type: params.type,
          value: params.content,
          ttl: params.ttl ?? 60,
          ...(params.priority != null && { mxPriority: params.priority }),
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message ?? 'Failed to create DNS record');
    }
    return { id: data.uid };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = { value: params.content };
    if (params.type) body.type = params.type;
    if (params.ttl != null) body.ttl = params.ttl;
    if (params.priority != null) body.mxPriority = params.priority;

    const res = await fetch(
      `${API}/v1/domains/records/${recordId}${this.qs()}`,
      {
        method: 'PATCH',
        headers: this.hdrs,
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error?.message ?? 'Failed to update DNS record');
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/v2/domains/${this.domain}/records/${recordId}${this.qs()}`,
      { method: 'DELETE', headers: this.hdrs },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error?.message ?? 'Failed to delete DNS record');
    }
  }
}

export const vercelAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const teamId = creds.team_id?.trim() || undefined;
    const qs = teamId ? `&teamId=${teamId}` : '';

    const res = await fetch(
      `${API}/v5/domains/${domain}/records?limit=1${qs}`,
      { headers: headers(creds.api_token) },
    );

    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: 'Invalid API token' };
    if (res.status === 403)
      return { valid: false, error: 'Token lacks permission for this domain' };
    if (res.status === 404)
      return { valid: false, error: 'Domain not found on Vercel' };

    const data = await res.json().catch(() => null);
    return {
      valid: false,
      error: data?.error?.message ?? `Verification failed (${res.status})`,
    };
  },

  createProvider(creds, domain) {
    return new VercelProvider(
      creds.api_token,
      domain,
      creds.team_id?.trim() || undefined,
    );
  },
};
