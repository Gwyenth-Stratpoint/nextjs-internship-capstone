import { z } from "zod";

import { requireDbUserId } from "@/lib/auth";
import { listReorderSchema } from "@/lib/validations";
import { reorderProjectLists } from "@/lib/server/list-crud";

export async function PATCH(request: Request) {
  try {
    const userId = await requireDbUserId();
    const json = await request.json();
    const payload = listReorderSchema.parse(json);
    const data = await reorderProjectLists(userId, payload);
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
      (error.message === "Forbidden" || error.message === "OrderMismatch")
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message:
              error.message === "OrderMismatch"
                ? "List order does not match project lists"
                : "Forbidden",
          },
        },
        { status: 403 },
      );
    }

    console.error("PATCH /api/lists/reorder failed:", error);
    return Response.json(
      {
        success: false,
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to reorder lists" },
      },
      { status: 500 },
    );
  }
}
