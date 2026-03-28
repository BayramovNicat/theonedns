import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createDnsRecord,
  deleteDnsRecord,
  type CloudflareCredentials,
} from "@/lib/cloudflare";

async function getProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  return project;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.platform !== "cloudflare") {
    return NextResponse.json(
      { error: "DNS management not yet supported for this platform" },
      { status: 400 }
    );
  }

  const creds: CloudflareCredentials = {
    api_token: project.credentials.api_token,
    zone_id: project.credentials.zone_id,
    domain: project.domain,
  };

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
    await createDnsRecord(creds, {
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.platform !== "cloudflare") {
    return NextResponse.json(
      { error: "DNS management not yet supported for this platform" },
      { status: 400 }
    );
  }

  const creds: CloudflareCredentials = {
    api_token: project.credentials.api_token,
    zone_id: project.credentials.zone_id,
    domain: project.domain,
  };

  const { cloudflareRecordId } = await request.json();

  if (!cloudflareRecordId) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  try {
    await deleteDnsRecord(creds, cloudflareRecordId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
