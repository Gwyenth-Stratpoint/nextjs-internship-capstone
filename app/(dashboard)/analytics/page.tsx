"use client";

import { BarChart3, CheckCircle2, Clock3, FolderKanban, Layers3 } from "lucide-react";
import { Suspense, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AnalyticsStatusChart } from "@/components/analytics-status-chart";
import { Card, CardContent, CardHeader, CardInset, CardTitle } from "@/components/ui/card";
import { useAnalyticsOverview } from "@/hooks/use-analytics-overview";
import { useProjects } from "@/hooks/use-projects";

function formatPercent(value: number) {
  return `${value}%`;
}

function buildAnalyticsSearch(selectedProjectId: string | null) {
  const searchParams = new URLSearchParams();

  if (selectedProjectId) {
    searchParams.set("projectId", selectedProjectId);
  }

  return searchParams.toString();
}

function AnalyticsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("projectId");
  const { projects, isLoading: isProjectsLoading } = useProjects();
  const { overview, isLoading, error } = useAnalyticsOverview(selectedProjectId);

  useEffect(() => {
    if (isProjectsLoading || !selectedProjectId) {
      return;
    }

    const selectedStillExists = projects.some((project) => project.id === selectedProjectId);

    if (!selectedStillExists) {
      router.replace(pathname);
    }
  }, [isProjectsLoading, pathname, projects, router, selectedProjectId]);

  const metrics = useMemo(() => {
    const totalProjects = overview?.totalProjects ?? 0;
    const activeProjects = overview?.activeProjects ?? 0;
    const completedTasks = overview?.completedTasks ?? 0;
    const overdueTasks = overview?.overdueTasks ?? 0;
    const completionRate = overview?.completionRate ?? 0;

    return [
      {
        title: "Total Projects",
        value: totalProjects.toString(),
        helper: selectedProjectId ? "Selected board scope" : "Projects in this workspace",
        icon: FolderKanban,
        colorClass: "bg-blue-100 text-blue-600",
      },
      {
        title: "Active Projects",
        value: activeProjects.toString(),
        helper: "Not archived",
        icon: Layers3,
        colorClass: "bg-violet-100 text-violet-600",
      },
      {
        title: "Completed Tasks",
        value: completedTasks.toString(),
        helper: "Tasks marked done",
        icon: CheckCircle2,
        colorClass: "bg-emerald-100 text-emerald-600",
      },
      {
        title: "Overdue Tasks",
        value: overdueTasks.toString(),
        helper: "Past due and still open",
        icon: Clock3,
        colorClass: "bg-amber-100 text-amber-600",
      },
      {
        title: "Completion Rate",
        value: formatPercent(completionRate),
        helper: "Completed active tasks",
        icon: BarChart3,
        colorClass: "bg-sky-100 text-sky-600",
      },
    ];
  }, [overview, selectedProjectId]);

  const subtitle =
    overview?.scope.type === "project"
      ? `Live metrics for ${overview.scope.projectName}. Auto-refreshes every 10 seconds.`
      : "Live metrics for your current workspace. Auto-refreshes every 10 seconds.";

  function handleProjectScopeChange(nextValue: string) {
    const nextProjectId = nextValue === "all" ? null : nextValue;
    const nextSearch = buildAnalyticsSearch(nextProjectId);

    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>

        <label className="flex min-w-[240px] flex-col gap-2 text-sm font-medium text-slate-700">
          Project scope
          <select
            value={selectedProjectId ?? "all"}
            onChange={(event) => handleProjectScopeChange(event.target.value)}
            disabled={isProjectsLoading}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All workspace projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <CardInset key={metric.title} className="rounded-[20px] px-4 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${metric.colorClass}`}
              >
                <metric.icon size={18} />
              </div>
            </div>
            <p className="text-[1.7rem] font-semibold text-slate-900">
              {isLoading && !overview ? "--" : metric.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{metric.title}</p>
            <p className="mt-1 text-sm text-slate-500">{metric.helper}</p>
          </CardInset>
        ))}
      </div>

      <Card variant="panel">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Status Distribution</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {overview?.scope.type === "project"
                ? "Task status breakdown for the selected board."
                : "Task status breakdown across your accessible workspace projects."}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <AnalyticsStatusChart data={overview?.statusDistribution ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPageFallback() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mt-2 text-muted-foreground">Loading live analytics...</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardInset key={index} className="rounded-[20px] px-4 py-4">
            <div className="mb-4 h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-4 w-28 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-100" />
          </CardInset>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsPageFallback />}>
      <AnalyticsPageContent />
    </Suspense>
  );
}
