import type { DnsRecord, DnsProvider } from "./dns";

const API_BASE = "https://api.vercel.com";

export type VercelCredentials = {
  api_token: string;
  team_id?: string;
  domain: string;
};

function getHeaders(apiToken: string) {
  return {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };
}

function teamQuery(teamId?: string) {
  return teamId ? `?teamId=${teamId}` : "";
}

export async function verifyCredentials(
  apiToken: string,
  domain: string,
  teamId?: string
): Promise<{ valid: boolean; error?: string }> {
  const res = await fetch(
    `${API_BASE}/v5/domains/${domain}/records?limit=1${teamId ? `&teamId=${teamId}` : ""}`,
    { headers: getHeaders(apiToken) }
  );

  if (res.ok) return { valid: true };

  if (res.status === 401) return { valid: false, error: "Invalid API token" };
  if (res.status === 403)
    return { valid: false, error: "Token lacks permission for this domain" };
  if (res.status === 404) return { valid: false, error: "Domain not found" };

  const data = await res.json().catch(() => null);
  const msg = data?.error?.message ?? `Verification failed (${res.status})`;
  return { valid: false, error: msg };
}

export function createVercelProvider(creds: VercelCredentials): DnsProvider {
  const headers = getHeaders(creds.api_token);
  const tq = teamQuery(creds.team_id);

  return {
    async listRecords(): Promise<DnsRecord[]> {
      const records: DnsRecord[] = [];
      let until: number | null = null;

      while (true) {
        const url = new URL(`${API_BASE}/v5/domains/${creds.domain}/records`);
        url.searchParams.set("limit", "100");
        if (creds.team_id) url.searchParams.set("teamId", creds.team_id);
        if (until) url.searchParams.set("until", String(until));

        const res = await fetch(url.toString(), { headers });
        if (!res.ok) break;

        const data = await res.json();
        for (const r of data.records) {
          if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
          records.push({
            id: r.id,
            name: r.name ? `${r.name}.${creds.domain}` : creds.domain,
            type: r.type,
            content: r.value,
          });
        }

        if (!data.pagination?.next) break;
        until = data.pagination.next;
      }

      return records;
    },

    async createRecord(params) {
      const res = await fetch(
        `${API_BASE}/v2/domains/${creds.domain}/records${tq}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: params.subdomain,
            type: params.type,
            value: params.content,
            ttl: 60,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to create DNS record");
      }

      return { id: data.uid };
    },

    async updateRecord(recordId, params) {
      const body: Record<string, unknown> = {
        value: params.content,
      };
      if (params.type) body.type = params.type;

      const res = await fetch(
        `${API_BASE}/v1/domains/records/${recordId}${tq}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to update DNS record");
      }
    },

    async deleteRecord(recordId) {
      const res = await fetch(
        `${API_BASE}/v2/domains/${creds.domain}/records/${recordId}${tq}`,
        { method: "DELETE", headers }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Failed to delete DNS record");
      }
    },
  };
}
