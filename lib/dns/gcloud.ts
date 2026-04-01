import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://dns.googleapis.com/dns/v1';

function headers(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

/** Google Cloud DNS uses base64url-encoded JSON for service account auth. */
async function getAccessToken(serviceAccountJson: string): Promise<string> {
  if (serviceAccountJson.length > 65_536) {
    throw new Error('Service account JSON too large');
  }
  let sa: Record<string, string>;
  try {
    sa = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error('Invalid service account JSON format');
  }
  if (
    typeof sa.client_email !== 'string' ||
    typeof sa.private_key !== 'string'
  ) {
    throw new Error('Service account JSON missing required fields');
  }
  const now = Math.floor(Date.now() / 1000);

  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const payload = btoa(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/ndev.clouddns.readwrite',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const signingInput = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signingInput}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    throw new Error('Failed to obtain access token from Google');
  }

  const data = await res.json();
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Encode type+name into a composite ID since Cloud DNS uses rrsets, not individual record IDs. */
function encodeId(type: string, name: string) {
  return `${type}:${name}`;
}

function decodeId(id: string) {
  const idx = id.indexOf(':');
  return { type: id.slice(0, idx), name: id.slice(idx + 1) };
}

/** Ensure name ends with a dot (Cloud DNS uses FQDNs). */
function fqdn(name: string) {
  return name.endsWith('.') ? name : `${name}.`;
}

class GoogleCloudDnsProvider implements DnsProvider {
  constructor(
    private accessToken: string,
    private projectId: string,
    private managedZone: string,
    private domain: string,
  ) {}

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let pageToken: string | undefined;

    while (true) {
      const url = new URL(
        `${API}/projects/${this.projectId}/managedZones/${this.managedZone}/rrsets`,
      );
      if (pageToken) url.searchParams.set('pageToken', pageToken);

      const res = await fetch(url.toString(), {
        headers: headers(this.accessToken),
      });

      if (!res.ok) break;

      const data = await res.json();

      for (const rrset of data.rrsets ?? []) {
        for (const rdata of rrset.rrdatas ?? []) {
          const name = rrset.name.replace(/\.$/, '');
          records.push({
            id: encodeId(rrset.type, rrset.name),
            name,
            type: rrset.type,
            content: rdata.replace(/\.$/, ''),
            ttl: rrset.ttl,
          });
        }
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const name = fqdn(`${params.subdomain}.${this.domain}`);

    const res = await fetch(
      `${API}/projects/${this.projectId}/managedZones/${this.managedZone}/rrsets`,
      {
        method: 'POST',
        headers: headers(this.accessToken),
        body: JSON.stringify({
          name,
          type: params.type,
          ttl: params.ttl ?? 300,
          rrdatas: [params.content],
        }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error?.message ??
          'Failed to create DNS record in Google Cloud DNS',
      );
    }

    return { id: encodeId(params.type, name) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const { type, name } = decodeId(recordId);
    const recordType = params.type ?? type;

    // Cloud DNS requires delete + create via changes API to update an rrset
    // First, get the existing rrset to know old rrdatas
    const getRes = await fetch(
      `${API}/projects/${this.projectId}/managedZones/${this.managedZone}/rrsets/${name}/${type}`,
      { headers: headers(this.accessToken) },
    );

    if (!getRes.ok) {
      throw new Error('Failed to fetch existing record for update');
    }

    const existing = await getRes.json();

    const res = await fetch(
      `${API}/projects/${this.projectId}/managedZones/${this.managedZone}/changes`,
      {
        method: 'POST',
        headers: headers(this.accessToken),
        body: JSON.stringify({
          deletions: [
            {
              name,
              type,
              ttl: existing.ttl,
              rrdatas: existing.rrdatas,
            },
          ],
          additions: [
            {
              name,
              type: recordType,
              ttl: params.ttl ?? 300,
              rrdatas: [params.content],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error?.message ??
          'Failed to update DNS record in Google Cloud DNS',
      );
    }
  }

  async deleteRecord(recordId: string) {
    const { type, name } = decodeId(recordId);

    // Get existing rrset first
    const getRes = await fetch(
      `${API}/projects/${this.projectId}/managedZones/${this.managedZone}/rrsets/${name}/${type}`,
      { headers: headers(this.accessToken) },
    );

    if (!getRes.ok && getRes.status !== 404) {
      throw new Error('Failed to fetch existing record for deletion');
    }

    if (getRes.status === 404) return;

    const existing = await getRes.json();

    const res = await fetch(
      `${API}/projects/${this.projectId}/managedZones/${this.managedZone}/changes`,
      {
        method: 'POST',
        headers: headers(this.accessToken),
        body: JSON.stringify({
          deletions: [
            {
              name,
              type,
              ttl: existing.ttl,
              rrdatas: existing.rrdatas,
            },
          ],
        }),
      },
    );

    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(
        data?.error?.message ??
          'Failed to delete DNS record from Google Cloud DNS',
      );
    }
  }
}

export const gcloudAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    try {
      const token = await getAccessToken(creds.service_account_json);
      const res = await fetch(
        `${API}/projects/${creds.project_id}/managedZones/${creds.managed_zone}`,
        { headers: headers(token) },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.dnsName?.replace(/\.$/, '') === domain) {
          return { valid: true };
        }
        return {
          valid: false,
          error: `Managed zone DNS name (${data.dnsName?.replace(/\.$/, '')}) does not match domain (${domain})`,
        };
      }
      if (res.status === 401 || res.status === 403)
        return {
          valid: false,
          error: 'Invalid service account or insufficient permissions',
        };
      if (res.status === 404)
        return { valid: false, error: 'Managed zone not found' };

      return { valid: false, error: `Verification failed (${res.status})` };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : 'Invalid service account JSON',
      };
    }
  },

  createProvider(creds, domain) {
    // Token is obtained synchronously here — in practice the token is cached
    // after verify() is called. For a production app you'd want token refresh logic.
    // For now we obtain a fresh token on each provider creation.
    let tokenPromise: Promise<string> | null = null;

    const getToken = () => {
      if (!tokenPromise) {
        tokenPromise = getAccessToken(creds.service_account_json);
      }
      return tokenPromise;
    };

    // Return a proxy that lazily resolves the access token
    return new Proxy({} as DnsProvider, {
      get(_, method: string) {
        return async (...args: unknown[]) => {
          const token = await getToken();
          const provider = new GoogleCloudDnsProvider(
            token,
            creds.project_id,
            creds.managed_zone,
            domain,
          );
          return (
            provider as unknown as Record<string, (...a: unknown[]) => unknown>
          )[method](...args);
        };
      },
    });
  },
};
