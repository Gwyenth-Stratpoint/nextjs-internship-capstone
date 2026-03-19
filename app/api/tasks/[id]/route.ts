import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { taskUpdateSchema } from "@/lib/validations";
import { deleteProjectTask, updateProjectTask } from "@/lib/server/task-crud";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid task id"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireDbUserId();
    const { id } = paramsSchema.parse(await context.params);
    const json = await request.json();
    const payload = taskUpdateSchema.parse(json);
    const data = await updateProjectTask(id, userId, payload);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: error.issues[0]?.message ?? "Invalid task payload",
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

    console.error("PATCH /api/tasks/[id] failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update task" },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireDbUserId();
    const { id } = paramsSchema.parse(await context.params);
    await deleteProjectTask(id, userId);
    return Response.json({ success: true, data: null }, { status: 200 });
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

    console.error("DELETE /api/tasks/[id] failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to delete task" },
      },
      { status: 500 },
    );
  }
}
