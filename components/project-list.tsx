import { AddProjectForm } from '@/components/add-project-form';
import { ProjectCard } from '@/components/project-card';
import { createClient } from '@/lib/supabase/server';

export async function ProjectList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50 py-32 backdrop-blur-xl">
        <div className="px-4 text-center">
          <h3 className="text-2xl font-bold text-white">
            No domains forged yet
          </h3>
          <p className="mt-2 font-serif text-zinc-500 italic">
            Connect your first domain to start managing DNS records across the
            realm.
          </p>
          <div className="mt-10">
            <AddProjectForm />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

export function ProjectListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="rounded-3xl border border-white/10 bg-zinc-900/50 p-8 backdrop-blur-xl"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-2 w-2 animate-pulse rounded-full bg-white/10" />
              <div className="h-5 w-20 animate-pulse rounded bg-white/5" />
            </div>
            <div>
              <div className="h-6 w-40 animate-pulse rounded bg-white/5" />
              <div className="mt-2 h-3 w-28 animate-pulse rounded bg-white/5" />
            </div>
            <div className="mt-4 h-3 w-full animate-pulse rounded bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
