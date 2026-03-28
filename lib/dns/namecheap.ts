import type {
  CreateRecordParams,
  DnsProvider,
  DnsRecord,
  PlatformAdapter,
  UpdateRecordParams,
} from "./types";

const API = "https://api.namecheap.com/xml.response";

/** Split domain into SLD and TLD (e.g. "example.com" → ["example", "com"]). */
function splitDomain(domain: string): { sld: string; tld: string } {
  const parts = domain.split(".");
  const tld = parts.slice(1).join(".");
  return { sld: parts[0], tld };
}

/** Parse host records from Namecheap XML response. */
function parseRecords(xml: string, domain: string): NamecheapRecord[] {
  const records: NamecheapRecord[] = [];
  const re =
    /<host\s[^>]*?HostId="(\d+)"[^>]*?Name="([^"]*)"[^>]*?Type="([^"]*)"[^>]*?Address="([^"]*)"[^>]*?TTL="(\d+)"[^>]*?\/>/gi;
  let m;
  while ((m = re.exec(xml))) {
    records.push({
      hostId: m[1],
      name: m[2],
      type: m[3],
      address: m[4],
      ttl: m[5],
      domain,
    });
  }
  return records;
}

type NamecheapRecord = {
  hostId: string;
  name: string;
  type: string;
  address: string;
  ttl: string;
  domain: string;
};

function buildBaseParams(apiUser: string, apiKey: string) {
  return new URLSearchParams({
    ApiUser: apiUser,
    ApiKey: apiKey,
    UserName: apiUser,
    ClientIp: "0.0.0.0",
  });
}

/**
 * Namecheap doesn't support individual record CRUD — you must read ALL records,
 * modify the list, then write ALL records back via setHosts. This adapter
 * implements that pattern.
 */
class NamecheapProvider implements DnsProvider {
  private sld: string;
  private tld: string;

  constructor(
    private apiUser: string,
    private apiKey: string,
    private domain: string
  ) {
    const { sld, tld } = splitDomain(domain);
    this.sld = sld;
    this.tld = tld;
  }

  private async getHosts(): Promise<NamecheapRecord[]> {
    const params = buildBaseParams(this.apiUser, this.apiKey);
    params.set("Command", "namecheap.domains.dns.getHosts");
    params.set("SLD", this.sld);
    params.set("TLD", this.tld);

    const res = await fetch(`${API}?${params.toString()}`);
    if (!res.ok) return [];

    const xml = await res.text();
    return parseRecords(xml, this.domain);
  }

  private async setHosts(records: NamecheapRecord[]) {
    const params = buildBaseParams(this.apiUser, this.apiKey);
    params.set("Command", "namecheap.domains.dns.setHosts");
    params.set("SLD", this.sld);
    params.set("TLD", this.tld);

    records.forEach((r, i) => {
      const n = i + 1;
      params.set(`HostName${n}`, r.name);
      params.set(`RecordType${n}`, r.type);
      params.set(`Address${n}`, r.address);
      params.set(`TTL${n}`, r.ttl);
    });

    const res = await fetch(`${API}?${params.toString()}`);
    if (!res.ok) {
      throw new Error("Failed to update DNS records on Namecheap");
    }

    const xml = await res.text();
    if (xml.includes('Status="ERROR"')) {
      const errMatch = xml.match(/<Err\d+[^>]*>([^<]+)<\/Err\d+>/);
      throw new Error(errMatch?.[1] ?? "Namecheap API error");
    }
  }

  async listRecords(): Promise<DnsRecord[]> {
    const hosts = await this.getHosts();
    const records: DnsRecord[] = [];

    for (const r of hosts) {
      if (!["A", "AAAA", "CNAME"].includes(r.type)) continue;
      records.push({
        id: r.hostId,
        name: r.name === "@" ? this.domain : `${r.name}.${this.domain}`,
        type: r.type,
        content: r.address,
      });
    }

    return records;
  }

  async createRecord(params: CreateRecordParams): Promise<{ id: string }> {
    const hosts = await this.getHosts();

    hosts.push({
      hostId: "0",
      name: params.subdomain,
      type: params.type,
      address: params.content,
      ttl: "1800",
      domain: this.domain,
    });

    await this.setHosts(hosts);

    // Namecheap assigns new IDs after setHosts — re-fetch to get actual ID
    const updated = await this.getHosts();
    const match = updated.find(
      (r) => r.name === params.subdomain && r.type === params.type
    );

    return { id: match?.hostId ?? "0" };
  }

  async updateRecord(recordId: string, params: UpdateRecordParams) {
    const hosts = await this.getHosts();
    const idx = hosts.findIndex((r) => r.hostId === recordId);

    if (idx === -1) throw new Error("Record not found");

    hosts[idx].address = params.content;
    if (params.type) hosts[idx].type = params.type;

    await this.setHosts(hosts);
  }

  async deleteRecord(recordId: string) {
    const hosts = await this.getHosts();
    const filtered = hosts.filter((r) => r.hostId !== recordId);

    if (filtered.length === hosts.length) return; // not found, nothing to do

    await this.setHosts(filtered);
  }
}

export const namecheapAdapter: PlatformAdapter = {
  async verify(creds, domain) {
    const { sld, tld } = splitDomain(domain);
    const params = buildBaseParams(creds.api_user, creds.api_key);
    params.set("Command", "namecheap.domains.dns.getHosts");
    params.set("SLD", sld);
    params.set("TLD", tld);

    const res = await fetch(`${API}?${params.toString()}`);

    if (!res.ok)
      return { valid: false, error: `Verification failed (${res.status})` };

    const xml = await res.text();

    if (xml.includes('Status="OK"')) return { valid: true };
    if (xml.includes("Invalid request IP"))
      return {
        valid: false,
        error: "Your server IP is not whitelisted in Namecheap API access",
      };
    if (xml.includes("API Key is invalid"))
      return { valid: false, error: "Invalid API key" };

    const errMatch = xml.match(/<Err\d+[^>]*>([^<]+)<\/Err\d+>/);
    return {
      valid: false,
      error: errMatch?.[1] ?? "Verification failed",
    };
  },

  createProvider(creds, domain) {
    return new NamecheapProvider(creds.api_user, creds.api_key, domain);
  },
};
