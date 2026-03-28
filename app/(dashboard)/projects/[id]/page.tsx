import { notFound } from "next/navigation";
import { AddSubdomainForm } from "@/components/add-subdomain-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import { SubdomainRow } from "@/components/subdomain-row";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { decrypt } from "@/lib/crypto";
import type { DnsRecord } from "@/lib/dns";
import { getProvider, isSupported } from "@/lib/dns";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: raw } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  const project = raw
    ? {
        ...raw,
        credentials: decrypt(raw.credentials),
      }
    : null;

  if (!project) notFound();

  let records: DnsRecord[] = [];
  const supported = isSupported(project.platform);

  if (supported) {
    try {
      const provider = getProvider(
        project.platform,
        project.credentials,
        project.domain
      );
      const allRecords = await provider.listRecords();
      records = allRecords.filter(
        (r) =>
          (r.name === project.domain ||
            r.name.endsWith(`.${project.domain}`)) &&
          ["A", "AAAA", "CNAME"].includes(r.type)
      );
    } catch {
      // Failed to fetch — show empty state
    }
  }

  const showProxy = project.platform === "cloudflare";

  return (
    <DashboardShell user={user!}>
      <div className="mb-8">
        <ProjectBreadcrumb domain={project.domain} />
        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-4xl font-black tracking-tighter text-white md:text-5xl">
            {project.domain}
          </h1>
          <Badge className="border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold tracking-widest text-amber-500 uppercase">
            {project.platform}
          </Badge>
        </div>
      </div>

      {supported ? (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-white/5 bg-white/5 px-8 py-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-white">DNS Records</h2>
              <p className="font-serif text-sm text-zinc-500 italic">
                {records.length} record{records.length !== 1 && "s"} forged in
                this realm
              </p>
            </div>
            <AddSubdomainForm
              domain={project.domain}
              projectId={project.id}
              platform={project.platform}
            />
          </div>

          {records.length > 0 ? (
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
          ) : (
            <div className="px-8 py-24 text-center">
              <p className="font-serif text-lg text-zinc-500 italic">
                No DNS records found in this realm. Add one to begin.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50 py-32 backdrop-blur-xl">
          <Badge className="mb-4 border-amber-500/20 bg-amber-500/10 text-xs font-bold tracking-widest text-amber-500 uppercase">
            Coming soon
          </Badge>
          <p className="font-serif text-lg text-zinc-500 italic">
            DNS management for {project.platform} is not available yet in this
            interface.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
