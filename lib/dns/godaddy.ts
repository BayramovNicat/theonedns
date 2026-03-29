import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://api.godaddy.com/v1';

function headers(apiKey: string, apiSecret: string) {
  return {
    Authorization: `sso-key ${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
  };
}

/** GoDaddy has no record IDs — we use `type:name` as a composite key. */
function encodeId(type: string, name: string) {
  return `${type}:${name}`;
}

function decodeId(id: string) {
  const idx = id.indexOf(':');
  return { type: id.slice(0, idx), name: id.slice(idx + 1) };
}

class GoDaddyProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    apiKey: string,
    apiSecret: string,
    private domain: string,
  ) {
    this.hdrs = headers(apiKey, apiSecret);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const res = await fetch(`${API}/domains/${this.domain}/records`, {
      headers: this.hdrs,
    });

    if (!res.ok) return [];

    const data: {
      name: string;
      type: string;
      data: string;
      ttl?: number;
      priority?: number;
    }[] = await res.json();
    const records: DnsRecord[] = [];

    for (const r of data) {
      records.push({
        id: encodeId(r.type, r.name),
        name: r.name === '@' ? this.domain : `${r.name}.${this.domain}`,
        type: r.type,
        content: r.data,
        ttl: r.ttl,
        priority: r.priority,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/domains/${this.domain}/records`, {
      method: 'POST',
      headers: this.hdrs,
      body: JSON.stringify([
        {
          type: params.type,
          name: params.subdomain,
          data: params.content,
          ttl: params.ttl ?? 3600,
          ...(params.priority != null && { priority: params.priority }),
        },
      ]),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to create DNS record');
    }

    return { id: encodeId(params.type, params.subdomain) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const { type, name } = decodeId(recordId);
    const recordType = params.type ?? type;

    const res = await fetch(
      `${API}/domains/${this.domain}/records/${recordType}/${name}`,
      {
        method: 'PUT',
        headers: this.hdrs,
        body: JSON.stringify([
          { data: params.content, ttl: params.ttl ?? 3600 },
        ]),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to update DNS record');
    }
  }

  async deleteRecord(recordId: string) {
    const { type, name } = decodeId(recordId);

    const res = await fetch(
      `${API}/domains/${this.domain}/records/${type}/${name}`,
      { method: 'DELETE', headers: this.hdrs },
    );

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to delete DNS record');
    }
  }
}

export const godaddyAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/domains/${domain}`, {
      headers: headers(creds.api_key, creds.api_secret),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: 'Invalid API key or secret' };
    if (res.status === 404)
      return {
        valid: false,
        error: 'Domain not found in your GoDaddy account',
      };

    return {
      valid: false,
      error: `Verification failed (${res.status})`,
    };
  },

  createProvider(creds, domain) {
    return new GoDaddyProvider(creds.api_key, creds.api_secret, domain);
  },
};
