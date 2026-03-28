import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.digitalocean.com/v2";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

class DigitalOceanProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${API}/domains/${this.domain}/records?per_page=200&page=${page}`,
        { headers: this.hdrs }
      );
      if (!res.ok) break;

      const data = await res.json();
      const items = data.domain_records ?? [];

      for (const r of items) {
        if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
        records.push({
          id: String(r.id),
          name: r.name === "@" ? this.domain : `${r.name}.${this.domain}`,
          type: r.type,
          content: r.data,
        });
      }

      if (!data.links?.pages?.next) break;
      page++;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/domains/${this.domain}/records`, {
      method: "POST",
      headers: this.hdrs,
      body: JSON.stringify({
        type: params.type,
        name: params.subdomain,
        data: params.content,
        ttl: 1800,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to create DNS record");
    }

    const data = await res.json();
    return { id: String(data.domain_record.id) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = { data: params.content };
    if (params.type) body.type = params.type;

    const res = await fetch(
      `${API}/domains/${this.domain}/records/${recordId}`,
      {
        method: "PATCH",
        headers: this.hdrs,
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/domains/${this.domain}/records/${recordId}`,
      { method: "DELETE", headers: this.hdrs }
    );

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to delete DNS record");
    }
  }
}

export const digitaloceanAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/domains/${domain}`, {
      headers: headers(creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: "Invalid API token" };
    if (res.status === 404)
      return {
        valid: false,
        error: "Domain not found in your DigitalOcean account",
      };

    return {
      valid: false,
      error: `Verification failed (${res.status})`,
    };
  },

  createProvider(creds, domain) {
    return new DigitalOceanProvider(creds.api_token, domain);
  },
};
