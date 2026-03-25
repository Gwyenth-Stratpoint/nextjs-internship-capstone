import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Bell, Building2, Palette, Shield, User, Users } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardInset,
  CardTitle,
} from "@/components/ui/card";
import { getActiveClerkOrgId, requireDbUserId } from "@/lib/auth";
import { listAccessibleProjects } from "@/lib/server/project-crud";
import { getOrganizationTeamSnapshot } from "@/lib/server/team-crud";

function formatWorkspaceRole(value: string | null | undefined) {
  if (!value) {
    return "No active workspace";
  }

  return value.replace("org:", "").replace("_", " ");
}

export default async function SettingsPage() {
  const user = await currentUser();
  const { orgRole } = await auth();
  const clerkOrgId = await getActiveClerkOrgId();
  const dbUserId = await requireDbUserId();

  const [teamSnapshot, accessibleProjects] = clerkOrgId
    ? await Promise.all([
        getOrganizationTeamSnapshot(clerkOrgId),
        listAccessibleProjects(dbUserId, clerkOrgId),
      ])
    : [null, []];

  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Workspace user";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "No email available";
  const activeProjectCount = accessibleProjects.filter((project) => !project.archived).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Review your account, workspace access, and personal preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card variant="panel">
          <CardHeader>
            <CardTitle>Account Snapshot</CardTitle>
            <CardDescription>
              Live profile details from Clerk and your current workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <CardInset className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Signed in as</p>
                  <p className="font-semibold text-foreground">{fullName}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>{email}</p>
                <p>Clerk user id: {user?.id ?? "Unavailable"}</p>
              </div>
            </CardInset>

            <CardInset className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active workspace</p>
                  <p className="font-semibold text-foreground">
                    {teamSnapshot?.workspace.organizationName ?? "No workspace selected"}
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-sm text-slate-600">
                <p>Role: {formatWorkspaceRole(orgRole)}</p>
                <p>Active projects: {activeProjectCount}</p>
                <p>Pending invites: {teamSnapshot?.invitations.length ?? 0}</p>
              </div>
            </CardInset>
          </CardContent>
        </Card>

        <Card variant="panel">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Personal UI preferences for your current browser session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardInset className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Palette size={16} className="text-primary" />
                  Theme
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Toggle between light and dark modes without leaving the dashboard.
                </p>
              </div>
              <ThemeToggle />
            </CardInset>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card variant="panel">
          <CardHeader>
            <CardTitle>Workspace Access</CardTitle>
          </CardHeader>
          <CardContent>
            <CardInset className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users size={16} className="text-primary" />
                Team visibility
              </div>
              <p className="text-sm text-muted-foreground">
                {teamSnapshot
                  ? `${teamSnapshot.members.length} workspace members can collaborate in this organization.`
                  : "Select a workspace to review team membership."}
              </p>
              <Link href="/team" className="text-sm font-medium text-primary hover:underline">
                Manage members
              </Link>
            </CardInset>
          </CardContent>
        </Card>

        <Card variant="panel">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <CardInset className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Bell size={16} className="text-primary" />
                Current behavior
              </div>
              <p className="text-sm text-muted-foreground">
                Workspace invites are sent through Clerk. Project history and task activity stay
                visible inside the app.
              </p>
              <Link href="/analytics" className="text-sm font-medium text-primary hover:underline">
                Review live analytics
              </Link>
            </CardInset>
          </CardContent>
        </Card>

        <Card variant="panel">
          <CardHeader>
            <CardTitle>Security and Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <CardInset className="space-y-3 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Shield size={16} className="text-primary" />
                Activity logging
              </div>
              <p className="text-sm text-muted-foreground">
                Task changes, list changes, comments, invites, and project member updates are all
                captured in the audit trail.
              </p>
              {accessibleProjects[0] ? (
                <Link
                  href={`/projects/${accessibleProjects[0].id}/history`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open a project history feed
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Create a project to view history.
                </span>
              )}
            </CardInset>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
