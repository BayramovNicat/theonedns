import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.netlify.com/api/v1";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

class NetlifyProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private zoneId: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let page = 1;

    while (true) {
      const res = await fetch(
        `${API}/dns_zones/${this.zoneId}/dns_records?per_page=100&page=${page}`,
        { headers: this.hdrs }
      );
      if (!res.ok) break;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const r of data) {
        if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
        records.push({
          id: r.id,
          name: r.hostname,
          type: r.type,
          content: r.value,
        });
      }

      if (data.length < 100) break;
      page++;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const hostname = `${params.subdomain}.${this.domain}`;
    const res = await fetch(`${API}/dns_zones/${this.zoneId}/dns_records`, {
      method: "POST",
      headers: this.hdrs,
      body: JSON.stringify({
        type: params.type,
        hostname,
        value: params.content,
        ttl: 3600,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.message ?? data?.errors?.hostname ?? "Failed to create DNS record"
      );
    }

    const data = await res.json();
    return { id: data.id };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    // Netlify has no PATCH endpoint — delete and recreate
    const getRes = await fetch(
      `${API}/dns_zones/${this.zoneId}/dns_records/${recordId}`,
      { headers: this.hdrs }
    );

    if (!getRes.ok) {
      throw new Error("Failed to fetch existing record for update");
    }

    const existing = await getRes.json();

    // Delete old record
    const delRes = await fetch(
      `${API}/dns_zones/${this.zoneId}/dns_records/${recordId}`,
      { method: "DELETE", headers: this.hdrs }
    );

    if (!delRes.ok && delRes.status !== 204) {
      throw new Error("Failed to delete old record during update");
    }

    // Recreate with new values
    const createRes = await fetch(
      `${API}/dns_zones/${this.zoneId}/dns_records`,
      {
        method: "POST",
        headers: this.hdrs,
        body: JSON.stringify({
          type: params.type ?? existing.type,
          hostname: existing.hostname,
          value: params.content,
          ttl: existing.ttl ?? 3600,
        }),
      }
    );

    if (!createRes.ok) {
      const data = await createRes.json().catch(() => null);
      throw new Error(
        data?.message ?? "Failed to recreate record during update"
      );
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(
      `${API}/dns_zones/${this.zoneId}/dns_records/${recordId}`,
      { method: "DELETE", headers: this.hdrs }
    );

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to delete DNS record");
    }
  }
}

export const netlifyAdapter: PlatformAdapter = {
  async verify(creds) {
    const res = await fetch(`${API}/dns_zones/${creds.zone_id}`, {
      headers: headers(creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401)
      return { valid: false, error: "Invalid access token" };
    if (res.status === 404)
      return { valid: false, error: "DNS zone not found" };

    return {
      valid: false,
      error: `Verification failed (${res.status})`,
    };
  },

  createProvider(creds, domain) {
    return new NetlifyProvider(creds.api_token, creds.zone_id, domain);
  },
};
