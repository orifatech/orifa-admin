"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LogOut, ShieldCheck, ChevronRight } from "lucide-react";

const routeTitles: Record<string, { title: string; section: string }> = {
  "/projects": { title: "Projects & Sites", section: "Websites & Content" },
  "/changes": { title: "Staged Changes", section: "Websites & Content" },
  "/media": { title: "Media Assets", section: "Websites & Content" },
  "/blog": { title: "Blog Studio", section: "Websites & Content" },
  "/domains": { title: "Domain Monitors", section: "Agency Operations" },
  "/billing": { title: "Retainers & Billing", section: "Agency Operations" },
  "/licenses": { title: "Email Licenses", section: "Agency Operations" },
  "/vault": { title: "Encrypted Vault", section: "Agency Operations" },
  "/organizations": { title: "Organizations", section: "Agency Operations" },
};

export function Navbar() {
  const pathname = usePathname();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();

  // Determine current page title
  let currentMeta = routeTitles[pathname];
  if (!currentMeta) {
    // Check prefix
    const matchedKey = Object.keys(routeTitles).find((key) => pathname.startsWith(`${key}/`));
    if (matchedKey) {
      currentMeta = routeTitles[matchedKey];
    } else {
      currentMeta = { title: "Dashboard", section: "Agency Hub" };
    }
  }

  const userInitial = viewer?.name ? viewer.name[0].toUpperCase() : viewer?.email ? viewer.email[0].toUpperCase() : "A";

  return (
    <header className="sticky top-0 z-30 h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between transition-colors">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium">
          {currentMeta.section}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-600" />
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
          {currentMeta.title}
        </span>
      </div>

      {/* Right: Actions, Theme Switcher & User Profile */}
      <div className="flex items-center gap-3">
        {/* Live Cloud Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Cloud</span>
        </div>

        {/* Mode Switcher */}
        <ThemeToggle />

        {/* User Pill & Signout */}
        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {userInitial}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[120px]">
                {viewer?.name || "Elero O"}
              </div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-0.5">
                <ShieldCheck className="h-3 w-3 text-blue-500" />
                <span>Super Admin</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
