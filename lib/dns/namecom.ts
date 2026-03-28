import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.name.com/v4";

function headers(username: string, token: string) {
  const encoded = btoa(`${username}:${token}`);
  return {
    Authorization: `Basic ${encoded}`,
    "Content-Type": "application/json",
  };
}

class NamecomProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    username: string,
    token: string,
    private domain: string
  ) {
    this.hdrs = headers(username, token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${API}/domains/${this.domain}/records?page=${page}&perPage=1000`,
        { headers: this.hdrs }
      );
      if (!res.ok) break;

      const data = await res.json();
      const items = data.records ?? [];

      for (const r of items) {
        if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
        records.push({
          id: String(r.id),
          name: r.fqdn?.replace(/\.$/, "") ?? this.domain,
          type: r.type,
          content: r.answer,
        });
      }

      if (!data.nextPage || items.length === 0) break;
      page = data.nextPage;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/domains/${this.domain}/records`, {
      method: "POST",
      headers: this.hdrs,
      body: JSON.stringify({
        type: params.type,
        host: params.subdomain,
        answer: params.content,
        ttl: 300,
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
    const body: Record<string, unknown> = { answer: params.content };
    if (params.type) body.type = params.type;

    const res = await fetch(
      `${API}/domains/${this.domain}/records/${recordId}`,
      {
        method: "PUT",
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

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to delete DNS record");
    }
  }
}

export const namecomAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/domains/${domain}`, {
      headers: headers(creds.username, creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401)
      return { valid: false, error: "Invalid username or API token" };
    if (res.status === 404)
      return {
        valid: false,
        error: "Domain not found in your Name.com account",
      };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new NamecomProvider(creds.username, creds.api_token, domain);
  },
};
