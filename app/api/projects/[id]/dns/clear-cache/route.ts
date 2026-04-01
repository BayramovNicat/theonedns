import { NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/dns/cache';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('domain')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  invalidateCache(`${id}:${project.domain}`);

  return NextResponse.json({ success: true });
}
