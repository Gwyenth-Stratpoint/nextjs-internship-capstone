import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { listAssignableProjectMembers } from "@/lib/server/project-assignees-crud";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid project id"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireDbUserId();
    const { id } = paramsSchema.parse(await context.params);
    const data = await listAssignableProjectMembers(id, userId);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid project id" } },
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

    console.error("GET /api/projects/[id]/assignees failed:", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch assignable project members",
        },
      },
      { status: 500 },
    );
  }
}
