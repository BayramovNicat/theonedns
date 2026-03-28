import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function ProjectBreadcrumb({
  domain,
  platform,
}: {
  domain: string;
  platform: string;
}) {
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
      <div className="mt-3 flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{domain}</h1>
        <Badge variant="secondary" className="text-xs capitalize">
          {platform}
        </Badge>
      </div>
    </div>
  );
}
