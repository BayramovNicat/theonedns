import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://route53.amazonaws.com/2013-04-01";

/** AWS Signature Version 4 signing for Route 53 requests. */
async function signedHeaders(
  method: string,
  url: string,
  accessKeyId: string,
  secretAccessKey: string,
  body: string = ""
) {
  const parsed = new URL(url);
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 8);
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const region = "us-east-1";
  const service = "route53";

  const canonicalHeaders = `host:${parsed.host}\nx-amz-date:${amzDate}\n`;
  const signedHeadersList = "host;x-amz-date";

  const payloadHash = await sha256Hex(body);

  const canonicalRequest = [
    method,
    parsed.pathname,
    parsed.search?.slice(1) ?? "",
    canonicalHeaders,
    signedHeadersList,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await getSignatureKey(
    secretAccessKey,
    dateStamp,
    region,
    service
  );
  const signature = await hmacHex(signingKey, stringToSign);

  return {
    "X-Amz-Date": amzDate,
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersList}, Signature=${signature}`,
    "Content-Type": "application/xml",
  };
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(data)
  );
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSign(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmacSign(key, data);
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSign(
    new TextEncoder().encode(`AWS4${secret}`).buffer,
    dateStamp
  );
  const kRegion = await hmacSign(kDate, region);
  const kService = await hmacSign(kRegion, service);
  return hmacSign(kService, "aws4_request");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Parse simple XML values — avoids needing a full XML parser. */
function xmlValue(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`);
  return xml.match(re)?.[1] ?? null;
}

function xmlAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const results: string[] = [];
  let m;
  while ((m = re.exec(xml))) results.push(m[1]);
  return results;
}

/** Route 53 has no record IDs — use type:name as composite key. */
function encodeId(type: string, name: string) {
  return `${type}:${name}`;
}

function decodeId(id: string) {
  const idx = id.indexOf(":");
  return { type: id.slice(0, idx), name: id.slice(idx + 1) };
}

function fqdn(name: string) {
  return name.endsWith(".") ? name : `${name}.`;
}

class Route53Provider implements DnsProvider {
  constructor(
    private accessKeyId: string,
    private secretAccessKey: string,
    private hostedZoneId: string,
    private domain: string
  ) {}

  private async request(method: string, path: string, body: string = "") {
    const url = `${API}${path}`;
    const hdrs = await signedHeaders(
      method,
      url,
      this.accessKeyId,
      this.secretAccessKey,
      body
    );
    return fetch(url, {
      method,
      headers: hdrs,
      ...(body ? { body } : {}),
    });
  }

  async listRecords(): Promise<DnsRecord[]> {
    const records: DnsRecord[] = [];
    let nextName: string | undefined;
    let nextType: string | undefined;

    while (true) {
      let path = `/hostedzones/${this.hostedZoneId}/rrset?maxitems=300`;
      if (nextName) path += `&name=${encodeURIComponent(nextName)}`;
      if (nextType) path += `&type=${encodeURIComponent(nextType)}`;

      const res = await this.request("GET", path);
      if (!res.ok) break;

      const xml = await res.text();
      const rrsets = xmlAll(xml, "ResourceRecordSet");

      for (const rrset of rrsets) {
        const type = xmlValue(rrset, "Type");
        const name = xmlValue(rrset, "Name");
        if (!type || !name) continue;
        if (!["A", "AAAA", "CNAME"].includes(type)) continue;

        const values = xmlAll(rrset, "Value");
        for (const value of values) {
          records.push({
            id: encodeId(type, name),
            name: name.replace(/\.$/, ""),
            type,
            content: value.replace(/\.$/, ""),
          });
        }
      }

      const isTruncated = xmlValue(xml, "IsTruncated");
      if (isTruncated !== "true") break;
      nextName = xmlValue(xml, "NextRecordName") ?? undefined;
      nextType = xmlValue(xml, "NextRecordType") ?? undefined;
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const name = fqdn(`${params.subdomain}.${this.domain}`);
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/">
  <ChangeBatch>
    <Changes>
      <Change>
        <Action>CREATE</Action>
        <ResourceRecordSet>
          <Name>${escapeXml(name)}</Name>
          <Type>${escapeXml(params.type)}</Type>
          <TTL>300</TTL>
          <ResourceRecords>
            <ResourceRecord><Value>${escapeXml(params.content)}</Value></ResourceRecord>
          </ResourceRecords>
        </ResourceRecordSet>
      </Change>
    </Changes>
  </ChangeBatch>
</ChangeResourceRecordSetsRequest>`;

    const res = await this.request(
      "POST",
      `/hostedzones/${this.hostedZoneId}/rrset`,
      body
    );

    if (!res.ok) {
      const xml = await res.text();
      throw new Error(
        xmlValue(xml, "Message") ?? "Failed to create DNS record"
      );
    }

    return { id: encodeId(params.type, name) };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const { type, name } = decodeId(recordId);

    // Route 53 requires UPSERT to update
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/">
  <ChangeBatch>
    <Changes>
      <Change>
        <Action>UPSERT</Action>
        <ResourceRecordSet>
          <Name>${escapeXml(name)}</Name>
          <Type>${escapeXml(params.type ?? type)}</Type>
          <TTL>300</TTL>
          <ResourceRecords>
            <ResourceRecord><Value>${escapeXml(params.content)}</Value></ResourceRecord>
          </ResourceRecords>
        </ResourceRecordSet>
      </Change>
    </Changes>
  </ChangeBatch>
</ChangeResourceRecordSetsRequest>`;

    const res = await this.request(
      "POST",
      `/hostedzones/${this.hostedZoneId}/rrset`,
      body
    );

    if (!res.ok) {
      const xml = await res.text();
      throw new Error(
        xmlValue(xml, "Message") ?? "Failed to update DNS record"
      );
    }
  }

  async deleteRecord(recordId: string) {
    const { type, name } = decodeId(recordId);

    // Need to get current values first to delete
    const listRes = await this.request(
      "GET",
      `/hostedzones/${this.hostedZoneId}/rrset?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}&maxitems=1`
    );

    if (!listRes.ok) return;

    const listXml = await listRes.text();
    const rrsets = xmlAll(listXml, "ResourceRecordSet");
    if (rrsets.length === 0) return;

    const values = xmlAll(rrsets[0], "Value");
    const ttl = xmlValue(rrsets[0], "TTL") ?? "300";

    const resourceRecords = values
      .map(
        (v) => `<ResourceRecord><Value>${escapeXml(v)}</Value></ResourceRecord>`
      )
      .join("");

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2013-04-01/">
  <ChangeBatch>
    <Changes>
      <Change>
        <Action>DELETE</Action>
        <ResourceRecordSet>
          <Name>${escapeXml(name)}</Name>
          <Type>${escapeXml(type)}</Type>
          <TTL>${escapeXml(ttl)}</TTL>
          <ResourceRecords>${resourceRecords}</ResourceRecords>
        </ResourceRecordSet>
      </Change>
    </Changes>
  </ChangeBatch>
</ChangeResourceRecordSetsRequest>`;

    const res = await this.request(
      "POST",
      `/hostedzones/${this.hostedZoneId}/rrset`,
      body
    );

    if (!res.ok) {
      const xml = await res.text();
      throw new Error(
        xmlValue(xml, "Message") ?? "Failed to delete DNS record"
      );
    }
  }
}

export const route53Adapter: PlatformAdapter = {
  async verify(creds, _domain) {
    const zoneId = creds.hosted_zone_id.replace(/^\/hostedzone\//, "");
    const url = `${API}/hostedzones/${zoneId}`;
    const hdrs = await signedHeaders(
      "GET",
      url,
      creds.access_key_id,
      creds.secret_access_key
    );

    const res = await fetch(url, { headers: hdrs });

    if (res.ok) return { valid: true };
    if (res.status === 401 || res.status === 403)
      return { valid: false, error: "Invalid AWS credentials" };
    if (res.status === 404)
      return { valid: false, error: "Hosted zone not found" };

    return { valid: false, error: `Verification failed (${res.status})` };
  },

  createProvider(creds, domain) {
    const zoneId = creds.hosted_zone_id.replace(/^\/hostedzone\//, "");
    return new Route53Provider(
      creds.access_key_id,
      creds.secret_access_key,
      zoneId,
      domain
    );
  },
};
