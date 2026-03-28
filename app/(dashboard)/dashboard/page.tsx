import { AddProjectForm } from "@/components/add-project-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectCard } from "@/components/project-card";
import { createClient } from "@/lib/supabase/server";

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
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white md:text-5xl">
            Projects
          </h2>
          <p className="mt-2 font-serif text-lg text-zinc-500 italic">
            Manage your connected domains and DNS records from a single throne.
          </p>
        </div>
        <AddProjectForm />
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50 py-32 backdrop-blur-xl">
          <div className="text-center px-4">
            <h3 className="text-2xl font-bold text-white">No domains forged yet</h3>
            <p className="mt-2 font-serif text-zinc-500 italic">
              Connect your first domain to start managing DNS records across the realm.
            </p>
            <div className="mt-10">
              <AddProjectForm />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
