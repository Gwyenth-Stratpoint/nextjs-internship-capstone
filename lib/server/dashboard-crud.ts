import { getAnalyticsOverview } from "@/lib/server/analytics-crud";
import { getOrganizationTeamSnapshot } from "@/lib/server/team-crud";

export async function getDashboardOverview(userId: string, clerkOrgId: string) {
  const [analytics, teamSnapshot] = await Promise.all([
    getAnalyticsOverview(userId, clerkOrgId),
    getOrganizationTeamSnapshot(clerkOrgId),
  ]);

  const pendingTasks = analytics.statusDistribution
    .filter((entry) => entry.name !== "Done")
    .reduce((total, entry) => total + entry.value, 0);

  return {
    activeProjects: analytics.activeProjects,
    archivedProjects: Math.max(analytics.totalProjects - analytics.activeProjects, 0),
    teamMembers: teamSnapshot.members.length,
    completedTasks: analytics.completedTasks,
    pendingTasks,
  };
}
