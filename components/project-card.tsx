"use client";

import { ExternalLink, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [confirmOpen, setConfirmOpen] = useState(false);

  const platformName = PLATFORMS[project.platform]?.name ?? project.platform;

  async function handleDelete() {
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
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-zinc-800/50">
        <Link href={`/projects/${project.id}`} className="block p-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-2 w-2 rounded-full bg-amber-500/50 transition-colors group-hover:bg-amber-500" />
              <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                {platformName}
              </Badge>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white transition-colors group-hover:text-amber-400">
                {project.domain}
              </h3>
              <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold tracking-widest text-zinc-600 uppercase transition-colors group-hover:text-white">
              View Realm
              <div className="h-px flex-1 bg-white/10" />
            </div>
          </div>
        </Link>

        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/5 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-white active:scale-90">
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => router.push(`/projects/${project.id}`)}
                className="cursor-pointer font-bold text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <ExternalLink className="mr-2 size-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                className="cursor-pointer font-bold transition-colors"
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-white">
              Delete project
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-zinc-500 italic">
              Are you sure you want to banish{" "}
              <span className="font-bold text-amber-500 not-italic">
                {project.domain}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500/80 font-bold hover:bg-red-500"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
