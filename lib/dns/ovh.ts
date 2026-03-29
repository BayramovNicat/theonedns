import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from './types';

const API = 'https://eu.api.ovh.com/1.0';

/** OVH API uses application key + secret + consumer key with signature. */
async function signedHeaders(
  method: string,
  url: string,
  appKey: string,
  appSecret: string,
  consumerKey: string,
  body: string = '',
) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign = [appSecret, consumerKey, method, url, body, timestamp].join(
    '+',
  );

  const hash = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(toSign),
  );
  const signature =
    '$1$' +
    [...new Uint8Array(hash)]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

  return {
    'X-Ovh-Application': appKey,
    'X-Ovh-Consumer': consumerKey,
    'X-Ovh-Timestamp': timestamp,
    'X-Ovh-Signature': signature,
    'Content-Type': 'application/json',
  };
}

async function ovhFetch(
  method: string,
  path: string,
  appKey: string,
  appSecret: string,
  consumerKey: string,
  body?: string,
) {
  const url = `${API}${path}`;
  const hdrs = await signedHeaders(
    method,
    url,
    appKey,
    appSecret,
    consumerKey,
    body,
  );
  return fetch(url, {
    method,
    headers: hdrs,
    ...(body ? { body } : {}),
  });
}

class OvhProvider implements DnsProvider {
  constructor(
    private appKey: string,
    private appSecret: string,
    private consumerKey: string,
    private domain: string,
  ) {}

  private req(method: string, path: string, body?: string) {
    return ovhFetch(
      method,
      path,
      this.appKey,
      this.appSecret,
      this.consumerKey,
      body,
    );
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];

    for (const fieldType of ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV']) {
      const idsRes = await this.req(
        'GET',
        `/domain/zone/${this.domain}/record?fieldType=${fieldType}`,
      );
      if (!idsRes.ok) continue;

      const ids: number[] = await idsRes.json();

      for (const id of ids) {
        const res = await this.req(
          'GET',
          `/domain/zone/${this.domain}/record/${id}`,
        );
        if (!res.ok) continue;

        const r = await res.json();
        records.push({
          id: String(r.id),
          name:
            r.subDomain === '' ? this.domain : `${r.subDomain}.${this.domain}`,
          type: r.fieldType,
          content: r.target,
          ttl: r.ttl,
        });
      }
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const res = await this.req(
      'POST',
      `/domain/zone/${this.domain}/record`,
      JSON.stringify({
        fieldType: params.type,
        subDomain: params.subdomain,
        target: params.content,
        ttl: params.ttl ?? 300,
      }),
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to create DNS record');
    }

    const data = await res.json();

    // Refresh the zone to apply changes
    await this.req('POST', `/domain/zone/${this.domain}/refresh`);

    return { id: String(data.id) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const body: Record<string, unknown> = { target: params.content };
    if (params.type) body.fieldType = params.type;
    if (params.ttl != null) body.ttl = params.ttl;

    const res = await this.req(
      'PUT',
      `/domain/zone/${this.domain}/record/${recordId}`,
      JSON.stringify(body),
    );

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to update DNS record');
    }

    await this.req('POST', `/domain/zone/${this.domain}/refresh`);
  }

  async deleteRecord(recordId: string) {
    const res = await this.req(
      'DELETE',
      `/domain/zone/${this.domain}/record/${recordId}`,
    );

    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message ?? 'Failed to delete DNS record');
    }

    await this.req('POST', `/domain/zone/${this.domain}/refresh`);
  }
}

export const ovhAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const res = await ovhFetch(
      'GET',
      `/domain/zone/${domain}`,
      creds.app_key,
      creds.app_secret,
      creds.consumer_key,
    );

    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: 'Invalid credentials' };
    if (res.status === 404)
      return {
        valid: false,
        error: 'Domain not found in your OVH account',
      };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    return new OvhProvider(
      creds.app_key,
      creds.app_secret,
      creds.consumer_key,
      domain,
    );
  },
};
