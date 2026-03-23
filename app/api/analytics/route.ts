import { z } from "zod";

import { requireActiveClerkOrgId, requireDbUserId } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/server/analytics-crud";

const searchParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id").optional(),
});

export async function GET(request: Request) {
  try {
    const userId = await requireDbUserId();
    const clerkOrgId = await requireActiveClerkOrgId();
    const { searchParams } = new URL(request.url);
    const { projectId } = searchParamsSchema.parse({
      projectId: searchParams.get("projectId") ?? undefined,
    });

    const data = await getAnalyticsOverview(userId, clerkOrgId, {
      projectId: projectId ?? null,
    });

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid analytics query" } },
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
        {
          success: false,
          error: { code: "ORGANIZATION_REQUIRED", message: "Select a workspace first" },
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "NotFound") {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 },
      );
    }

    console.error("GET /api/analytics failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch analytics" },
      },
      { status: 500 },
    );
  }
}
