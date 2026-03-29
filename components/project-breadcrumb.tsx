import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function ProjectBreadcrumb({ domain }: { domain: string }) {
  return (
    <div>
      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{domain}</span>
      </div>
    </div>
  );
}
