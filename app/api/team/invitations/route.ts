import { z } from "zod";

import { requireActiveClerkOrgId, requireClerkUserId } from "@/lib/auth";
import { createOrganizationInvitation } from "@/lib/server/team-crud";

const inviteSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.enum(["org:admin", "org:member"]),
});

export async function POST(request: Request) {
  try {
    const inviterClerkUserId = await requireClerkUserId();
    const clerkOrgId = await requireActiveClerkOrgId();
    const payload = inviteSchema.parse(await request.json());

    const invitation = await createOrganizationInvitation({
      clerkOrgId,
      inviterClerkUserId,
      emailAddress: payload.email,
      role: payload.role,
    });

    return Response.json({ success: true, data: invitation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: error.issues[0]?.message ?? "Invalid invite" } },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "OrganizationRequired") {
      return Response.json(
        { success: false, error: { code: "ORGANIZATION_REQUIRED", message: "Select a workspace first" } },
        { status: 400 },
      );
    }

    console.error("POST /api/team/invitations failed:", error);
    return Response.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to send invite" } },
      { status: 500 },
    );
  }
}
