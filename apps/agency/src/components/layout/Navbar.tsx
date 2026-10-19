"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Realtime overview of client platforms, domain alerts & retainers",
  },
  "/organizations": {
    title: "Organizations",
    subtitle: "Manage client tenancies, custom branding & invitation tokens",
  },
  "/projects": {
    title: "Projects & Sites",
    subtitle: "Monitored web properties and visual CMS deployments",
  },
  "/domains": {
    title: "Domain Monitors",
    subtitle: "Automated WHOIS expiration tracking and DNS health checks",
  },
  "/billing": {
    title: "Retainers & Billing",
    subtitle: "Client maintenance contracts, monthly recurring revenue & renewals",
  },
  "/licenses": {
    title: "Email Licenses",
    subtitle: "Google Workspace & Microsoft 365 seat quotas and renewal cycles",
  },
  "/changes": {
    title: "Staged Changes",
    subtitle: "Client visual edits pending pull request approval or deployment",
  },
  "/media": {
    title: "Media Assets",
    subtitle: "Centralized client media uploads and brand graphic assets",
  },
  "/blog": {
    title: "Blog Studio",
    subtitle: "Content publishing workflows and scheduled articles",
  },
  "/vault": {
    title: "Encrypted Vault",
    subtitle: "Zero-knowledge encrypted client DNS, API & registrar credentials",
  },
  "/audit-logs": {
    title: "Audit & Security Logs",
    subtitle: "Immutable security trail and tenant access events",
  },
};

export function Navbar() {
  const pathname = usePathname();
  const viewer = useQuery(api.users.viewer);

  let current = routeMeta[pathname];
  if (!current) {
    const matchedKey = Object.keys(routeMeta).find((k) => pathname.startsWith(`${k}/`));
    if (matchedKey) {
      current = routeMeta[matchedKey];
    } else {
      current = {
        title: "Agency Portal",
        subtitle: "Orifa Technologies administrative management workspace",
      };
    }
  }

  const userInitial = viewer?.name
    ? viewer.name[0].toUpperCase()
    : viewer?.email
    ? viewer.email[0].toUpperCase()
    : "A";

  const displayName = viewer?.name || viewer?.email || "Agency Admin";

  return (
    <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10 transition-colors">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
          {current.title}
        </h1>
        <p className="text-[11px] text-gray-500 hidden sm:block">
          {current.subtitle}
        </p>
      </div>

      {/* Right Controls: Realtime pulse, Theme toggle, Avatar & Role */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Realtime Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Realtime metrics active</span>
        </div>

        <ThemeToggle />

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-[#006e2b] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
            {userInitial}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[130px]">
              {displayName}
            </div>
            <div className="mt-0.5">
              <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                {viewer?.role === "super_admin" ? "Super Admin" : "Agency Staff"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
