import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { activity, users } from "@/lib/db/schema";
import { describeActivity } from "@/lib/server/activity-format";
import { assertProjectRole } from "@/lib/server/project-permissions";

export type ProjectActivityItem = {
  id: string;
  description: string;
  createdAt: Date;
};

export async function listProjectActivity(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, ["admin", "member", "viewer"]);

  const rows = await db
    .select({
      id: activity.id,
      action: activity.action,
      meta: activity.meta,
      createdAt: activity.createdAt,
      actorName: users.name,
    })
    .from(activity)
    .leftJoin(users, eq(activity.actorId, users.id))
    .where(eq(activity.projectId, projectId))
    .orderBy(asc(activity.createdAt));

  return rows.map((row) => ({
    id: row.id,
    description: describeActivity(
      row.action,
      row.actorName,
      (row.meta ?? {}) as Record<string, unknown>,
    ),
    createdAt: row.createdAt,
  }));
}
