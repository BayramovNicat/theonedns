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

export async function verifyToken(apiToken: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/user/tokens/verify`, {
    headers: getHeaders(apiToken),
  });
  const data = await res.json();
  return data.success === true;
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
