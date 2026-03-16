import { asc, eq, inArray } from "drizzle-orm";

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
  category?: "todo" | "in_progress" | "done";
};

type UpdateListInput = Partial<{
  name: string;
  position: number;
  archived: boolean;
  category: "todo" | "in_progress" | "done";
}>;

type ReorderListsInput = {
  projectId: string;
  orderedListIds: string[];
};

export type ProjectTemplate = "simple" | "software";

const PROJECT_TEMPLATE_LISTS: Record<ProjectTemplate, Array<{
  name: string;
  position: number;
  category: "todo" | "in_progress" | "done";
}>> = {
  simple: [
    {
      name: "Backlog",
      position: 0,
      category: "todo",
    },
    {
      name: "In Progress",
      position: 1,
      category: "in_progress",
    },
    {
      name: "Done",
      position: 2,
      category: "done",
    },
  ],
  software: [
    {
      name: "Backlog",
      position: 0,
      category: "todo",
    },
    {
      name: "To Do",
      position: 1,
      category: "in_progress",
    },
    {
      name: "In Progress",
      position: 2,
      category: "in_progress",
    },
    {
      name: "Review",
      position: 3,
      category: "in_progress",
    },
    {
      name: "Done",
      position: 4,
      category: "done",
    },
  ],
};

function clampPosition(position: number, max: number) {
  return Math.max(0, Math.min(position, max));
}

async function getProjectListRows(projectId: string) {
  return db
    .select({
      id: lists.id,
      name: lists.name,
      category: lists.category,
      archived: lists.archived,
      createdAt: lists.createdAt,
    })
    .from(lists)
    .where(eq(lists.projectId, projectId))
    .orderBy(asc(lists.position), asc(lists.createdAt));
}

async function assertUniqueTerminalCategory(
  projectId: string,
  category: "todo" | "in_progress" | "done",
  options?: { excludeListId?: string },
) {
  if (category === "in_progress") {
    return;
  }

  const existingLists = await getProjectListRows(projectId);
  const duplicate = existingLists.find(
    (list) => !list.archived && list.category === category && list.id !== options?.excludeListId,
  );

  if (duplicate) {
    throw new Error(
      category === "todo"
        ? "A start list already exists for this project"
        : "An end list already exists for this project",
    );
  }
}

export async function ensureProjectDefaultLists(projectId: string, template: ProjectTemplate = "simple") {
  const existingLists = await getProjectListRows(projectId);

  if (existingLists.length > 0) {
    return false;
  }

  await db.insert(lists).values(
    PROJECT_TEMPLATE_LISTS[template].map((list) => ({
      projectId,
      name: list.name,
      position: list.position,
      category: list.category,
    })),
  );

  return true;
}

async function persistListOrder(projectId: string, orderedListIds?: string[]) {
  const resolvedIds =
    orderedListIds ??
    (await getProjectListRows(projectId)).map((list) => list.id);

  for (const [position, listId] of resolvedIds.entries()) {
    await db
      .update(lists)
      .set({
        position,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId));
  }
}

async function getAccessibleList(listId: string, userId: string) {
  const [list] = await db
    .select({
      id: lists.id,
      projectId: lists.projectId,
      name: lists.name,
      position: lists.position,
      category: lists.category,
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

  await ensureProjectDefaultLists(projectId);

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
  await assertUniqueTerminalCategory(input.projectId, input.category ?? "in_progress");
  const existingLists = await getProjectListRows(input.projectId);
  const targetPosition = clampPosition(
    input.position ?? existingLists.length,
    existingLists.length,
  );

  const [list] = await db
    .insert(lists)
    .values({
      projectId: input.projectId,
      name: input.name,
      position: targetPosition,
      category: input.category ?? "in_progress",
    })
    .returning();

  if (!list) {
    throw new Error("Failed to create list");
  }

  const orderedListIds = existingLists.map((existing) => existing.id);
  orderedListIds.splice(targetPosition, 0, list.id);
  await persistListOrder(input.projectId, orderedListIds);

  const [createdList] = await db.select().from(lists).where(eq(lists.id, list.id)).limit(1);

  if (!createdList) {
    throw new Error("Failed to create list");
  }

  return createdList;
}

export async function updateProjectList(
  listId: string,
  userId: string,
  input: UpdateListInput,
) {
  const existingList = await getAccessibleList(listId, userId);
  await assertProjectRole(existingList.projectId, userId, ["owner", "admin"]);
  const nextCategory = input.category ?? existingList.category;
  await assertUniqueTerminalCategory(existingList.projectId, nextCategory, {
    excludeListId: listId,
  });

  if (input.position !== undefined) {
    const siblingIds = (await getProjectListRows(existingList.projectId))
      .map((list) => list.id)
      .filter((id) => id !== listId);
    const targetPosition = clampPosition(input.position, siblingIds.length);

    const [updatedList] = await db
      .update(lists)
      .set({
        name: input.name,
        archived: input.archived,
        position: targetPosition,
        category: input.category,
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .returning();

    if (!updatedList) {
      throw new Error("NotFound");
    }

    siblingIds.splice(targetPosition, 0, listId);
    await persistListOrder(existingList.projectId, siblingIds);

    const [normalizedList] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId))
      .limit(1);

    if (!normalizedList) {
      throw new Error("NotFound");
    }

    return normalizedList;
  }

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

  const [normalizedList] = await db
    .select()
    .from(lists)
    .where(eq(lists.id, listId))
    .limit(1);

  if (!normalizedList) {
    throw new Error("NotFound");
  }

  return normalizedList;
}

export async function deleteProjectList(listId: string, userId: string) {
  const existingList = await getAccessibleList(listId, userId);
  await assertProjectRole(existingList.projectId, userId, ["owner", "admin"]);

  if (existingList.category === "todo" || existingList.category === "done") {
    throw new Error(
      existingList.category === "todo"
        ? "The project must keep one start list"
        : "The project must keep one end list",
    );
  }

  const [deletedList] = await db
    .delete(lists)
    .where(eq(lists.id, listId))
    .returning();

  if (!deletedList) {
    throw new Error("NotFound");
  }

  await persistListOrder(existingList.projectId);

  return deletedList;
}

export async function reorderProjectLists(userId: string, input: ReorderListsInput) {
  await assertProjectRole(input.projectId, userId, ["owner", "admin"]);

  const existingLists = await getProjectListRows(input.projectId);
  const existingIds = existingLists.map((list) => list.id);

  if (
    existingIds.length !== input.orderedListIds.length ||
    existingIds.some((id) => !input.orderedListIds.includes(id))
  ) {
    throw new Error("OrderMismatch");
  }

  const rows = await db
    .select({ id: lists.id })
    .from(lists)
    .where(inArray(lists.id, input.orderedListIds));

  if (rows.length !== input.orderedListIds.length) {
    throw new Error("OrderMismatch");
  }

  await persistListOrder(input.projectId, input.orderedListIds);
  return listProjectLists(input.projectId, userId);
}
