import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

/** Azure DNS uses OAuth2 with client credentials (service principal). */
async function getAccessToken(
  tenantId: string,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://management.azure.com/.default",
      }).toString(),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to obtain Azure access token");
  }

  const data = await res.json();
  return data.access_token;
}

function apiBase(subscriptionId: string, resourceGroup: string, zone: string) {
  return `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Network/dnsZones/${zone}`;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/** Azure DNS uses type+name as composite key. */
function encodeId(type: string, name: string) {
  return `${type}:${name}`;
}

function decodeId(id: string) {
  const idx = id.indexOf(":");
  return { type: id.slice(0, idx), name: id.slice(idx + 1) };
}

/** Map record type to Azure API path segment. */
function azureType(type: string) {
  const map: Record<string, string> = { A: "A", AAAA: "AAAA", CNAME: "CNAME" };
  return map[type] ?? type;
}

class AzureDnsProvider implements DnsProvider {
  constructor(
    private token: string,
    private base: string,
    private domain: string
  ) {}

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let url: string | null =
      `${this.base}/recordsets?api-version=2018-05-01&$top=500`;

    while (url) {
      const response: Response = await fetch(url, {
        headers: headers(this.token),
      });
      if (!response.ok) break;

      const data: any = await response.json();

      for (const rs of data.value ?? []) {
        const type = rs.type?.split("/").pop();
        if (!["A", "AAAA", "CNAME"].includes(type)) continue;

        const name = rs.name;

        if (type === "CNAME" && rs.properties?.CNAMERecord?.cname) {
          records.push({
            id: encodeId(type, name),
            name: name === "@" ? this.domain : `${name}.${this.domain}`,
            type,
            content: rs.properties.CNAMERecord.cname,
          });
        } else {
          const key = type === "A" ? "ARecords" : "AAAARecords";
          for (const r of rs.properties?.[key] ?? []) {
            records.push({
              id: encodeId(type, name),
              name: name === "@" ? this.domain : `${name}.${this.domain}`,
              type,
              content: type === "A" ? r.ipv4Address : r.ipv6Address,
            });
          }
        }
      }

      url = data.nextLink ?? null;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const type = azureType(params.type);
    let properties: Record<string, unknown>;

    if (type === "CNAME") {
      properties = { TTL: 300, CNAMERecord: { cname: params.content } };
    } else {
      const key = type === "A" ? "ARecords" : "AAAARecords";
      const field = type === "A" ? "ipv4Address" : "ipv6Address";
      properties = { TTL: 300, [key]: [{ [field]: params.content }] };
    }

    const res = await fetch(
      `${this.base}/${type}/${params.subdomain}?api-version=2018-05-01`,
      {
        method: "PUT",
        headers: headers(this.token),
        body: JSON.stringify({ properties }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error?.message ?? "Failed to create DNS record in Azure DNS"
      );
    }

    return { id: encodeId(params.type, params.subdomain) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const { type, name } = decodeId(recordId);
    const recordType = azureType(params.type ?? type);
    let properties: Record<string, unknown>;

    if (recordType === "CNAME") {
      properties = { TTL: 300, CNAMERecord: { cname: params.content } };
    } else {
      const key = recordType === "A" ? "ARecords" : "AAAARecords";
      const field = recordType === "A" ? "ipv4Address" : "ipv6Address";
      properties = { TTL: 300, [key]: [{ [field]: params.content }] };
    }

    const res = await fetch(
      `${this.base}/${recordType}/${name}?api-version=2018-05-01`,
      {
        method: "PUT",
        headers: headers(this.token),
        body: JSON.stringify({ properties }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error?.message ?? "Failed to update DNS record in Azure DNS"
      );
    }
  }

  async deleteRecord(recordId: string) {
    const { type, name } = decodeId(recordId);
    const recordType = azureType(type);

    const res = await fetch(
      `${this.base}/${recordType}/${name}?api-version=2018-05-01`,
      { method: "DELETE", headers: headers(this.token) }
    );

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error?.message ?? "Failed to delete DNS record from Azure DNS"
      );
    }
  }
}

export const azureAdapter: PlatformAdapter = {
  async verify(creds) {
    try {
      const token = await getAccessToken(
        creds.tenant_id,
        creds.client_id,
        creds.client_secret
      );

      const base = apiBase(
        creds.subscription_id,
        creds.resource_group,
        creds.zone_name
      );
      const res = await fetch(`${base}?api-version=2018-05-01`, {
        headers: headers(token),
      });

      if (res.ok) return { valid: true };
      if (res.status === 401 || res.status === 403)
        return {
          valid: false,
          error: "Invalid credentials or insufficient permissions",
        };
      if (res.status === 404)
        return { valid: false, error: "DNS zone not found" };

      return { valid: false, error: `Verification failed (${res.status})` };
    } catch (e) {
      return {
        valid: false,
        error:
          e instanceof Error ? e.message : "Failed to authenticate with Azure",
      };
    }
  },

  createProvider(creds, domain) {
    const base = apiBase(
      creds.subscription_id,
      creds.resource_group,
      creds.zone_name
    );

    let tokenPromise: Promise<string> | null = null;
    const getToken = () => {
      if (!tokenPromise) {
        tokenPromise = getAccessToken(
          creds.tenant_id,
          creds.client_id,
          creds.client_secret
        );
      }
      return tokenPromise;
    };

    return new Proxy({} as DnsProvider, {
      get(_, method: string) {
        return async (...args: unknown[]) => {
          const token = await getToken();
          const provider = new AzureDnsProvider(token, base, domain);
          return (
            provider as unknown as Record<string, (...a: unknown[]) => unknown>
          )[method](...args);
        };
      },
    });
  },
};
