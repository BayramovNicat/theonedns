import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto';
import { getAdapter, isSupported } from '@/lib/dns';
import { PLATFORMS, type Platform } from '@/lib/platforms';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = session.user;

  const limited = rateLimit(`projects:create:${user.id}`, 10, 60_000);
  if (limited) return limited;

  const body = await request.json();
  const platform = body.platform as Platform;
  const domain = body.domain?.trim().toLowerCase();
  const credentials = body.credentials ?? {};

  if (!platform || !domain) {
    return NextResponse.json(
      { error: 'Platform and domain are required' },
      { status: 400 },
    );
  }

  if (!PLATFORMS[platform]) {
    return NextResponse.json(
      { error: 'Unsupported platform' },
      { status: 400 },
    );
  }

  // Validate credentials via the platform adapter
  if (isSupported(platform)) {
    const adapter = getAdapter(platform);

    // Check required fields per platform
    const requiredFields = PLATFORMS[platform].fields
      .filter((f) => !f.label.includes('optional'))
      .map((f) => f.key);

    for (const key of requiredFields) {
      if (!credentials[key]?.trim()) {
        const field = PLATFORMS[platform].fields.find((f) => f.key === key);
        return NextResponse.json(
          { error: `${field?.label ?? key} is required` },
          { status: 400 },
        );
      }
    }

    try {
      const result = await adapter.verify(credentials, domain);
      if (!result.valid) {
        return NextResponse.json(
          { error: result.error ?? 'Invalid credentials' },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: `Could not reach ${PLATFORMS[platform].name} API` },
        { status: 502 },
      );
    }
  }

  const { data: project, error: dbError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      platform,
      domain,
      credentials: encrypt(credentials),
    })
    .select('id')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: project.id });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = session.user;

  const limited = rateLimit(`projects:delete:${user.id}`, 10, 60_000);
  if (limited) return limited;

  const { id } = await request.json();

  if (
    !id ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return NextResponse.json(
      { error: 'Missing or invalid project id' },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
