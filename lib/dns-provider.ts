import type { DnsProvider } from "./dns";
import {
  listDnsRecords as cfList,
  createDnsRecord as cfCreate,
  updateDnsRecord as cfUpdate,
  deleteDnsRecord as cfDelete,
  type CloudflareCredentials,
} from "./cloudflare";
import { createVercelProvider } from "./vercel";

type Project = {
  platform: string;
  domain: string;
  credentials: Record<string, string>;
};

export function getDnsProvider(project: Project): DnsProvider {
  if (project.platform === "cloudflare") {
    const creds: CloudflareCredentials = {
      api_token: project.credentials.api_token,
      zone_id: project.credentials.zone_id,
      domain: project.domain,
    };

    return {
      async listRecords() {
        const records = await cfList(creds);
        return records.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          content: r.content,
          proxied: r.proxied,
        }));
      },
      async createRecord(params) {
        return cfCreate(creds, {
          subdomain: params.subdomain,
          type: params.type as "A" | "CNAME",
          content: params.content,
          proxied: params.proxied ?? false,
        });
      },
      async updateRecord(recordId, params) {
        await cfUpdate(creds, recordId, {
          type: params.type,
          content: params.content,
          proxied: params.proxied ?? false,
        });
      },
      async deleteRecord(recordId) {
        await cfDelete(creds, recordId);
      },
    };
  }

  if (project.platform === "vercel") {
    return createVercelProvider({
      api_token: project.credentials.api_token,
      team_id: project.credentials.team_id || undefined,
      domain: project.domain,
    });
  }

  throw new Error(`Unsupported platform: ${project.platform}`);
}
