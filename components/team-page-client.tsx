"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  Clock3,
  Mail,
  MoreHorizontal,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

import { InviteMemberModal } from "@/components/modals/invite-member-modal";
import { Card, CardBadge, CardContent, CardInset, CardMetaRow } from "@/components/ui/card";

type TeamSnapshot = {
  workspace: {
    id: string;
    name: string;
    clerkOrgId: string;
    organizationName: string;
  };
  members: Array<{
    id: string;
    userId: string | null;
    role: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    projectCount: number;
    joinedAt: number | string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: number | string | null;
  }>;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  return role.replace(/^org:/, "").replace(/_/g, " ");
}

function formatJoinedDate(value: number | string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatInviteDate(value: number | string | null) {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getRoleTone(role: string) {
  switch (role) {
    case "org:owner":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "org:admin":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

export default function TeamPageClient({ snapshot }: { snapshot: TeamSnapshot }) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const summary = useMemo(
    () => ({
      members: snapshot.members.length,
      activeNow: snapshot.members.length,
      invites: snapshot.invitations.length,
    }),
    [snapshot.invitations.length, snapshot.members.length],
  );

  return (
    <>
      <div className="space-y-5">
        <Card variant="panel">
          <CardContent className="p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div className="min-w-0 space-y-2">
                <CardBadge className="inline-flex items-center gap-1.5 border border-blue-100 bg-blue-50 px-3 py-1 text-blue-700">
                  <Sparkles size={11} />
                  Team management
                </CardBadge>
                <div className="space-y-1">
                  <h1 className="text-[1.65rem] font-semibold tracking-tight text-slate-900">
                    Manage {snapshot.workspace.organizationName}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row xl:justify-self-end xl:self-start">
                <Link
                  href="/organization"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[18px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Workspace settings
                  <ArrowUpRight size={16} />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(true)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[18px] bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <UserPlus size={18} />
                  Invite member
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <CardInset className="rounded-[18px] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Total members
                </p>
                <p className="mt-1 text-[1.45rem] font-semibold text-slate-900">
                  {summary.members}
                </p>
              </CardInset>
              <CardInset className="rounded-[18px] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Active now
                </p>
                <p className="mt-1 text-[1.45rem] font-semibold text-slate-900">
                  {summary.activeNow}
                </p>
              </CardInset>
              <CardInset className="rounded-[18px] px-4 py-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Pending invites
                </p>
                <p className="mt-1 text-[1.45rem] font-semibold text-slate-900">
                  {summary.invites}
                </p>
              </CardInset>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1.7fr,0.78fr]">
          <Card variant="panel">
            <CardContent className="p-5">
              <div className="border-b border-white/60 pb-4">
                <div>
                  <h2 className="text-[1.2rem] font-semibold text-slate-900">Team members</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {snapshot.members.length} member{snapshot.members.length === 1 ? "" : "s"} in
                    this workspace
                  </p>
                </div>
              </div>

              {snapshot.members.length === 0 ? (
                <CardInset
                  as="div"
                  className="mt-4 rounded-[18px] border-dashed px-4 py-8 text-sm text-slate-500"
                >
                  No team members yet.
                </CardInset>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {snapshot.members.map((member) => (
                    <CardInset
                      key={member.id}
                      interactive
                      className="p-4"
                      accentClassName="bg-gradient-to-r from-[#5b6bff] via-[#7b57ff] to-[#9446ff]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="relative">
                          {member.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="h-14 w-14 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5b6bff_0%,#9446ff_100%)] text-xl font-semibold text-white">
                              {getInitials(member.name)}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 inline-flex h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
                        </div>

                        <button
                          type="button"
                          className="rounded-xl p-1 text-muted-foreground transition hover:bg-white/72 hover:text-foreground"
                          aria-label={`More actions for ${member.name}`}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>

                      <div className="mt-3">
                        <h3 className="font-medium text-foreground">{member.name}</h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail size={13} />
                          <span className="truncate">{member.email}</span>
                        </div>
                      </div>

                      <CardMetaRow
                        className="text-sm"
                        left={
                          <span
                            className={`rounded-xl border px-3 py-1.5 text-sm font-medium capitalize ${getRoleTone(member.role)}`}
                          >
                            {formatRole(member.role)}
                          </span>
                        }
                        right={
                          <span className="flex items-center text-muted-foreground">
                            <Calendar size={13} className="mr-1" />
                            {formatJoinedDate(member.joinedAt)}
                          </span>
                        }
                      />
                    </CardInset>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card variant="panel">
              <CardContent className="p-5">
                <div className="mb-4">
                  <h2 className="text-[1.2rem] font-semibold text-slate-900">Pending invites</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {snapshot.invitations.length} invitation
                    {snapshot.invitations.length === 1 ? "" : "s"} waiting for response
                  </p>
                </div>

                {snapshot.invitations.length === 0 ? (
                  <CardInset
                    as="div"
                    className="rounded-[18px] border-dashed px-4 py-8 text-sm text-slate-500"
                  >
                    No pending invites right now.
                  </CardInset>
                ) : (
                  <div className="space-y-3">
                    {snapshot.invitations.map((invite) => (
                      <CardInset
                        key={invite.id}
                        className="rounded-[20px] px-4 py-3"
                        accentClassName="bg-gradient-to-r from-[#f8d36a] via-[#f6b446] to-[#f59e0b]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <Mail size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-slate-900">
                              {invite.email}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Invited as {formatRole(invite.role)}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                                <Clock3 size={14} />
                                {formatInviteDate(invite.createdAt)}
                              </div>
                              <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                                {invite.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardInset>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-blue-200/70 bg-blue-50/80">
              <CardContent className="p-4">
                <p className="text-base font-semibold text-blue-900">
                  Role changes and permissions
                </p>
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Open workspace settings when you need to adjust organization roles or review
                  invitation access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InviteMemberModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </>
  );
}
