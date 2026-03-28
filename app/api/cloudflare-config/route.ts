import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyToken } from "@/lib/cloudflare";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const apiToken = body.apiToken?.trim();
  const zoneId = body.zoneId?.trim();
  const domain = body.domain?.trim().toLowerCase();

  if (!apiToken || !zoneId || !domain) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }

  try {
    const result = await verifyToken(apiToken);
    if (!result.valid) {
      return NextResponse.json(
        { error: result.error ?? "Invalid Cloudflare API token" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Could not reach Cloudflare API to verify token" },
      { status: 502 }
    );
  }

  const { error: dbError } = await supabase.from("cloudflare_configs").upsert(
    {
      user_id: user.id,
      api_token: apiToken,
      zone_id: zoneId,
      domain,
    },
    { onConflict: "user_id" }
  );

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await supabase.from("cloudflare_configs").delete().eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
