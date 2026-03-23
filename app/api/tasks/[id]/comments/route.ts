import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { listTaskActivity, listTaskComments } from "@/lib/server/comment-crud";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid task id"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireDbUserId();
    const { id } = paramsSchema.parse(await context.params);
    const [comments, activityItems] = await Promise.all([
      listTaskComments(id, userId),
      listTaskActivity(id, userId),
    ]);

    return Response.json({ success: true, data: { comments, activityItems } }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid task id" } },
        { status: 400 },
      );
    }

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

    if (error instanceof Error && error.message === "NotFound") {
      return Response.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
        { status: 404 },
      );
    }

    console.error("GET /api/tasks/[id]/comments failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch task discussion" },
      },
      { status: 500 },
    );
  }
}
