import { SubdomainRow } from "@/components/subdomain-row";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { decrypt } from "@/lib/crypto";
import type { DnsRecord } from "@/lib/dns";
import { getProvider } from "@/lib/dns";

export async function DnsRecords({
  project,
}: {
  project: {
    id: string;
    platform: string;
    credentials: string;
    domain: string;
  };
}) {
  const credentials = decrypt(project.credentials);
  const provider = getProvider(project.platform, credentials, project.domain);

  let records: DnsRecord[] = [];
  try {
    const allRecords = await provider.listRecords();
    records = allRecords.filter(
      (r) =>
        (r.name === project.domain || r.name.endsWith(`.${project.domain}`)) &&
        ["A", "AAAA", "CNAME"].includes(r.type)
    );
  } catch {
    // Failed to fetch — show empty state
  }

  const showProxy = project.platform === "cloudflare";

  if (records.length === 0) {
    return (
      <div className="px-8 py-24 text-center">
        <p className="font-serif text-lg text-zinc-500 italic">
          No DNS records found in this realm. Add one to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="pl-8 text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Name
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Type
            </TableHead>
            <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Content
            </TableHead>
            {showProxy && (
              <TableHead className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                Proxy
              </TableHead>
            )}
            <TableHead className="pr-8 text-right text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <SubdomainRow
              key={record.id}
              record={record}
              projectId={project.id}
              platform={project.platform}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function DnsRecordsSkeleton() {
  return (
    <div className="space-y-4 px-8 py-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-6">
          <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
