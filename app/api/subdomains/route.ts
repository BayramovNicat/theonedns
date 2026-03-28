import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDnsRecord,
  deleteDnsRecord,
  type CloudflareCredentials,
} from "@/lib/cloudflare";

async function getUserConfig() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: config } = await supabase
    .from("cloudflare_configs")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!config) return null;
  return { config: config as CloudflareCredentials };
}

export async function POST(request: Request) {
  const ctx = await getUserConfig();
  if (!ctx) {
    return NextResponse.json(
      { error: "Connect Cloudflare first" },
      { status: 400 }
    );
  }

  const { config } = ctx;
  const body = await request.json();

  const subdomain = body.subdomain?.trim().toLowerCase();
  const recordType = body.recordType as "A" | "CNAME";
  const content = body.content?.trim();
  const proxied = body.proxied ?? true;

  if (!subdomain || !content) {
    return NextResponse.json(
      { error: "Subdomain and content are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return NextResponse.json(
      {
        error:
          "Invalid subdomain. Use lowercase letters, numbers, and hyphens only.",
      },
      { status: 400 }
    );
  }

  if (recordType === "A" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(content)) {
    return NextResponse.json(
      { error: "Invalid IP address for A record" },
      { status: 400 }
    );
  }

  try {
    await createDnsRecord(config, {
      subdomain,
      type: recordType,
      content,
      proxied,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const ctx = await getUserConfig();
  if (!ctx) {
    return NextResponse.json(
      { error: "Connect Cloudflare first" },
      { status: 400 }
    );
  }

  const { config } = ctx;
  const { cloudflareRecordId } = await request.json();

  if (!cloudflareRecordId) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  try {
    await deleteDnsRecord(config, cloudflareRecordId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
