"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PLATFORMS, type Platform } from "@/lib/platforms";

type Project = {
  id: string;
  platform: Platform;
  domain: string;
  created_at: string;
};

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const platformName = PLATFORMS[project.platform]?.name ?? project.platform;

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${project.domain}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-foreground/20 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{project.domain}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{platformName}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
              >
                &times;
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
