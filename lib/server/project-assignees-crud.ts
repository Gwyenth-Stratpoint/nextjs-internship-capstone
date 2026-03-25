import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projectMembers, users } from "@/lib/db/schema";
import { assertProjectRole } from "@/lib/server/project-permissions";

export async function listAssignableProjectMembers(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, ["admin", "member", "viewer"]);

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId))
    .orderBy(asc(users.name), asc(users.email));
}
