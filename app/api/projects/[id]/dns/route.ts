import { NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";
import { getProvider, isSupported } from "@/lib/dns";
import { createClient } from "@/lib/supabase/server";

async function getProject(projectId: string) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const user = session.user;

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) return null;

  return {
    ...project,
    credentials: decrypt(project.credentials),
  };
}

function providerFor(project: {
  platform: string;
  credentials: Record<string, string>;
  domain: string;
}) {
  if (!isSupported(project.platform)) {
    return null;
  }
  return getProvider(project.platform, project.credentials, project.domain);
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

  const provider = providerFor(project);
  if (!provider) {
    return NextResponse.json(
      { error: "DNS management not supported for this platform" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const subdomain = body.subdomain?.trim().toLowerCase();
  const recordType = body.recordType as string;
  const content = body.content?.trim();
  const proxied = body.proxied ?? false;
  const ttl = body.ttl ? Number(body.ttl) : undefined;
  const priority = body.priority != null ? Number(body.priority) : undefined;

  if (!subdomain || !content) {
    return NextResponse.json(
      { error: "Subdomain and content are required" },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?$/.test(subdomain)) {
    return NextResponse.json(
      {
        error:
          "Invalid subdomain. Use lowercase letters, numbers, hyphens, and underscores only.",
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
    await provider.createRecord({
      subdomain,
      type: recordType,
      content,
      ttl,
      priority,
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const provider = providerFor(project);
  if (!provider) {
    return NextResponse.json(
      { error: "DNS management not supported for this platform" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { recordId, type, content, proxied, ttl, priority } = body;

  if (!recordId || !content?.trim()) {
    return NextResponse.json(
      { error: "Record ID and content are required" },
      { status: 400 }
    );
  }

  try {
    await provider.updateRecord(recordId, {
      type,
      content: content.trim(),
      ttl: ttl ? Number(ttl) : undefined,
      priority: priority != null ? Number(priority) : undefined,
      proxied: proxied ?? false,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update record" },
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

  const provider = providerFor(project);
  if (!provider) {
    return NextResponse.json(
      { error: "DNS management not supported for this platform" },
      { status: 400 }
    );
  }

  const { recordId } = await request.json();
  if (!recordId) {
    return NextResponse.json({ error: "Missing record id" }, { status: 400 });
  }

  try {
    await provider.deleteRecord(recordId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
