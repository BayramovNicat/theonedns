import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddSubdomainForm } from "@/components/add-subdomain-form";
import { SubdomainRow } from "@/components/subdomain-row";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import { getDnsProvider } from "@/lib/dns-provider";
import type { DnsRecord } from "@/lib/dns";

const SUPPORTED_PLATFORMS = ["cloudflare", "vercel"];

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

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!project) notFound();

  let records: DnsRecord[] = [];
  const isSupported = SUPPORTED_PLATFORMS.includes(project.platform);

  if (isSupported) {
    try {
      const provider = getDnsProvider(project);
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
      <ProjectBreadcrumb domain={project.domain} platform={project.platform} />

      {isSupported ? (
        <div className="border-border/60 bg-card mt-6 rounded-xl border">
          <div className="border-border/40 flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="font-semibold">DNS Records</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {records.length} record{records.length !== 1 && "s"} found
              </p>
            </div>
            <AddSubdomainForm
              domain={project.domain}
              projectId={project.id}
              platform={project.platform}
            />
          </div>

          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  {showProxy && <TableHead>Proxy</TableHead>}
                  <TableHead className="pr-6 text-right">Actions</TableHead>
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
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-muted-foreground text-sm">
                No DNS records yet. Add one to get started.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="border-border/60 mt-6 rounded-xl border border-dashed px-6 py-16 text-center">
          <Badge variant="secondary" className="mb-3">
            Coming soon
          </Badge>
          <p className="text-muted-foreground text-sm">
            DNS management for {project.platform} is not available yet.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}
