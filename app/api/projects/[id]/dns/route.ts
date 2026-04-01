import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/crypto';
import { getProvider, isSupported } from '@/lib/dns';
import { invalidateCache } from '@/lib/dns/cache';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_RECORD_TYPES = new Set([
  'A',
  'AAAA',
  'CNAME',
  'MX',
  'TXT',
  'NS',
  'SRV',
  'CAA',
]);

const MAX_CONTENT_LENGTH = 4096;

function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(
    (p) => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255,
  );
}

function isValidTtl(ttl: number): boolean {
  return Number.isInteger(ttl) && ttl >= 0 && ttl <= 2147483647;
}

function isValidPriority(priority: number): boolean {
  return Number.isInteger(priority) && priority >= 0 && priority <= 65535;
}

function isValidRecordId(recordId: unknown): recordId is string {
  if (
    typeof recordId !== 'string' ||
    recordId.length === 0 ||
    recordId.length > 256
  )
    return false;
  // Only allow alphanumeric, hyphens, underscores, dots, and colons (for composite IDs like type:name)
  return /^[a-zA-Z0-9._:-]+$/.test(recordId);
}

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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const subdomain = (body.subdomain as string)?.trim().toLowerCase();
  const recordType = body.recordType as string;
  const content = (body.content as string)?.trim();
  const proxied = (body.proxied as boolean) ?? false;
  const ttl = body.ttl ? Number(body.ttl) : undefined;
  const priority = body.priority != null ? Number(body.priority) : undefined;

  if (!subdomain || !content) {
    return NextResponse.json(
      { error: 'Subdomain and content are required' },
      { status: 400 },
    );
  }

  if (!recordType || !ALLOWED_RECORD_TYPES.has(recordType)) {
    return NextResponse.json({ error: 'Invalid record type' }, { status: 400 });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Content too long (max ${MAX_CONTENT_LENGTH} chars)` },
      { status: 400 },
    );
  }

  if (ttl !== undefined && !isValidTtl(ttl)) {
    return NextResponse.json({ error: 'Invalid TTL' }, { status: 400 });
  }

  if (priority !== undefined && !isValidPriority(priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
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

  if (recordType === 'A' && !isValidIPv4(content)) {
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
  } catch {
    console.error('DNS create failed');
    return NextResponse.json(
      { error: 'Failed to create record' },
      { status: 500 },
    );
  }

  invalidateCache(`${id}:${project.domain}`);
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { recordId, type, content, proxied, ttl, priority } = body as {
    recordId: string;
    type: string;
    content: string;
    proxied: boolean;
    ttl: number;
    priority: number;
  };

  if (!isValidRecordId(recordId) || !content?.trim()) {
    return NextResponse.json(
      { error: 'Valid record ID and content are required' },
      { status: 400 },
    );
  }

  if (type && !ALLOWED_RECORD_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid record type' }, { status: 400 });
  }

  if (content.trim().length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `Content too long (max ${MAX_CONTENT_LENGTH} chars)` },
      { status: 400 },
    );
  }

  const parsedTtl = ttl ? Number(ttl) : undefined;
  const parsedPriority = priority != null ? Number(priority) : undefined;

  if (parsedTtl !== undefined && !isValidTtl(parsedTtl)) {
    return NextResponse.json({ error: 'Invalid TTL' }, { status: 400 });
  }

  if (parsedPriority !== undefined && !isValidPriority(parsedPriority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  }

  try {
    await provider.updateRecord(recordId, {
      type,
      content: content.trim(),
      ttl: parsedTtl,
      priority: parsedPriority,
      proxied: proxied ?? false,
    });
  } catch {
    console.error('DNS update failed');
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 },
    );
  }

  invalidateCache(`${id}:${project.domain}`);
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { recordId } = body as { recordId: string };
  if (!isValidRecordId(recordId)) {
    return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
  }

  try {
    await provider.deleteRecord(recordId);
  } catch {
    console.error('DNS delete failed');
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 },
    );
  }

  invalidateCache(`${id}:${project.domain}`);
  return NextResponse.json({ success: true });
}
