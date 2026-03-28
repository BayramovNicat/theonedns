import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.vultr.com/v2";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

class VultrProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let cursor: string | undefined;

    while (true) {
      const url = new URL(`${API}/domains/${this.domain}/records`);
      url.searchParams.set("per_page", "500");
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url.toString(), { headers: this.hdrs });
      if (!res.ok) break;

      const data = await res.json();
      const items = data.records ?? [];

      for (const r of items) {
        if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
        records.push({
          id: r.id,
          name: r.name === "" ? this.domain : `${r.name}.${this.domain}`,
          type: r.type,
          content: r.data,
        });
      }

      cursor = data.meta?.links?.next;
      if (!cursor || cursor === "") break;
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
        ttl: 300,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to create DNS record");
    }

    const data = await res.json();
    return { id: data.record.id };
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
      throw new Error(data?.error ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/domains/${this.domain}/records/${recordId}`,
      { method: "DELETE", headers: this.hdrs }
    );

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "Failed to delete DNS record");
    }
  }
}

export const vultrAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/domains/${domain}`, {
      headers: headers(creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: "Invalid API token" };
    if (res.status === 404)
      return {
        valid: false,
        error: "Domain not found in your Vultr account",
      };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new VultrProvider(creds.api_token, domain);
  },
};
