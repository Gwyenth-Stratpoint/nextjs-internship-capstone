"use server";

import { z } from "zod";

import { requireActiveClerkOrgId, requireClerkUserId, requireDbUserId } from "@/lib/auth";
import { inviteProjectMember } from "@/lib/server/project-members-crud";
import { projectInvitationSchema } from "@/lib/validations";

export async function inviteProjectMemberAction(input: z.input<typeof projectInvitationSchema>) {
  const inviterUserId = await requireDbUserId();
  const inviterClerkUserId = await requireClerkUserId();
  await requireActiveClerkOrgId();
  const payload = projectInvitationSchema.parse(input);

  return inviteProjectMember({
    projectId: payload.projectId,
    inviterUserId,
    inviterClerkUserId,
    email: payload.email,
    role: payload.role,
    workspaceRoleKey: payload.workspaceRoleKey,
  });
}
