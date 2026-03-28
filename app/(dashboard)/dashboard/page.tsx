import { createClient } from "@/lib/supabase/server";
import { AddProjectForm } from "@/components/add-project-form";
import { ProjectCard } from "@/components/project-card";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardShell user={user!}>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your connected domains and DNS records.
          </p>
        </div>
        <AddProjectForm />
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="border-border/60 flex flex-col items-center justify-center rounded-xl border border-dashed py-24">
          <div className="text-center">
            <p className="text-lg font-medium">No projects yet</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Connect your first domain to start managing DNS records.
            </p>
            <div className="mt-6">
              <AddProjectForm />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
