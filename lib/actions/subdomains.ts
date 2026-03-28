"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createDnsRecord,
  deleteDnsRecord,
  type CloudflareCredentials,
} from "@/lib/cloudflare";

type ActionResult = { error?: string };

async function getUserConfig(): Promise<{
  userId: string;
  config: CloudflareCredentials & { id: string };
} | null> {
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
  return { userId: user.id, config };
}

export async function addSubdomain(formData: FormData): Promise<ActionResult> {
  const ctx = await getUserConfig();
  if (!ctx) return { error: "Connect Cloudflare first" };

  const { userId, config } = ctx;

  const subdomain = (formData.get("subdomain") as string)?.trim().toLowerCase();
  const recordType = formData.get("recordType") as "A" | "CNAME";
  const content = (formData.get("content") as string)?.trim();
  const proxied = formData.get("proxied") === "on";

  if (!subdomain || !content) {
    return { error: "Subdomain and content are required" };
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    return {
      error:
        "Invalid subdomain. Use lowercase letters, numbers, and hyphens only.",
    };
  }

  if (recordType === "A" && !/^\d{1,3}(\.\d{1,3}){3}$/.test(content)) {
    return { error: "Invalid IP address for A record" };
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
      return { error: dbError.message };
    }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to create record",
    };
  }

  revalidatePath("/");
  return {};
}

export async function removeSubdomain(id: string): Promise<ActionResult> {
  const ctx = await getUserConfig();
  if (!ctx) return { error: "Connect Cloudflare first" };

  const { userId, config } = ctx;
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("subdomains")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!record) return { error: "Record not found or not yours" };

  try {
    if (record.cloudflare_record_id) {
      await deleteDnsRecord(config, record.cloudflare_record_id);
    }

    const { error: dbError } = await supabase
      .from("subdomains")
      .delete()
      .eq("id", id);

    if (dbError) return { error: dbError.message };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to delete record",
    };
  }

  revalidatePath("/");
  return {};
}
