"use client";

import Link from "next/link";
import { Building2, ChevronsUpDown } from "lucide-react";
import { useOrganization } from "@clerk/nextjs";

export function DashboardOrgChip() {
  const { organization, isLoaded } = useOrganization();

  return (
    <Link
      href="/organization"
      className="glass-card hidden items-center gap-3 rounded-xl px-3 py-2 text-sm text-foreground/80 transition hover:bg-white/80 md:flex"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Building2 size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</span>
        <span className="block max-w-[11rem] truncate font-medium text-foreground">
          {isLoaded ? organization?.name ?? "Select workspace" : "Loading workspace"}
        </span>
      </span>
      <ChevronsUpDown size={16} className="text-muted-foreground" />
    </Link>
  );
}
