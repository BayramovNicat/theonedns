import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.gandi.net/v5";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/** Gandi uses type+name as composite key for rrsets. */
function encodeId(type: string, name: string) {
  return `${type}:${name}`;
}

function decodeId(id: string) {
  const idx = id.indexOf(":");
  return { type: id.slice(0, idx), name: id.slice(idx + 1) };
}

class GandiProvider implements DnsProvider {
  private hdrs: Record<string, string>;

  constructor(
    token: string,
    private domain: string
  ) {
    this.hdrs = headers(token);
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];

    const res = await fetch(`${API}/livedns/domains/${this.domain}/records`, {
      headers: this.hdrs,
    });
    if (!res.ok) return [];

    const data: {
      rrset_name: string;
      rrset_type: string;
      rrset_values: string[];
      rrset_ttl?: number;
    }[] = await res.json();

    for (const rrset of data) {
      for (const value of rrset.rrset_values) {
        records.push({
          id: encodeId(rrset.rrset_type, rrset.rrset_name),
          name:
            rrset.rrset_name === "@"
              ? this.domain
              : `${rrset.rrset_name}.${this.domain}`,
          type: rrset.rrset_type,
          content: value,
          ttl: rrset.rrset_ttl,
        });
      }
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await fetch(
      `${API}/livedns/domains/${this.domain}/records/${params.subdomain}/${params.type}`,
      {
        method: "PUT",
        headers: this.hdrs,
        body: JSON.stringify({
          rrset_values: [params.content],
          rrset_ttl: params.ttl ?? 300,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to create DNS record");
    }

    return { id: encodeId(params.type, params.subdomain) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const { type, name } = decodeId(recordId);
    const recordType = params.type ?? type;

    const res = await fetch(
      `${API}/livedns/domains/${this.domain}/records/${name}/${recordType}`,
      {
        method: "PUT",
        headers: this.hdrs,
        body: JSON.stringify({
          rrset_values: [params.content],
          rrset_ttl: params.ttl ?? 300,
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to update DNS record");
    }
  }

  async deleteRecord(recordId: string) {
    const { type, name } = decodeId(recordId);

    const res = await fetch(
      `${API}/livedns/domains/${this.domain}/records/${name}/${type}`,
      { method: "DELETE", headers: this.hdrs }
    );

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? "Failed to delete DNS record");
    }
  }
}

export const gandiAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await fetch(`${API}/livedns/domains/${domain}`, {
      headers: headers(creds.api_token),
    });

    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: "Invalid API token" };
    if (res.status === 404)
      return {
        valid: false,
        error: "Domain not found in your Gandi account",
      };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new GandiProvider(creds.api_token, domain);
  },
};
