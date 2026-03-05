// TODO: Task 3.6 - Set up data validation with Zod schemas

/*
TODO: Implementation Notes for Interns: */


import { z } from "zod";

/**
 * Helpers
 */
const uuid = z.string().uuid();

/**
 * Workspace
 * (handy now even if you don't have UI yet)
 */
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
  userId: uuid, // Option A: user must already exist
  role: z.enum(["owner", "admin", "member"]).optional(),
  title: z.string().max(80, "Title too long").nullable().optional(),
  status: z.enum(["invited", "active", "suspended"]).optional(),
});

/**
 * Project
 */
export const projectSchema = z.object({
  workspaceId: uuid,
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").nullable().optional(),

  // if you use project keys like Jira ("ABC")
  key: z
    .string()
    .max(10, "Key too long")
    .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters/numbers only")
    .nullable()
    .optional(),

  // Accept ISO strings from forms and coerce to Date
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

/**
 * Project members (Phase 6.4)
 */
export const projectMemberSchema = z.object({
  projectId: uuid,
  userId: uuid,
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

/**
 * Lists / Columns
 */
export const listSchema = z.object({
  projectId: uuid,
  name: z.string().min(1, "Name is required").max(60, "Name too long"),
  position: z.number().int().min(0).optional(),
});

export const listUpdateSchema = z
  .object({
    name: z.string().min(1).max(60).optional(),
    position: z.number().int().min(0).optional(),
    archived: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

/**
 * Tasks
 */
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

/**
 * Comments (note: your schema uses `content`)
 */
export const commentSchema = z.object({
  taskId: uuid,
  content: z.string().min(1, "Comment is required").max(2000, "Comment too long"),
});

/**
 * User profile update
 * (your users table allows name + avatarUrl)
 */
export const userSchema = z.object({
  name: z.string().max(120, "Name too long").nullable().optional(),
  avatarUrl: z.string().url("Invalid URL").nullable().optional(),
});