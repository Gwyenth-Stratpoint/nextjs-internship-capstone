// TODO: Task 3.6 - Set up data validation with Zod schemas

/*
TODO: Implementation Notes for Interns: */

import { z } from "zod";

const uuid = z.string().uuid();

export const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100, "Name too long"),
  slug: z
    .string()
    .min(2, "Slug is required")
    .max(60, "Slug too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and use hyphens only"),
});

export const workspaceMemberSchema = z.object({
  workspaceId: uuid,
  userId: uuid,
  role: z.enum(["owner", "admin", "member"]).optional(),
  title: z.string().max(80, "Title too long").nullable().optional(),
  status: z.enum(["invited", "active", "suspended"]).optional(),
});

export const projectSchema = z.object({
  workspaceId: uuid,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").nullable().optional(),

  key: z
    .string()
    .max(10, "Key too long")
    .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters/numbers only")
    .nullable()
    .optional(),

  dueDate: z.coerce.date().nullable().optional(),
});

export const projectUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    key: z
      .string()
      .max(10)
      .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters/numbers only")
      .nullable()
      .optional(),
    dueDate: z.coerce.date().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

// Project members (Phase 6.4)

export const projectMemberSchema = z.object({
  projectId: uuid,
  userId: uuid,
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export const projectInvitationSchema = z.object({
  projectId: uuid,
  email: z.email("Enter a valid email address"),
  role: z.enum(["owner", "admin", "member", "viewer"]),
  workspaceRoleKey: z.enum(["org:admin", "org:member"]).default("org:member"),
});

export const listSchema = z.object({
  projectId: uuid,
  name: z.string().min(1, "Name is required").max(60, "Name too long"),
  position: z.number().int().min(0).optional(),
  category: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const listUpdateSchema = z
  .object({
    name: z.string().min(1).max(60).optional(),
    position: z.number().int().min(0).optional(),
    archived: z.boolean().optional(),
    category: z.enum(["todo", "in_progress", "done"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const listReorderSchema = z.object({
  projectId: uuid,
  orderedListIds: z.array(uuid).min(1, "At least one list id is required"),
});

export const listDeleteSchema = z.object({
  moveTasksToListId: uuid.nullable().optional(),
});

export const taskSchema = z.object({
  projectId: uuid,
  listId: uuid.nullable().optional(),

  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(1000, "Description too long").nullable().optional(),

  status: z.enum(["open", "in_progress", "blocked", "done"]).optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),

  assigneeId: uuid.nullable().optional(),
  reporterId: uuid.nullable().optional(),

  dueDate: z.coerce.date().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),

  position: z.number().int().min(0).optional(),
});

export const taskUpdateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).nullable().optional(),
    status: z.enum(["open", "in_progress", "blocked", "done"]).optional(),
    priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
    assigneeId: uuid.nullable().optional(),
    reporterId: uuid.nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    startDate: z.coerce.date().nullable().optional(),
    listId: uuid.nullable().optional(),
    position: z.number().int().min(0).optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export const taskReorderSchema = z.object({
  projectId: uuid,
  listId: uuid.nullable(),
  orderedTaskIds: z.array(uuid).min(1, "At least one task id is required"),
});

export const commentSchema = z.object({
  taskId: uuid,
  content: z.string().min(1, "Comment is required").max(2000, "Comment too long"),
});

export const userSchema = z.object({
  name: z.string().max(120, "Name too long").nullable().optional(),
  avatarUrl: z.string().url("Invalid URL").nullable().optional(),
});
