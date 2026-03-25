import { requireDbUserId } from "@/lib/auth";
import { listProjectActivity } from "@/lib/server/project-activity-crud";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireDbUserId();
    const { id } = await context.params;
    const data = await listProjectActivity(id, userId);

    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    if (error instanceof Error && error.message === "Forbidden") {
      return Response.json(
        { success: false, error: { code: "FORBIDDEN", message: "Forbidden" } },
        { status: 403 },
      );
    }

    console.error("GET /api/projects/[id]/activity failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch project activity" },
      },
      { status: 500 },
    );
  }
}
