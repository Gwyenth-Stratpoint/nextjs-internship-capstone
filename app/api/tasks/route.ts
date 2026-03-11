import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { taskSchema } from "@/lib/validations";
import { createProjectTask, listProjectTasks } from "@/lib/server/task-crud";

const searchParamsSchema = z.object({
  projectId: z.string().uuid("Invalid project id"),
});

export async function GET(request: Request) {
  try {
    const userId = await requireDbUserId();
    const { searchParams } = new URL(request.url);
    const { projectId } = searchParamsSchema.parse({
      projectId: searchParams.get("projectId"),
    });
    const data = await listProjectTasks(projectId, userId);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid task query" } },
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

    console.error("GET /api/tasks failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch tasks" },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireDbUserId();
    const json = await request.json();
    const payload = taskSchema.parse(json);
    const data = await createProjectTask(userId, payload);
    return Response.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: error.issues[0]?.message ?? "Invalid task payload" } },
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

    console.error("POST /api/tasks failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create task" },
      },
      { status: 500 },
    );
  }
}
