import { AddSubdomainForm } from "@/components/add-subdomain-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { DnsRecords, DnsRecordsSkeleton } from "@/components/dns-records";
import { ProjectBreadcrumb } from "@/components/project-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { isSupported } from "@/lib/dns";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session!.user;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) notFound();

  const supported = isSupported(project.platform);

  return (
    <DashboardShell user={user}>
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
                Records forged in this realm
              </p>
            </div>
            <AddSubdomainForm
              domain={project.domain}
              projectId={project.id}
              platform={project.platform}
            />
          </div>

          <Suspense fallback={<DnsRecordsSkeleton />}>
            <DnsRecords project={project} />
          </Suspense>
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
