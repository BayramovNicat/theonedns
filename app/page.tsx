import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { AddProjectForm } from "@/components/add-project-form";
import { ProjectCard } from "@/components/project-card";

export default async function ProjectsPage() {
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
    <div className="bg-background min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold">Domnix</h1>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Projects</h2>
          <AddProjectForm />
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground py-24 text-center">
            <p>No projects yet.</p>
            <p className="text-sm">
              Add a project to start managing your subdomains.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
