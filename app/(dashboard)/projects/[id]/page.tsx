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
import { listDnsRecords } from "@/lib/cloudflare";

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

  let subdomains: Awaited<ReturnType<typeof listDnsRecords>> = [];

  if (project.platform === "cloudflare") {
    const creds = {
      api_token: project.credentials.api_token,
      zone_id: project.credentials.zone_id,
      domain: project.domain,
    };
    const records = await listDnsRecords(creds);
    subdomains = records.filter(
      (r) =>
        (r.name === project.domain || r.name.endsWith(`.${project.domain}`)) &&
        (r.type === "A" || r.type === "AAAA" || r.type === "CNAME")
    );
  }

  return (
    <DashboardShell user={user!}>
      <ProjectBreadcrumb domain={project.domain} platform={project.platform} />

      {project.platform === "cloudflare" ? (
        <div className="border-border/60 bg-card mt-6 rounded-xl border">
          <div className="border-border/40 flex items-center justify-between border-b px-6 py-4">
            <div>
              <h2 className="font-semibold">DNS Records</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {subdomains.length} record{subdomains.length !== 1 && "s"} found
              </p>
            </div>
            <AddSubdomainForm domain={project.domain} projectId={project.id} />
          </div>

          {subdomains.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Proxy</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subdomains.map((record) => (
                  <SubdomainRow
                    key={record.id}
                    record={record}
                    projectId={project.id}
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
