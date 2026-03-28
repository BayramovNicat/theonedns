import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://developers.hostinger.com/api/dns/v1";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

class HostingerProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const res = await fetch(`${API}/zones/${this.domain}/records`, {
      headers: this.hdrs,
    });
    if (!res.ok) return [];

    const data: {
      id: number;
      name: string;
      type: string;
      content: string;
      ttl?: number;
      priority?: number;
    }[] = await res.json();
    const records: DnsRecord[] = [];

    for (const r of data) {
      records.push({
        id: String(r.id),
        name: r.name === "" ? this.domain : `${r.name}.${this.domain}`,
        type: r.type,
        content: r.content,
        ttl: r.ttl,
        priority: r.priority,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/zones/${this.domain}/records`, {
      method: "POST",
      headers: this.hdrs,
      body: JSON.stringify({
        type: params.type,
        name: params.subdomain,
        content: params.content,
        ttl: params.ttl ?? 300,
        ...(params.priority != null && { priority: params.priority }),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to create DNS record");
    }

    const data = await res.json();
    return { id: String(data.id) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = { content: params.content };
    if (params.type) body.type = params.type;
    if (params.ttl != null) body.ttl = params.ttl;
    if (params.priority != null) body.priority = params.priority;

    const res = await fetch(`${API}/zones/${this.domain}/records/${recordId}`, {
      method: "PUT",
      headers: this.hdrs,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(`${API}/zones/${this.domain}/records/${recordId}`, {
      method: "DELETE",
      headers: this.hdrs,
    });

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to delete DNS record");
    }
  }
}

export const hostingerAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/zones/${domain}/records`, {
      headers: headers(creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: "Invalid API token" };
    if (res.status === 404)
      return {
        valid: false,
        error: "Domain not found in your Hostinger account",
      };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new HostingerProvider(creds.api_token, domain);
  },
};
