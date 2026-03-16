import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { listUpdateSchema } from "@/lib/validations";
import { deleteProjectList, updateProjectList } from "@/lib/server/list-crud";

const paramsSchema = z.object({
  id: z.string().uuid("Invalid list id"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireDbUserId();
    const { id } = paramsSchema.parse(await context.params);
    const json = await request.json();
    const payload = listUpdateSchema.parse(json);
    const data = await updateProjectList(id, userId, payload);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: error.issues[0]?.message ?? "Invalid list payload" } },
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
        { success: false, error: { code: "NOT_FOUND", message: "List not found" } },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      (error.message === "A start list already exists for this project" ||
        error.message === "An end list already exists for this project")
    ) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: error.message } },
        { status: 400 },
      );
    }

    console.error("PATCH /api/lists/[id] failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update list" },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireDbUserId();
    const { id } = paramsSchema.parse(await context.params);
    const data = await deleteProjectList(id, userId);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid list id" } },
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
        { success: false, error: { code: "NOT_FOUND", message: "List not found" } },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      (error.message === "The project must keep one start list" ||
        error.message === "The project must keep one end list")
    ) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: error.message } },
        { status: 400 },
      );
    }

    console.error("DELETE /api/lists/[id] failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to delete list" },
      },
      { status: 500 },
    );
  }
}
