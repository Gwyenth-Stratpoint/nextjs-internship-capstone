import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { lists, projectMembers } from "@/lib/db/schema";

type CreateListInput = {
  projectId: string;
  name: string;
  position?: number;
};

type UpdateListInput = Partial<{
  name: string;
  position: number;
  archived: boolean;
}>;

async function assertProjectMember(projectId: string, userId: string) {
  const [membership] = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)))
    .limit(1);

  if (!membership) {
    throw new Error("Forbidden");
  }
}

async function getAccessibleList(listId: string, userId: string) {
  const [list] = await db
    .select({
      id: lists.id,
      projectId: lists.projectId,
      name: lists.name,
      position: lists.position,
      archived: lists.archived,
      createdAt: lists.createdAt,
      updatedAt: lists.updatedAt,
    })
    .from(lists)
    .innerJoin(
      projectMembers,
      and(eq(projectMembers.projectId, lists.projectId), eq(projectMembers.userId, userId)),
    )
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list) {
    throw new Error("NotFound");
  }

  return list;
}

export async function listProjectLists(projectId: string, userId: string) {
  await assertProjectMember(projectId, userId);

  return db
    .select()
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(asc(lists.position), asc(lists.createdAt));
}

export async function createProjectList(userId: string, input: CreateListInput) {
  await assertProjectMember(input.projectId, userId);

  const [list] = await db
    .insert(lists)
    .values({
      projectId: input.projectId,
      name: input.name,
      position: input.position ?? 0,
    })
    .returning();

  if (!list) {
    throw new Error("Failed to create list");
  }

  return list;
}

export async function updateProjectList(listId: string, userId: string, input: UpdateListInput) {
  await getAccessibleList(listId, userId);

  const [list] = await db
    .update(lists)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, listId))
    .returning();

  if (!list) {
    throw new Error("NotFound");
  }

  return list;
}

export async function archiveProjectList(listId: string, userId: string) {
  return updateProjectList(listId, userId, { archived: true });
}
