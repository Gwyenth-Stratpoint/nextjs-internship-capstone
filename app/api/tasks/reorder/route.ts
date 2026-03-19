import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { taskReorderSchema } from "@/lib/validations";
import { reorderProjectTasks } from "@/lib/server/task-crud";

export async function PATCH(request: Request) {
  try {
    const userId = await requireDbUserId();
    const json = await request.json();
    const payload = taskReorderSchema.parse(json);
    const data = await reorderProjectTasks(userId, payload);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: error.issues[0]?.message ?? "Invalid reorder payload",
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    if (
      error instanceof Error &&
      (error.message === "Forbidden" ||
        error.message === "OrderMismatch" ||
        error.message === "InvalidList")
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.message === "Forbidden" ? "FORBIDDEN" : "BAD_REQUEST",
            message:
              error.message === "OrderMismatch"
                ? "Task order does not match list tasks"
                : error.message === "InvalidList"
                  ? "Task list does not belong to this project"
                  : "Forbidden",
          },
        },
        { status: error.message === "Forbidden" ? 403 : 400 },
      );
    }

    console.error("PATCH /api/tasks/reorder failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to reorder tasks" },
      },
      { status: 500 },
    );
  }
}
