"use server";

import { z } from "zod";

import { requireActiveClerkOrgId, requireClerkUserId } from "@/lib/auth";
import { createOrganizationInvitation } from "@/lib/server/team-crud";

const inviteSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.enum(["org:admin", "org:member"]),
});

export async function inviteWorkspaceMemberAction(input: z.input<typeof inviteSchema>) {
  const inviterClerkUserId = await requireClerkUserId();
  const clerkOrgId = await requireActiveClerkOrgId();
  const payload = inviteSchema.parse(input);

  return createOrganizationInvitation({
    clerkOrgId,
    inviterClerkUserId,
    emailAddress: payload.email,
    role: payload.role,
  });
}
