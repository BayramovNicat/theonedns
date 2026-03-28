import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProvider, isSupported } from "@/lib/dns";

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
    await provider.createRecord({
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
  const { recordId, type, content, proxied } = body;

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
