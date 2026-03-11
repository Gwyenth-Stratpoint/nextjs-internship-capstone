"use client"

import Link from "next/link"
import { CheckCircle, Clock, Plus, TrendingUp, Users } from "lucide-react"
import { useMemo } from "react"

import { DashboardStats } from "@/components/dashboard-stats"
import { RecentProjects } from "@/components/recent-projects"
import { useProjects } from "@/hooks/use-projects"

function DashboardProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-3 h-6 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
          <div className="mb-6 h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="flex gap-3">
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export default function DashboardPage() {
  const { projects, isLoading, error } = useProjects()

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects],
  )

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
  )

  const recentProjects = useMemo(() => projects.slice(0, 3), [projects])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-outer_space-500 dark:text-platinum-500">Dashboard</h1>
        <p className="text-payne's_gray-500 dark:text-french_gray-500 mt-2">
          Welcome back! Here&apos;s an overview of your projects and tasks.
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentProjects projects={recentProjects} isLoading={isLoading} />

        <div className="bg-white dark:bg-outer_space-500 rounded-lg border border-french_gray-300 dark:border-payne's_gray-400 p-6">
          <h3 className="text-lg font-semibold text-outer_space-500 dark:text-platinum-500 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              href="/projects"
              className="w-full flex items-center justify-center px-4 py-3 bg-blue_munsell-500 text-white rounded-lg hover:bg-blue_munsell-600 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Create New Project
            </Link>
            <Link
              href="/team"
              className="w-full flex items-center justify-center px-4 py-3 border border-french_gray-300 dark:border-payne's_gray-400 text-outer_space-500 dark:text-platinum-500 rounded-lg hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Team Member
            </Link>
            <Link
              href="/projects"
              className="w-full flex items-center justify-center px-4 py-3 border border-french_gray-300 dark:border-payne's_gray-400 text-outer_space-500 dark:text-platinum-500 rounded-lg hover:bg-platinum-500 dark:hover:bg-payne's_gray-400 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Create Task
            </Link>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Project data is live. Team and task counts depend on later TODOs in the instructor files.
            </p>
          </div>
        </div>
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
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <h3 className="mt-4 text-xl font-semibold text-foreground">No projects yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Create your first project to start tracking work from the dashboard.
            </p>
            <Link
              href="/projects"
              className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Plus className="mr-2" size={16} />
              Create a project
            </Link>
          </div>
        ) : null}

        {!isLoading && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${project.archived ? "bg-muted-foreground/50" : "bg-primary"}`}
                      />
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {project.archived ? "Archived" : "Active"}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">{project.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {project.description ?? "No description added yet."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">Created {formatProjectDate(project.createdAt)}</span>
                  {project.key ? <span className="rounded-full bg-muted px-3 py-1">{project.key}</span> : null}
                  {project.dueDate ? (
                    <span className="rounded-full bg-muted px-3 py-1">Due {formatProjectDate(project.dueDate)}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
