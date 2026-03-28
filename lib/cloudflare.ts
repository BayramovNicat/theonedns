const API_BASE = "https://api.cloudflare.com/client/v4";

export type CloudflareCredentials = {
  api_token: string;
  zone_id: string;
  domain: string;
};

function getHeaders(apiToken: string) {
  return {
    Authorization: `Bearer ${apiToken}`,
    "Content-Type": "application/json",
  };
}

export async function verifyCredentials(
  apiToken: string,
  zoneId: string
): Promise<{ valid: boolean; error?: string }> {
  // Verify by listing DNS records for the zone — this validates the token,
  // zone ID, and DNS permissions in one call. Works for both User API Tokens
  // and Account API Tokens (cfat_ prefix).
  const res = await fetch(
    `${API_BASE}/zones/${zoneId}/dns_records?per_page=1`,
    { headers: getHeaders(apiToken) }
  );
  const data = await res.json();

  if (data.success) {
    return { valid: true };
  }

  const msg = data.errors?.[0]?.message ?? "Invalid token or zone ID";
  return { valid: false, error: msg };
}

export type DnsRecord = {
  id: string;
  name: string;
  type: string;
  content: string;
  proxied: boolean;
  created_on: string;
};

export async function listDnsRecords(
  creds: CloudflareCredentials
): Promise<DnsRecord[]> {
  const records: DnsRecord[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${API_BASE}/zones/${creds.zone_id}/dns_records?per_page=100&page=${page}`,
      { headers: getHeaders(creds.api_token) }
    );
    const data = await res.json();

    if (!data.success) break;

    records.push(...data.result);

    if (data.result.length < 100) break;
    page++;
  }

  return records;
}

export async function createDnsRecord(
  creds: CloudflareCredentials,
  params: {
    subdomain: string;
    type: "A" | "CNAME";
    content: string;
    proxied: boolean;
  }
) {
  const name = `${params.subdomain}.${creds.domain}`;

  const res = await fetch(`${API_BASE}/zones/${creds.zone_id}/dns_records`, {
    method: "POST",
    headers: getHeaders(creds.api_token),
    body: JSON.stringify({
      type: params.type,
      name,
      content: params.content,
      proxied: params.proxied,
      ttl: 1, // auto
    }),
  });

  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message ?? "Failed to create DNS record";
    throw new Error(msg);
  }

  return data.result as { id: string };
}

export async function updateDnsRecord(
  creds: CloudflareCredentials,
  recordId: string,
  params: {
    type?: string;
    content: string;
    proxied: boolean;
  }
) {
  const body: Record<string, unknown> = {
    content: params.content,
    proxied: params.proxied,
  };
  if (params.type) body.type = params.type;

  const res = await fetch(
    `${API_BASE}/zones/${creds.zone_id}/dns_records/${recordId}`,
    {
      method: "PATCH",
      headers: getHeaders(creds.api_token),
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message ?? "Failed to update DNS record";
    throw new Error(msg);
  }
}

export async function deleteDnsRecord(
  creds: CloudflareCredentials,
  recordId: string
) {
  const res = await fetch(
    `${API_BASE}/zones/${creds.zone_id}/dns_records/${recordId}`,
    {
      method: "DELETE",
      headers: getHeaders(creds.api_token),
    }
  );

  const data = await res.json();
  if (!data.success) {
    const msg = data.errors?.[0]?.message ?? "Failed to delete DNS record";
    throw new Error(msg);
  }
}
