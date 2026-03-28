import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://dns.hetzner.com/api/v1";

function headers(token: string) {
  return {
    "Auth-API-Token": token,
    "Content-Type": "application/json",
  };
}

class HetznerProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private zoneId: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const res = await fetch(`${API}/records?zone_id=${this.zoneId}`, {
      headers: this.hdrs,
    });

    if (!res.ok) return [];

    const data = await res.json();
    const records: DnsRecord[] = [];

    for (const r of data.records ?? []) {
      if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
      records.push({
        id: r.id,
        name: r.name === "@" ? this.domain : `${r.name}.${this.domain}`,
        type: r.type,
        content: r.value,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/records`, {
      method: "POST",
      headers: this.hdrs,
      body: JSON.stringify({
        zone_id: this.zoneId,
        type: params.type,
        name: params.subdomain,
        value: params.content,
        ttl: 1800,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error?.message ?? "Failed to create DNS record");
    }

    const data = await res.json();
    return { id: data.record.id };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    // Hetzner uses PUT (full replacement), so fetch existing record first
    const getRes = await fetch(`${API}/records/${recordId}`, {
      headers: this.hdrs,
    });

    if (!getRes.ok) {
      throw new Error("Failed to fetch existing record for update");
    }

    const existing = (await getRes.json()).record;

    const res = await fetch(`${API}/records/${recordId}`, {
      method: "PUT",
      headers: this.hdrs,
      body: JSON.stringify({
        zone_id: this.zoneId,
        type: params.type ?? existing.type,
        name: existing.name,
        value: params.content,
        ttl: existing.ttl ?? 1800,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error?.message ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(`${API}/records/${recordId}`, {
      method: "DELETE",
      headers: this.hdrs,
    });

    if (!res.ok && res.status !== 200) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error?.message ?? "Failed to delete DNS record");
    }
  }
}

export const hetznerAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/zones?name=${domain}`, {
      headers: headers(creds.api_token),
    });

    if (!res.ok) {
      if (res.status === 401)
        return { valid: false, error: "Invalid API token" };
      return { valid: false, error: `Verification failed (${res.status})` };
    }

    const data = await res.json();
    const zone = data.zones?.find((z: { name: string }) => z.name === domain);

    if (!zone) {
      return {
        valid: false,
        error: "Domain not found in your Hetzner DNS account",
      };
    }

    return { valid: true };
  },

  createProvider(creds, domain) {
    return new HetznerProvider(creds.api_token, creds.zone_id, domain);
  },
};
