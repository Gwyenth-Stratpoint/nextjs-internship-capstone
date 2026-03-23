import { inArray } from "drizzle-orm";

import type {
  AnalyticsOverview,
  AnalyticsScope,
  AnalyticsStatusDatum,
} from "@/lib/analytics/types";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { listAccessibleProjects } from "@/lib/server/project-crud";

function getEmptyStatusDistribution(): AnalyticsStatusDatum[] {
  return [
    { name: "Open", value: 0 },
    { name: "In Progress", value: 0 },
    { name: "Blocked", value: 0 },
    { name: "Done", value: 0 },
  ];
}

function createEmptyOverview(scope: AnalyticsScope): AnalyticsOverview {
  return {
    totalProjects: 0,
    activeProjects: 0,
    completedTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    statusDistribution: getEmptyStatusDistribution(),
    scope,
  };
}

export async function getAnalyticsOverview(
  userId: string,
  clerkOrgId: string,
  options?: { projectId?: string | null },
) {
  const accessibleProjects = await listAccessibleProjects(userId, clerkOrgId);
  const selectedProjectId = options?.projectId ?? null;

  const scope = selectedProjectId
    ? (() => {
        const selectedProject = accessibleProjects.find(
          (project) => project.id === selectedProjectId,
        );

        if (!selectedProject) {
          throw new Error("NotFound");
        }

        return {
          type: "project" as const,
          projectId: selectedProject.id,
          projectName: selectedProject.name,
        };
      })()
    : ({
        type: "workspace",
        projectId: null,
        projectName: null,
      } as const);

  const scopedProjects = selectedProjectId
    ? accessibleProjects.filter((project) => project.id === selectedProjectId)
    : accessibleProjects;
  const activeProjects = scopedProjects.filter((project) => !project.archived);

  if (scopedProjects.length === 0) {
    return createEmptyOverview(scope);
  }

  const taskRows = await db
    .select({
      archived: tasks.archived,
      status: tasks.status,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(
      inArray(
        tasks.projectId,
        scopedProjects.map((project) => project.id),
      ),
    );

  const activeTaskRows = taskRows.filter((task) => !task.archived);
  const now = new Date();
  const completedTasks = activeTaskRows.filter((task) => task.status === "done").length;
  const overdueTasks = activeTaskRows.filter((task) => {
    return Boolean(task.dueDate && task.status !== "done" && new Date(task.dueDate) < now);
  }).length;
  const statusDistribution: AnalyticsStatusDatum[] = [
    {
      name: "Open",
      value: activeTaskRows.filter((task) => task.status === "open").length,
    },
    {
      name: "In Progress",
      value: activeTaskRows.filter((task) => task.status === "in_progress").length,
    },
    {
      name: "Blocked",
      value: activeTaskRows.filter((task) => task.status === "blocked").length,
    },
    {
      name: "Done",
      value: activeTaskRows.filter((task) => task.status === "done").length,
    },
  ];

  return {
    totalProjects: scopedProjects.length,
    activeProjects: activeProjects.length,
    completedTasks,
    overdueTasks,
    completionRate: activeTaskRows.length
      ? Math.round((completedTasks / activeTaskRows.length) * 100)
      : 0,
    statusDistribution,
    scope,
  };
}
