import { NextResponse } from "next/server";
import { checkPropagation } from "@/lib/dns/propagation";
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
  const { name, type, expected } = body;

  if (!name || !type || !expected) {
    return NextResponse.json(
      { error: "name, type, and expected are required" },
      { status: 400 }
    );
  }

  const results = await checkPropagation(name, type, expected);
  return NextResponse.json({ results });
}
