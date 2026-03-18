"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "./theme-provider";
import {
  Home,
  FolderOpen,
  Users,
  Settings,
  Moon,
  Sun,
  Menu,
  X,
  BarChart3,
  Bell,
  Calendar,
  Search,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { DashboardOrgChip } from "@/components/dashboard-org-chip";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Team", href: "/team", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <div className="glass-page relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_#f8f3ff_0%,_#f4f6ff_46%,_#eef4ff_100%)]" />
        <div className="absolute left-[-10rem] top-[-9rem] h-[26rem] w-[26rem] rounded-full bg-[#bba7ff]/50 blur-[130px]" />
        <div className="absolute left-[34%] top-[-8rem] h-[20rem] w-[24rem] rounded-full bg-[#ffc4dc]/42 blur-[130px]" />
        <div className="absolute right-[-8rem] top-[-7rem] h-[24rem] w-[24rem] rounded-full bg-[#ffd7a8]/46 blur-[130px]" />
        <div className="absolute bottom-[6%] left-[16%] h-[18rem] w-[20rem] rounded-full bg-[#c8e7ff]/34 blur-[130px]" />
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`glass-shell fixed inset-y-3 left-3 z-50 w-64 rounded-[28px] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/50">
          <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
            Kilos
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="glass-card lg:hidden p-2 rounded-xl text-foreground/80 hover:bg-white/80"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-foreground/80 hover:bg-white/65 transition-colors"
                >
                  <item.icon className="mr-3" size={20} />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="relative lg:pl-[17.5rem]">
        {/* Top bar */}
        <div className="sticky top-0 z-30 px-4 pt-3 sm:px-6 lg:px-8">
          <div className="glass-shell flex h-16 items-center gap-x-4 rounded-[24px] px-4 sm:gap-x-6 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="glass-card lg:hidden p-2 rounded-xl hover:bg-white/80"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              {/* Search bar */}
              <div className="flex flex-1 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search projects, tasks..."
                    className="glass-card w-full pl-10 pr-4 py-2 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Right-side actions */}
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <DashboardOrgChip />

                <button
                  className="glass-card p-2 rounded-xl hover:bg-white/80"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </button>

                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="glass-card p-2 rounded-xl text-foreground transition-colors hover:bg-white/80"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="min-h-[calc(100vh-7rem)] p-2 sm:p-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
