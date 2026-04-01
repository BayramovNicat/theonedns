import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { IntegrationsClient } from '@/components/integrations-client';
import { createClient } from '@/lib/supabase/server';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user: rawUser },
  } = await supabase.auth.getUser();

  if (!rawUser) {
    redirect('/login');
  }

  const user = rawUser;

  // Fetch projects to see which platforms are connected and how many times
  const { data: projects } = await supabase
    .from('projects')
    .select('platform')
    .eq('user_id', user.id);

  const platformCounts = (projects ?? []).reduce(
    (acc, curr) => {
      acc[curr.platform] = (acc[curr.platform] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const connectedPlatforms = Object.entries(platformCounts).map(
    ([platform, count]) => ({
      platform,
      count,
    }),
  );

  return (
    <DashboardShell user={user}>
      <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-white md:text-5xl uppercase">
            Integrations
          </h2>
          <p className="mt-2 font-serif text-lg text-zinc-500 italic">
            Manage your connections across the digital pantheon.
          </p>
        </div>
      </div>

      <IntegrationsClient connectedPlatforms={connectedPlatforms} />
    </DashboardShell>
  );
}
