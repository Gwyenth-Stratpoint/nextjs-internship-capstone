"use client";

import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { use, useEffect, useState } from "react";

import { ActivityFeed } from "@/components/activity-feed";
import { Card, CardContent, CardHeader, CardInset, CardTitle } from "@/components/ui/card";
import { useProjectActivity } from "@/hooks/use-project-activity";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  description: string | null;
  role: "admin" | "member" | "viewer";
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export default function ProjectHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    activityItems,
    isLoading: isActivityLoading,
    error: activityError,
  } = useProjectActivity(id);
  const [project, setProject] = useState<Project | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      setIsProjectLoading(true);
      setProjectError(null);

      try {
        const response = await fetch(`/api/projects/${id}`, { cache: "no-store" });
        const payload = (await response.json()) as ApiResponse<Project>;

        if (!response.ok || !payload.success) {
          const message = payload.success ? "Failed to fetch project" : payload.error.message;
          throw new Error(message);
        }

        if (active) {
          setProject(payload.data);
        }
      } catch (err) {
        if (active) {
          setProjectError(err instanceof Error ? err.message : "Failed to fetch project");
        }
      } finally {
        if (active) {
          setIsProjectLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      active = false;
    };
  }, [id]);

  if (isProjectLoading) {
    return <div className="text-sm text-muted-foreground">Loading project history...</div>;
  }

  if (projectError) {
    return <div className="text-sm text-red-600">{projectError}</div>;
  }

  if (!project) {
    return <div className="text-sm text-muted-foreground">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
          >
            <ArrowLeft size={16} />
            Back to board
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project history</h1>
            <p className="mt-2 text-muted-foreground">
              Timeline of activity for{" "}
              <span className="font-medium text-slate-700">{project.name}</span>.
            </p>
          </div>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          <History size={16} />
          Open board
        </Link>
      </div>

      <Card variant="panel">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <CardInset className="rounded-[20px] px-5 py-5">
            {activityError ? <p className="text-sm text-red-600">{activityError}</p> : null}
            {isActivityLoading && activityItems.length === 0 ? (
              <p className="text-sm text-slate-500">Loading history...</p>
            ) : (
              <ActivityFeed
                items={activityItems}
                emptyLabel="No activity has been recorded for this project yet."
              />
            )}
          </CardInset>
        </CardContent>
      </Card>
    </div>
  );
}
