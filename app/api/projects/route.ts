import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyCredentials } from "@/lib/cloudflare";
import { PLATFORMS, type Platform } from "@/lib/platforms";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const platform = body.platform as Platform;
  const domain = body.domain?.trim().toLowerCase();
  const credentials = body.credentials ?? {};

  if (!platform || !domain) {
    return NextResponse.json(
      { error: "Platform and domain are required" },
      { status: 400 }
    );
  }

  if (!PLATFORMS[platform]) {
    return NextResponse.json(
      { error: "Unsupported platform" },
      { status: 400 }
    );
  }

  // Platform-specific validation
  if (platform === "cloudflare") {
    const apiToken = credentials.api_token?.trim();
    const zoneId = credentials.zone_id?.trim();

    if (!apiToken || !zoneId) {
      return NextResponse.json(
        { error: "API Token and Zone ID are required" },
        { status: 400 }
      );
    }

    try {
      const result = await verifyCredentials(apiToken, zoneId);
      if (!result.valid) {
        return NextResponse.json(
          { error: result.error ?? "Invalid credentials" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Could not reach Cloudflare API" },
        { status: 502 }
      );
    }
  }

  const { data: project, error: dbError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      platform,
      domain,
      credentials,
    })
    .select("id")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: project.id });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
