import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddSubdomainForm } from "@/components/add-subdomain-form";
import { SubdomainRow } from "@/components/subdomain-row";
import { SignOutButton } from "@/components/sign-out-button";
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
        r.name !== project.domain &&
        r.name.endsWith(`.${project.domain}`) &&
        (r.type === "A" || r.type === "AAAA" || r.type === "CNAME")
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              &larr; Projects
            </Link>
            <span className="text-muted-foreground">/</span>
            <div>
              <h1 className="text-lg font-semibold">{project.domain}</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground text-sm">
                  {project.domain}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {project.platform}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {project.platform === "cloudflare" ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subdomains</CardTitle>
              <AddSubdomainForm
                domain={project.domain}
                projectId={project.id}
              />
            </CardHeader>
            <CardContent>
              {subdomains.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subdomain</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Proxy</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                <div className="text-muted-foreground py-12 text-center">
                  No subdomains yet. Add one to get started.
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                DNS management for {project.platform} is coming soon.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
