import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
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
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Parse query parameters for filtering
  const { searchParams } = new URL(request.url);
  const recordType = searchParams.get('recordType');
  const action = searchParams.get('action');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = Math.min(Number(searchParams.get('limit')) || 100, 500);

  // Build query
  let query = supabase
    .from('dns_changes')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (recordType) {
    query = query.eq('record_type', recordType);
  }

  if (action) {
    query = query.eq('action', action);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data: changes, error } = await query;

  if (error) {
    console.error('Failed to fetch DNS changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch change history' },
      { status: 500 },
    );
  }

  return NextResponse.json({ changes });
}
