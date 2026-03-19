"use server";

import { z } from "zod";

import { requireActiveClerkOrgId, requireDbUserId } from "@/lib/auth";
import {
  createOwnedProject,
  deleteOwnedProject,
  updateOwnedProject,
} from "@/lib/server/project-crud";

const createProjectInputSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name too long"),
  description: z.string().max(500, "Description too long").nullable().optional(),
  key: z
    .string()
    .max(10, "Key too long")
    .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters/numbers")
    .nullable()
    .optional(),
  dueDate: z.coerce.date().nullable().optional(),
  template: z.enum(["simple", "software"]).optional(),
});

const updateProjectInputSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    key: z
      .string()
      .max(10)
      .regex(/^[A-Z0-9]+$/, "Key must be uppercase letters/numbers")
      .nullable()
      .optional(),
    dueDate: z.coerce.date().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "No fields to update" });

const projectIdSchema = z.string().uuid("Invalid project id");

export async function createProjectAction(input: z.input<typeof createProjectInputSchema>) {
  const userId = await requireDbUserId();
  const orgId = await requireActiveClerkOrgId();
  const payload = createProjectInputSchema.parse(input);
  return createOwnedProject(userId, orgId, payload);
}

export async function updateProjectAction(
  projectId: string,
  input: z.input<typeof updateProjectInputSchema>,
) {
  const userId = await requireDbUserId();
  const orgId = await requireActiveClerkOrgId();
  const id = projectIdSchema.parse(projectId);
  const payload = updateProjectInputSchema.parse(input);
  return updateOwnedProject(id, userId, orgId, payload);
}

export async function deleteProjectAction(projectId: string) {
  const userId = await requireDbUserId();
  const orgId = await requireActiveClerkOrgId();
  const id = projectIdSchema.parse(projectId);
  return deleteOwnedProject(id, userId, orgId);
}
