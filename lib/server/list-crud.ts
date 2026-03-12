import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { lists } from "@/lib/db/schema";
import {
  assertProjectRole,
  getProjectMembership,
} from "@/lib/server/project-permissions";

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
    .where(eq(lists.id, listId))
    .limit(1);

  if (!list) {
    throw new Error("NotFound");
  }

  const membership = await getProjectMembership(list.projectId, userId);

  if (!membership) {
    throw new Error("Forbidden");
  }

  return list;
}

export async function listProjectLists(projectId: string, userId: string) {
  await assertProjectRole(projectId, userId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);

  return db
    .select()
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(asc(lists.position), asc(lists.createdAt));
}

export async function createProjectList(
  userId: string,
  input: CreateListInput,
) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin"]);

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

export async function updateProjectList(
  listId: string,
  userId: string,
  input: UpdateListInput,
) {
  const existingList = await getAccessibleList(listId, userId);
  await assertProjectRole(existingList.projectId, userId, ["owner", "admin"]);

  const [updatedList] = await db
    .update(lists)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(lists.id, listId))
    .returning();

  if (!updatedList) {
    throw new Error("NotFound");
  }

  return updatedList;
}

export async function deleteProjectList(listId: string, userId: string) {
  const existingList = await getAccessibleList(listId, userId);
  await assertProjectRole(existingList.projectId, userId, ["owner", "admin"]);

  const [deletedList] = await db
    .delete(lists)
    .where(eq(lists.id, listId))
    .returning();

  if (!deletedList) {
    throw new Error("NotFound");
  }

  return deletedList;
}
