import { requireActiveClerkOrgId, requireDbUserId } from "@/lib/auth";
import { listAccessibleProjects } from "@/lib/server/project-crud";

export async function GET() {
  try {
    const userId = await requireDbUserId();
    const orgId = await requireActiveClerkOrgId();
    const data = await listAccessibleProjects(userId, orgId);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
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

    console.error("GET /api/projects failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch projects" },
      },
      { status: 500 },
    );
  }
}
