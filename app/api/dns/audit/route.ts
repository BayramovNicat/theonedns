import { NextResponse } from 'next/server';
import { auditDnsRecords } from '@/lib/dns/audit';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';

const HOSTNAME_RE =
  /^([a-z0-9_]([a-z0-9_-]*[a-z0-9_])?\.)*[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i;
const MAX_RECORDS = 500;

function isValidRecord(r: unknown): r is {
  id: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  priority?: number;
  proxied?: boolean;
} {
  if (typeof r !== 'object' || r === null) return false;
  const rec = r as Record<string, unknown>;
  return (
    typeof rec.id === 'string' &&
    rec.id.length <= 256 &&
    typeof rec.name === 'string' &&
    rec.name.length <= 253 &&
    typeof rec.type === 'string' &&
    rec.type.length <= 10 &&
    typeof rec.content === 'string' &&
    rec.content.length <= 4096
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limited = rateLimit(`audit:${user.id}`, 10, 60_000);
  if (limited) return limited;

  const body = await request.json();
  const { records, domain } = body;

  if (!records || !domain) {
    return NextResponse.json(
      { error: 'records and domain are required' },
      { status: 400 },
    );
  }

  if (
    typeof domain !== 'string' ||
    domain.length > 253 ||
    !HOSTNAME_RE.test(domain)
  ) {
    return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 });
  }

  if (!Array.isArray(records) || records.length > MAX_RECORDS) {
    return NextResponse.json(
      { error: `records must be an array of at most ${MAX_RECORDS} items` },
      { status: 400 },
    );
  }

  if (!records.every(isValidRecord)) {
    return NextResponse.json(
      { error: 'Each record must have id, name, type, and content strings' },
      { status: 400 },
    );
  }

  const issues = await auditDnsRecords(records, domain);
  return NextResponse.json({ issues });
}
