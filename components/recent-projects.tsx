import Link from "next/link";
import { Calendar, MoreHorizontal } from "lucide-react";

import {
  Card,
  CardHeader,
  CardInset,
  CardInsetHeader,
  CardMetaRow,
  CardTitle,
} from "@/components/ui/card";

type RecentProject = {
  id: string;
  name: string;
  description: string | null;
  dueDate?: string | null;
  updatedAt?: string;
  archived?: boolean;
};

function formatProjectDate(value?: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function RecentProjects({
  projects,
  isLoading = false,
}: {
  projects: RecentProject[];
  isLoading?: boolean;
}) {
  return (
    <Card variant="panel" className="p-0">
      <CardHeader className="mb-0 flex-row items-center justify-between space-y-0 p-6">
        <CardTitle>Recent Projects</CardTitle>
        <Link href="/projects" className="text-primary hover:text-primary text-sm font-medium">
          View all
        </Link>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-4 px-6 pb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardInset key={index} className="p-4">
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-3 h-4 w-1/4 animate-pulse rounded bg-muted" />
            </CardInset>
          ))}
        </div>
      ) : null}

      {!isLoading && projects.length === 0 ? (
        <div className="px-6 pb-6">
          <CardInset className="border-dashed p-6 text-center text-sm text-muted-foreground">
            No projects yet.
          </CardInset>
        </div>
      ) : null}

      {!isLoading ? (
        <div className="space-y-4 px-6 pb-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <CardInset interactive className="p-4">
                <CardInsetHeader
                  title={project.name}
                  description={project.description ?? "No description"}
                  badge={
                    <span className="rounded-xl p-1 text-muted-foreground transition hover:bg-white/72 hover:text-foreground">
                      <MoreHorizontal size={16} />
                    </span>
                  }
                />

                <CardMetaRow
                  className="text-sm text-muted-foreground"
                  left={
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {formatProjectDate(project.dueDate)}
                    </div>
                  }
                />

                <CardMetaRow
                  className="text-sm"
                  left={
                    <span className="text-muted-foreground">
                      {project.updatedAt
                        ? `Updated ${formatProjectDate(project.updatedAt)}`
                        : "Recently created"}
                    </span>
                  }
                  right={
                    <span className="text-foreground">
                      {project.archived ? "Archived" : "Active"}
                    </span>
                  }
                />
              </CardInset>
            </Link>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
