'use client';

import { ExternalLink, MoreVertical, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/copy-button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PLATFORMS, type Platform } from '@/lib/platforms';

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
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Something went wrong');
        return;
      }

      toast.success('Project deleted');
      router.refresh();
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/30 hover:bg-zinc-800/50">
        <Link href={`/projects/${project.id}`} className="block px-6 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-bold text-white transition-colors group-hover:text-amber-400">
                  {project.domain}
                </h3>
                <CopyButton value={project.domain} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] font-bold tracking-widest text-amber-500 uppercase">
                  {platformName}
                </Badge>
                <span className="text-[10px] tracking-wide text-zinc-500">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.preventDefault()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-zinc-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-white active:scale-90"
              >
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
        </Link>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-zinc-900 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-white">
              Delete project
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-zinc-500 italic">
              Are you sure you want to banish{' '}
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
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
