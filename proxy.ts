// TODO: Task 2.2 - Configure authentication middleware for route protection DONE

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk",
]);

const requiresOrganization = createRouteMatcher([
  "/dashboard(.*)",
  "/projects(.*)",
  "/team(.*)",
  "/analytics(.*)",
  "/calendar(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const authState = await auth();

    if (!authState.userId) {
      await auth.protect();
      return;
    }

    if (
      authState.userId &&
      requiresOrganization(req) &&
      !req.nextUrl.pathname.startsWith("/organization") &&
      !authState.orgId
    ) {
      return NextResponse.redirect(new URL("/organization", req.url));
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
