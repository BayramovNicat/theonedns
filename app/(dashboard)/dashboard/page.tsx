import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AddProjectForm } from '@/components/add-project-form';
import { DashboardShell } from '@/components/dashboard-shell';
import { ProjectList, ProjectListSkeleton } from '@/components/project-list';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: rawUser },
  } = await supabase.auth.getUser();

  if (!rawUser) {
    redirect('/login');
  }

  const user = rawUser;

  return (
    <DashboardShell user={user}>
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

      <Suspense fallback={<ProjectListSkeleton />}>
        <ProjectList userId={user.id} />
      </Suspense>
    </DashboardShell>
  );
}
