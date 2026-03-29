import { NextResponse } from "next/server";
import { auditDnsRecords } from "@/lib/dns/audit";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { records, domain } = body;

  if (!records || !domain) {
    return NextResponse.json(
      { error: "records and domain are required" },
      { status: 400 }
    );
  }

  const issues = await auditDnsRecords(records, domain);
  return NextResponse.json({ issues });
}
