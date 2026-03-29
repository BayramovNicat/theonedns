import { DnsRecordsClient } from '@/components/dns-records-client';
import { decrypt } from '@/lib/crypto';
import type { DnsRecord } from '@/lib/dns';
import { getProvider } from '@/lib/dns';

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
      (r) => r.name === project.domain || r.name.endsWith(`.${project.domain}`),
    );
  } catch {
    // Failed to fetch — show empty state
  }

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
    <DnsRecordsClient
      records={records}
      projectId={project.id}
      platform={project.platform}
      domain={project.domain}
    />
  );
}

export function DnsRecordsSkeleton() {
  return (
    <div className="space-y-4 px-8 py-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`skeleton-${i}`} className="flex items-center gap-6">
          <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-16 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-white/5" />
        </div>
      ))}
    </div>
  );
}
