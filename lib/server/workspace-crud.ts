import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { projects, workspaces } from "@/lib/db/schema";

function slugifyWorkspaceName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

async function findUniqueWorkspaceSlug(baseSlug: string) {
  let candidate = baseSlug || "workspace";
  let counter = 1;

  while (true) {
    const [existingWorkspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, candidate))
      .limit(1);

    if (!existingWorkspace) {
      return candidate;
    }

    counter += 1;
    candidate = `${baseSlug || "workspace"}-${counter}`;
  }
}

type ClerkOrganizationLike = {
  id: string;
  name: string;
  slug?: string | null;
};

export async function getWorkspaceByClerkOrgId(clerkOrgId: string) {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.clerkOrgId, clerkOrgId))
    .limit(1);

  return workspace ?? null;
}

export async function createWorkspaceForClerkOrg(input: {
  clerkOrgId: string;
  name: string;
  slug?: string | null;
  createdById?: string | null;
}) {
  const preferredSlug = input.slug ? slugifyWorkspaceName(input.slug) : slugifyWorkspaceName(input.name);
  const slug = await findUniqueWorkspaceSlug(preferredSlug);

  const [workspace] = await db
    .insert(workspaces)
    .values({
      name: input.name,
      slug,
      clerkOrgId: input.clerkOrgId,
      createdById: input.createdById ?? null,
    })
    .returning();

  if (!workspace) {
    throw new Error("Failed to create workspace");
  }

  return workspace;
}

export async function syncWorkspaceFromClerkOrganization(
  organization: ClerkOrganizationLike,
  createdById?: string | null,
) {
  const existingWorkspace = await getWorkspaceByClerkOrgId(organization.id);

  if (existingWorkspace) {
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({
        name: organization.name,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, existingWorkspace.id))
      .returning();

    return updatedWorkspace ?? existingWorkspace;
  }

  return createWorkspaceForClerkOrg({
    clerkOrgId: organization.id,
    name: organization.name,
    slug: organization.slug ?? null,
    createdById: createdById ?? null,
  });
}

export async function requireWorkspaceForClerkOrg(clerkOrgId: string, createdById?: string | null) {
  const existingWorkspace = await getWorkspaceByClerkOrgId(clerkOrgId);

  if (existingWorkspace) {
    return existingWorkspace;
  }

  const client = (await clerkClient()) as any;
  const organization = (await client.organizations.getOrganization({
    organizationId: clerkOrgId,
  })) as ClerkOrganizationLike | null;

  if (!organization) {
    throw new Error("OrganizationNotFound");
  }

  return syncWorkspaceFromClerkOrganization(organization, createdById);
}

export async function getWorkspaceProjectCounts(workspaceId: string) {
  const rows = await db
    .select({
      userId: projects.createdById,
    })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));

  return rows;
}
