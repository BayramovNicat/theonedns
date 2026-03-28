import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.porkbun.com/api/json/v3";

function authBody(apiKey: string, secretApiKey: string) {
  return { apikey: apiKey, secretapikey: secretApiKey };
}

class PorkbunProvider implements DnsProvider {
  constructor(
    private apiKey: string,
    private secretApiKey: string,
    private domain: string
  ) {}

  async listRecords(): Promise<DnsRecord[]> {
    const res = await fetch(`${API}/dns/retrieve/${this.domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authBody(this.apiKey, this.secretApiKey)),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (data.status !== "SUCCESS") return [];

    const records: DnsRecord[] = [];
    for (const r of data.records ?? []) {
      records.push({
        id: String(r.id),
        name: r.name,
        type: r.type,
        content: r.content,
        ttl: r.ttl ? Number(r.ttl) : undefined,
        priority: r.prio ? Number(r.prio) : undefined,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/dns/create/${this.domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...authBody(this.apiKey, this.secretApiKey),
        type: params.type,
        name: params.subdomain,
        content: params.content,
        ttl: params.ttl ?? 600,
        ...(params.priority != null && { prio: params.priority }),
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
    const body: Record<string, unknown> = {
      ...authBody(this.apiKey, this.secretApiKey),
      content: params.content,
    };
    if (params.type) body.type = params.type;

    const res = await fetch(`${API}/dns/edit/${this.domain}/${recordId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(`${API}/dns/delete/${this.domain}/${recordId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authBody(this.apiKey, this.secretApiKey)),
    });

    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to delete DNS record");
    }
  }
}

export const porkbunAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    // Porkbun has a ping endpoint, but we also check domain access
    const res = await fetch(`${API}/dns/retrieve/${domain}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(authBody(creds.api_key, creds.secret_api_key)),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403)
        return { valid: false, error: "Invalid API key or secret" };
      return { valid: false, error: `Verification failed (${res.status})` };
    }

    const data = await res.json();
    if (data.status === "SUCCESS") return { valid: true };

    return {
      valid: false,
      error: data.message ?? "Domain not found in your Porkbun account",
    };
  },

  createProvider(creds, domain) {
    return new PorkbunProvider(creds.api_key, creds.secret_api_key, domain);
  },
};
