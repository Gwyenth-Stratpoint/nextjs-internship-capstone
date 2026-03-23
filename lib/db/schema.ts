// db/schema.ts
//
// Neon (Postgres) + Drizzle ORM schema for a project management app with:
// - Workspaces + workspace members (Team page) [Option A invites: only existing users]
// - Projects + project members (project permissions / RBAC)
// - Lists/columns + tasks (kanban)
// - Task assignment, due dates, priorities, labels
// - Comments + activity history
//
// Assumes Clerk auth: store Clerk user id on users.clerkId
//
// Usage: import these tables into your db + migrations.

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  primaryKey,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// --------------------
// Enums
// --------------------

// Workspace-level coarse access (for managing workspace/team)
export const workspaceRoleEnum = pgEnum("workspace_role", ["owner", "admin", "member"]);

// Project-level RBAC role (Phase 6.4 “project member management and permissions”)
export const projectRoleEnum = pgEnum("project_role", ["owner", "admin", "member", "viewer"]);

// Invitation / membership status for workspace members
export const membershipStatusEnum = pgEnum("membership_status", ["invited", "active", "suspended"]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", ["open", "in_progress", "blocked", "done"]);

export const listCategoryEnum = pgEnum("list_category", ["todo", "in_progress", "done"]);

export const activityActionEnum = pgEnum("activity_action", [
  "created",
  "updated",
  "commented",
  "moved",
  "assigned",
  "unassigned",
  "labeled",
  "unlabeled",
  "archived",
  "unarchived",
]);

export const projectInvitationStatusEnum = pgEnum("project_invitation_status", [
  "pending",
  "accepted",
  "revoked",
]);

// --------------------
// Users (synced from Clerk)
// --------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(), // Clerk user ID
    email: text("email").notNull(),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    clerkIdUnique: uniqueIndex("users_clerk_id_unique").on(t.clerkId),
    emailIdx: index("users_email_idx").on(t.email),
  }),
);

// --------------------
// Workspaces
// --------------------
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(), // for URLs, unique per workspace
    clerkOrgId: text("clerk_org_id"),

    // optional: who created it
    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    archived: boolean("archived").notNull().default(false),
  },
  (t) => ({
    slugUnique: uniqueIndex("workspaces_slug_unique").on(t.slug),
    clerkOrgIdUnique: uniqueIndex("workspaces_clerk_org_id_unique").on(t.clerkOrgId),
    createdByIdx: index("workspaces_created_by_idx").on(t.createdById),
  }),
);

// Workspace membership drives your Team page
// Option A invites: invite only users that already exist in `users` table.
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Workspace-level coarse permissions
    role: workspaceRoleEnum("role").notNull().default("member"),

    // What your UI shows: Developer / Designer / QA Engineer / Project Manager
    // Keep as free text for MVP (you can normalize later).
    title: text("title"), // e.g. "Developer"

    status: membershipStatusEnum("status").notNull().default("active"),

    // For invite flows: you can store who invited them + when accepted
    invitedById: uuid("invited_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workspaceId, t.userId] }),
    wsIdx: index("workspace_members_workspace_id_idx").on(t.workspaceId),
    userIdx: index("workspace_members_user_id_idx").on(t.userId),
    roleIdx: index("workspace_members_role_idx").on(t.role),
    statusIdx: index("workspace_members_status_idx").on(t.status),
  }),
);

// --------------------
// Projects (belong to a workspace)
// --------------------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    key: text("key"), // optional: "ABC" like Jira
    description: text("description"),

    // Project deadline (added to align with TODO)
    dueDate: timestamp("due_date", { withTimezone: true }),

    createdById: uuid("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    archived: boolean("archived").notNull().default(false),
  },
  (t) => ({
    workspaceIdx: index("projects_workspace_id_idx").on(t.workspaceId),
    keyPerWorkspaceUnique: uniqueIndex("projects_workspace_key_unique").on(t.workspaceId, t.key),
  }),
);

// Project membership is what you enforce for RBAC in Phase 6.4
export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: projectRoleEnum("role").notNull().default("member"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.userId] }),
    projIdx: index("project_members_project_id_idx").on(t.projectId),
    userIdx: index("project_members_user_id_idx").on(t.userId),
    roleIdx: index("project_members_role_idx").on(t.role),
  }),
);

export const projectInvitations = pgTable(
  "project_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    clerkOrgId: text("clerk_org_id").notNull(),
    email: text("email").notNull(),
    role: projectRoleEnum("role").notNull().default("member"),
    workspaceRoleKey: text("workspace_role_key").notNull().default("org:member"),
    clerkInvitationId: text("clerk_invitation_id"),
    status: projectInvitationStatusEnum("status").notNull().default("pending"),
    invitedById: uuid("invited_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => ({
    projectIdx: index("project_invitations_project_id_idx").on(t.projectId),
    emailIdx: index("project_invitations_email_idx").on(t.email),
    clerkOrgIdx: index("project_invitations_clerk_org_id_idx").on(t.clerkOrgId),
    statusIdx: index("project_invitations_status_idx").on(t.status),
  }),
);

// --------------------
// Lists / Columns (Kanban lanes inside a project)
// --------------------
export const lists = pgTable(
  "lists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    position: integer("position").notNull().default(0), // for ordering columns
    category: listCategoryEnum("category").notNull().default("todo"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    archived: boolean("archived").notNull().default(false),
  },
  (t) => ({
    projectIdx: index("lists_project_id_idx").on(t.projectId),
    projectPositionIdx: index("lists_project_position_idx").on(t.projectId, t.position),
  }),
);

// --------------------
// Tasks (Issues)
// --------------------
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    listId: uuid("list_id").references(() => lists.id, {
      onDelete: "set null",
    }),

    // For kanban ordering within a list
    position: integer("position").notNull().default(0),

    title: text("title").notNull(),
    description: text("description"),

    status: taskStatusEnum("status").notNull().default("open"),
    priority: taskPriorityEnum("priority").notNull().default("none"),

    // Assignment/collaboration
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),

    reporterId: uuid("reporter_id").references(() => users.id, {
      onDelete: "set null",
    }),

    dueDate: timestamp("due_date", { withTimezone: true }),
    startDate: timestamp("start_date", { withTimezone: true }),

    archived: boolean("archived").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectIdx: index("tasks_project_id_idx").on(t.projectId),
    listIdx: index("tasks_list_id_idx").on(t.listId),
    assigneeIdx: index("tasks_assignee_id_idx").on(t.assigneeId),
    statusIdx: index("tasks_status_idx").on(t.status),
    priorityIdx: index("tasks_priority_idx").on(t.priority),
    listPositionIdx: index("tasks_list_position_idx").on(t.listId, t.position),
  }),
);

// Optional: multi-assignee / collaborators (if you want more than one assignee)
// If you only want a single assignee, you can skip this.
export const taskCollaborators = pgTable(
  "task_collaborators",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.userId] }),
    taskIdx: index("task_collaborators_task_id_idx").on(t.taskId),
    userIdx: index("task_collaborators_user_id_idx").on(t.userId),
  }),
);

// --------------------
// Labels (project-scoped) + Task Labels (many-to-many)
// --------------------
export const labels = pgTable(
  "labels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    // UI color can be stored as string (e.g., "#AABBCC") if you want.
    color: text("color"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    projectIdx: index("labels_project_id_idx").on(t.projectId),
    uniqPerProject: uniqueIndex("labels_project_name_unique").on(t.projectId, t.name),
  }),
);

export const taskLabels = pgTable(
  "task_labels",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => labels.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.taskId, t.labelId] }),
    taskIdx: index("task_labels_task_id_idx").on(t.taskId),
    labelIdx: index("task_labels_label_id_idx").on(t.labelId),
  }),
);

// --------------------
// Comments
// --------------------
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // renamed from `body` -> `content` to align with TODO naming
    content: text("content").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),

    deleted: boolean("deleted").notNull().default(false),
  },
  (t) => ({
    taskIdx: index("comments_task_id_idx").on(t.taskId),
    authorIdx: index("comments_author_id_idx").on(t.authorId),
    createdIdx: index("comments_task_created_idx").on(t.taskId, t.createdAt),
  }),
);

// --------------------
// Activity History (audit log / timeline)
// --------------------
export const activity = pgTable(
  "activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    taskId: uuid("task_id").references(() => tasks.id, {
      onDelete: "cascade",
    }),

    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),

    action: activityActionEnum("action").notNull(),

    // Store what changed; keep flexible.
    // Example: { field: "status", from: "open", to: "in_progress" }
    meta: jsonb("meta").notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    wsIdx: index("activity_workspace_id_idx").on(t.workspaceId),
    projectIdx: index("activity_project_id_idx").on(t.projectId),
    taskIdx: index("activity_task_id_idx").on(t.taskId),
    actorIdx: index("activity_actor_id_idx").on(t.actorId),
    createdIdx: index("activity_created_at_idx").on(t.createdAt),
  }),
);

// --------------------
// Attachments (optional; store metadata for uploads)
// --------------------
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    uploaderId: uuid("uploader_id").references(() => users.id, {
      onDelete: "set null",
    }),

    fileName: text("file_name").notNull(),
    fileType: text("file_type"),
    fileSize: integer("file_size"), // bytes
    url: text("url").notNull(), // where the file lives (S3/R2/etc)

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    taskIdx: index("attachments_task_id_idx").on(t.taskId),
    uploaderIdx: index("attachments_uploader_id_idx").on(t.uploaderId),
  }),
);

// --------------------
// Helpful notes (not code):
// --------------------
//
// 1) Enforce that a user must be a workspace member to access workspace projects.
//    Then enforce project permissions via projectMembers.role.
//
// 2) Your Team page in the screenshot comes from workspaceMembers.
//    The “X projects” number can be computed as a COUNT(project_members) joined through projects.workspace_id.
//
// 3) Option A invites: "Invite member" should only add users that already exist in `users`.
//    If later you want invite-by-email for non-users, add a workspace_invitations table.
//
// 4) Assignee must be a project member: enforce in API (app-layer).
