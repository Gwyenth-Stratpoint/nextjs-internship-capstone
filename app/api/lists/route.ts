import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { listSchema } from "@/lib/validations";
import { createProjectList, listProjectLists } from "@/lib/server/list-crud";

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
    const data = await listProjectLists(projectId, userId);
    return Response.json({ success: true, data }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid list query" } },
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

    console.error("GET /api/lists failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch lists" },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireDbUserId();
    const json = await request.json();
    const payload = listSchema.parse(json);
    const data = await createProjectList(userId, payload);
    return Response.json({ success: true, data }, { status: 201 });
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

    console.error("POST /api/lists failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create list" },
      },
      { status: 500 },
    );
  }
}
