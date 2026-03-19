"use client";

import Link from "next/link";
import { CheckCircle, Clock, Plus, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";

import { DashboardStats } from "@/components/dashboard-stats";
import { ProjectCard } from "@/components/project-card";
import { RecentProjects } from "@/components/recent-projects";
import { Card, CardContent, CardHeader, CardInset, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/hooks/use-projects";

function DashboardProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <CardInset key={index} className="p-5">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mb-6 h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          </div>
        </CardInset>
      ))}
    </div>
  );
}

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const { projects, isLoading, error } = useProjects();

  const activeProjects = useMemo(() => projects.filter((project) => !project.archived), [projects]);

  const stats = useMemo(
    () => [
      {
        name: "Active Projects",
        value: isLoading ? "--" : activeProjects.length,
        change: isLoading ? "Loading..." : `${projects.length - activeProjects.length} archived`,
        changeType: "positive" as const,
        icon: TrendingUp,
      },
      {
        name: "Team Members",
        value: "--",
        change: "Task 6.1 team data pending",
        changeType: "neutral" as const,
        icon: Users,
      },
      {
        name: "Completed Tasks",
        value: "--",
        change: "Task 4.4 useTasks pending",
        changeType: "neutral" as const,
        icon: CheckCircle,
      },
      {
        name: "Pending Tasks",
        value: "--",
        change: "Task 4.4 useTasks pending",
        changeType: "neutral" as const,
        icon: Clock,
      },
    ],
    [activeProjects.length, isLoading, projects.length],
  );

  const recentProjects = useMemo(() => projects.slice(0, 3), [projects]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">
          Dashboard
        </h1>
        <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
          Welcome back! Here&apos;s an overview of your projects and tasks.
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjects projects={recentProjects} isLoading={isLoading} />

        <Card variant="panel">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Link
              href="/projects"
              className="w-full flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-white shadow-[0_12px_24px_rgba(109,93,252,0.25)] transition-colors hover:bg-primary/90"
            >
              <Plus size={20} className="mr-2" />
              Create New Project
            </Link>
            <Link href="/team" className="block">
              <CardInset
                as="div"
                interactive
                className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium text-outer_space-500 dark:text-platinum-500"
              >
                <Plus size={20} />
                Add Team Member
              </CardInset>
            </Link>
            <Link href="/projects" className="block">
              <CardInset
                as="div"
                interactive
                className="flex items-center justify-center gap-2 px-4 py-3 text-center text-sm font-medium text-outer_space-500 dark:text-platinum-500"
              >
                <Plus size={20} />
                Create Task
              </CardInset>
            </Link>
            <CardInset
              as="div"
              className="border-amber-200/70 bg-amber-50/70 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
            >
              Project data is live. Team and task counts depend on later TODOs in the instructor
              files.
            </CardInset>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Project listing</h2>
          <p className="text-sm text-muted-foreground">All projects for the current user.</p>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load projects: {error}
          </div>
        ) : null}

        {isLoading ? <DashboardProjectsSkeleton /> : null}

        {!isLoading && projects.length === 0 ? (
          <Card variant="panel">
            <CardContent className="p-6">
              <CardInset as="div" className="border-dashed px-6 py-12 text-center">
                <h3 className="text-xl font-semibold text-foreground">No projects yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Create your first project to start tracking work from the dashboard.
                </p>
                <Link
                  href="/projects"
                  className="mt-6 inline-flex items-center rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  <Plus className="mr-2" size={16} />
                  Create a project
                </Link>
              </CardInset>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                href={`/projects/${project.id}`}
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description,
                  dueDate: project.dueDate,
                  status: project.archived ? "archived" : "active",
                  role: project.key ?? undefined,
                }}
                footer={
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-white/72 px-3 py-1 backdrop-blur-md">
                      Created {formatProjectDate(project.createdAt)}
                    </span>
                  </div>
                }
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
