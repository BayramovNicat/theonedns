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
  return {
    userId: user.id,
    config: config as CloudflareCredentials & { id: string },
  };
}

export async function POST(request: Request) {
  const ctx = await getUserConfig();
  if (!ctx) {
    return NextResponse.json(
      { error: "Connect Cloudflare first" },
      { status: 400 }
    );
  }

  const { userId, config } = ctx;
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

  const supabase = await createClient();

  try {
    const cfRecord = await createDnsRecord(config, {
      subdomain,
      type: recordType,
      content,
      proxied,
    });

    const { error: dbError } = await supabase.from("subdomains").insert({
      user_id: userId,
      config_id: config.id,
      subdomain,
      record_type: recordType,
      content,
      cloudflare_record_id: cfRecord.id,
      proxied,
    });

    if (dbError) {
      await deleteDnsRecord(config, cfRecord.id).catch(() => {});
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
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

  const { userId, config } = ctx;
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: record } = await supabase
    .from("subdomains")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!record) {
    return NextResponse.json(
      { error: "Record not found or not yours" },
      { status: 404 }
    );
  }

  try {
    if (record.cloudflare_record_id) {
      await deleteDnsRecord(config, record.cloudflare_record_id);
    }

    const { error: dbError } = await supabase
      .from("subdomains")
      .delete()
      .eq("id", id);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
