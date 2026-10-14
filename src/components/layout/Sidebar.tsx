"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  GitPullRequest,
  Image as ImageIcon,
  FileText,
  Clock,
  CreditCard,
  Mail,
  KeyRound,
  Building2,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

const navigationItems = [
  { section: "Websites & Content" },
  { name: "Projects & Sites", href: "/projects", icon: Globe },
  { name: "Staged Changes", href: "/changes", icon: GitPullRequest },
  { name: "Media Assets", href: "/media", icon: ImageIcon },
  { name: "Blog Studio", href: "/blog", icon: FileText },
  { section: "Agency Operations" },
  { name: "Domain Monitors", href: "/domains", icon: Clock },
  { name: "Retainers & Billing", href: "/billing", icon: CreditCard },
  { name: "Email Licenses", href: "/licenses", icon: Mail },
  { name: "Encrypted Vault", href: "/vault", icon: KeyRound },
  { name: "Organizations", href: "/organizations", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-900/70 backdrop-blur-md flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <Link href="/projects" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            O
          </div>
          <div>
            <span className="font-semibold text-zinc-100 tracking-tight text-sm">
              Orifa Admin
            </span>
            <div className="text-[11px] text-zinc-400">Web Platform Hub</div>
          </div>
        </Link>
      </div>

      {/* Organization Context */}
      <div className="px-3 py-2.5 border-b border-zinc-800/60">
        <div className="flex items-center justify-between px-2 py-1 text-xs text-zinc-400">
          <span>Active Context</span>
          <span className="text-[10px] uppercase font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/40 px-1.5 py-0.5 rounded">
            {viewer?.role?.replace("_", " ") || "Agency Super Admin"}
          </span>
        </div>
        <div className="mt-1 px-2 py-1.5 bg-zinc-800/50 rounded-md border border-zinc-700/50 flex items-center justify-between text-xs text-zinc-200">
          <span className="truncate font-medium">
            {viewer?.organization?.name || "All Client Workspaces"}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigationItems.map((item, idx) => {
          if ("section" in item && item.section) {
            return (
              <div
                key={idx}
                className="pt-4 pb-1 px-2 text-[10px] uppercase font-bold tracking-wider text-zinc-400"
              >
                {item.section}
              </div>
            );
          }

          if (!item.href || !item.icon) return null;
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-zinc-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between gap-2 p-1.5 rounded-md">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
              {viewer?.email ? viewer.email[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-zinc-200 truncate">
                {viewer?.name || viewer?.email || "Admin"}
              </div>
              <div className="text-[10px] text-zinc-400 truncate">
                {viewer?.email || "admin@orifatech.com"}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
