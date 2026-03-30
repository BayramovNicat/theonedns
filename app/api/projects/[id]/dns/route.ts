import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';
import { getProvider, isSupported } from '@/lib/dns';
import type { DnsProvider } from '@/lib/dns/types';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) return null;

  return {
    ...project,
    credentials: decrypt(project.credentials),
  };
}

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function verifyRecordOwnership(provider: DnsProvider, recordId: string) {
  const records = await provider.listRecords();
  return records.some((r) => r.id === recordId);
}

function providerFor(project: {
  platform: string;
  credentials: Record<string, string>;
  domain: string;
}) {
  if (!isSupported(project.platform)) {
    return null;
  }
  return getProvider(project.platform, project.credentials, project.domain);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const limited = rateLimit(`dns:mutate:${userId}`, 30, 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const provider = providerFor(project);
  if (!provider) {
    return NextResponse.json(
      { error: 'DNS management not supported for this platform' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const subdomain = body.subdomain?.trim().toLowerCase();
  const recordType = body.recordType as string;
  const content = body.content?.trim();
  const proxied = body.proxied ?? false;
  const ttl = body.ttl ? Number(body.ttl) : undefined;
  const priority = body.priority != null ? Number(body.priority) : undefined;

  if (!subdomain || !content) {
    return NextResponse.json(
      { error: 'Subdomain and content are required' },
      { status: 400 },
    );
  }

  if (
    subdomain !== '@' &&
    !/^[a-z0-9_]([a-z0-9_.-]*[a-z0-9_])?$/.test(subdomain)
  ) {
    return NextResponse.json(
      {
        error:
          'Invalid subdomain. Use lowercase letters, numbers, hyphens, and underscores only.',
      },
      { status: 400 },
    );
  }

  if (recordType === 'A' && !/^\d{1,3}(\.\d{1,3}){3}$/.test(content)) {
    return NextResponse.json(
      { error: 'Invalid IP address for A record' },
      { status: 400 },
    );
  }

  try {
    await provider.createRecord({
      subdomain,
      type: recordType,
      content,
      ttl,
      priority,
      proxied,
    });
  } catch (e) {
    console.error('DNS create failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const limited = rateLimit(`dns:mutate:${userId}`, 30, 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const provider = providerFor(project);
  if (!provider) {
    return NextResponse.json(
      { error: 'DNS management not supported for this platform' },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { recordId, type, content, proxied, ttl, priority } = body;

  if (!recordId || !content?.trim()) {
    return NextResponse.json(
      { error: 'Record ID and content are required' },
      { status: 400 },
    );
  }

  if (!(await verifyRecordOwnership(provider, recordId))) {
    return NextResponse.json(
      { error: 'Record not found in this project' },
      { status: 403 },
    );
  }

  try {
    await provider.updateRecord(recordId, {
      type,
      content: content.trim(),
      ttl: ttl ? Number(ttl) : undefined,
      priority: priority != null ? Number(priority) : undefined,
      proxied: proxied ?? false,
    });
  } catch (e) {
    console.error('DNS update failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const limited = rateLimit(`dns:mutate:${userId}`, 30, 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
  }
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const provider = providerFor(project);
  if (!provider) {
    return NextResponse.json(
      { error: 'DNS management not supported for this platform' },
      { status: 400 },
    );
  }

  const { recordId } = await request.json();
  if (!recordId) {
    return NextResponse.json({ error: 'Missing record id' }, { status: 400 });
  }

  if (!(await verifyRecordOwnership(provider, recordId))) {
    return NextResponse.json(
      { error: 'Record not found in this project' },
      { status: 403 },
    );
  }

  try {
    await provider.deleteRecord(recordId);
  } catch (e) {
    console.error('DNS delete failed:', e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
