import { NextResponse } from 'next/server';
import { checkPropagation } from '@/lib/dns/propagation';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = new Set(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']);
const HOSTNAME_RE =
  /^([a-z0-9_]([a-z0-9_-]*[a-z0-9_])?\.)*[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimit(`propagation:${user.id}`, 20, 60_000);
  if (limited) return limited;

  const body = await request.json();
  const { name, type, expected } = body;

  if (!name || !type || !expected) {
    return NextResponse.json(
      { error: 'name, type, and expected are required' },
      { status: 400 },
    );
  }

  if (
    typeof name !== 'string' ||
    name.length > 253 ||
    !HOSTNAME_RE.test(name)
  ) {
    return NextResponse.json({ error: 'Invalid hostname' }, { status: 400 });
  }

  if (typeof type !== 'string' || !ALLOWED_TYPES.has(type)) {
    return NextResponse.json({ error: 'Invalid record type' }, { status: 400 });
  }

  if (typeof expected !== 'string' || expected.length > 1024) {
    return NextResponse.json(
      { error: 'Invalid expected value' },
      { status: 400 },
    );
  }

  const results = await checkPropagation(name, type, expected);
  return NextResponse.json({ results });
}
