import { inArray } from "drizzle-orm";

import type { DashboardOverview } from "@/lib/dashboard/types";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { listAccessibleProjects } from "@/lib/server/project-crud";
import { getOrganizationTeamSnapshot } from "@/lib/server/team-crud";

function createEmptyOverview(teamMembers: number, pendingInvites: number): DashboardOverview {
  return {
    totalProjects: 0,
    activeProjects: 0,
    archivedProjects: 0,
    teamMembers,
    pendingInvites,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  };
}

export async function getDashboardOverview(userId: string, clerkOrgId: string) {
  const [accessibleProjects, teamSnapshot] = await Promise.all([
    listAccessibleProjects(userId, clerkOrgId),
    getOrganizationTeamSnapshot(clerkOrgId),
  ]);

  const totalProjects = accessibleProjects.length;
  const activeProjects = accessibleProjects.filter((project) => !project.archived).length;
  const archivedProjects = totalProjects - activeProjects;
  const teamMembers = teamSnapshot.members.length;
  const pendingInvites = teamSnapshot.invitations.length;

  if (totalProjects === 0) {
    return createEmptyOverview(teamMembers, pendingInvites);
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
        accessibleProjects.map((project) => project.id),
      ),
    );

  const activeTaskRows = taskRows.filter((task) => !task.archived);
  const completedTasks = activeTaskRows.filter((task) => task.status === "done").length;
  const pendingTasks = activeTaskRows.filter((task) => task.status !== "done").length;
  const now = new Date();
  const overdueTasks = activeTaskRows.filter((task) => {
    return Boolean(task.dueDate && task.status !== "done" && new Date(task.dueDate) < now);
  }).length;

  return {
    totalProjects,
    activeProjects,
    archivedProjects,
    teamMembers,
    pendingInvites,
    completedTasks,
    pendingTasks,
    overdueTasks,
  };
}
