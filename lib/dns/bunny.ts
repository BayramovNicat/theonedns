import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.bunny.net/dnszone";

function headers(token: string) {
  return {
    AccessKey: token,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

class BunnyProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private zoneId: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const res = await fetch(`${API}/${this.zoneId}`, {
      headers: this.hdrs,
    });
    if (!res.ok) return [];

    const data = await res.json();
    const records: DnsRecord[] = [];

    for (const r of data.Records ?? []) {
      const typeName = bunnyTypeName(r.Type);
      if (!typeName) continue;
      records.push({
        id: String(r.Id),
        name: r.Name === "" ? this.domain : `${r.Name}.${this.domain}`,
        type: typeName,
        content: r.Value,
        ttl: r.Ttl,
        priority: r.Priority,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(`${API}/${this.zoneId}/records`, {
      method: "PUT",
      headers: this.hdrs,
      body: JSON.stringify({
        Type: bunnyTypeId(params.type),
        Name: params.subdomain,
        Value: params.content,
        Ttl: params.ttl ?? 300,
        ...(params.priority != null && { Priority: params.priority }),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.Message ?? "Failed to create DNS record");
    }

    const data = await res.json();
    return { id: String(data.Id) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const res = await fetch(`${API}/${this.zoneId}/records/${recordId}`, {
      method: "POST",
      headers: this.hdrs,
      body: JSON.stringify({
        Type: bunnyTypeId(params.type ?? "A"),
        Value: params.content,
        Ttl: params.ttl ?? 300,
        ...(params.priority != null && { Priority: params.priority }),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.Message ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const res = await fetch(`${API}/${this.zoneId}/records/${recordId}`, {
      method: "DELETE",
      headers: this.hdrs,
    });

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.Message ?? "Failed to delete DNS record");
    }
  }
}

/** Bunny uses numeric type IDs. */
function bunnyTypeId(type: string): number {
  const map: Record<string, number> = {
    A: 0,
    AAAA: 1,
    CNAME: 2,
    MX: 3,
    TXT: 4,
    NS: 5,
    SRV: 6,
  };
  return map[type] ?? 0;
}

function bunnyTypeName(typeId: number): string | null {
  const map: Record<number, string> = {
    0: "A",
    1: "AAAA",
    2: "CNAME",
    3: "MX",
    4: "TXT",
    5: "NS",
    6: "SRV",
  };
  return map[typeId] ?? null;
}

export const bunnyAdapter: PlatformAdapter = {
  async verify(creds) {
    const res = await fetch(`${API}/${creds.zone_id}`, {
      headers: headers(creds.api_key),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401) return { valid: false, error: "Invalid API key" };
    if (res.status === 404)
      return { valid: false, error: "DNS zone not found" };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new BunnyProvider(creds.api_key, creds.zone_id, domain);
  },
};
