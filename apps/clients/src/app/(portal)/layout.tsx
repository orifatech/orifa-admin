"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@orifa/backend";
import { useAuthActions } from "@convex-dev/auth/react";
import { ThemeToggle } from "@orifa/ui";
import {
  BarChart3,
  Globe,
  GitPullRequest,
  CreditCard,
  Image as ImageIcon,
  LogOut,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

interface PortalLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Visual Editor", href: "/editor", icon: Globe },
  { name: "Staged Changes", href: "/changes", icon: GitPullRequest },
  { name: "Media Assets", href: "/media", icon: ImageIcon },
  { name: "Billing & Retainers", href: "/billing", icon: CreditCard },
];

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Client Dashboard",
    subtitle: "Realtime health, domain reminders, email licenses and website updates",
  },
  "/editor": {
    title: "Visual Editor",
    subtitle: "Direct on-page website copy and media editing with instant preview",
  },
  "/changes": {
    title: "Staged Changes",
    subtitle: "Review pending text and image edits before GitHub pull request creation",
  },
  "/media": {
    title: "Media Assets",
    subtitle: "Centralized client media uploads and brand graphic assets",
  },
  "/billing": {
    title: "Billing & Retainers",
    subtitle: "Your active maintenance agreement and payment history",
  },
};

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const pathname = usePathname();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();

  // If unauthenticated after loading, redirect to signin
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
          <p className="text-xs text-gray-500">Loading your client portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const organization = viewer?.organization;
  const orgName = organization?.name || "Client Portal";
  const logoUrl = organization?.logoUrl;
  const primaryColor = organization?.primaryColor || "#006e2b";
  const secondaryColor = organization?.secondaryColor || "#16a34a";

  const userInitial = viewer?.name
    ? viewer.name[0].toUpperCase()
    : viewer?.email
    ? viewer.email[0].toUpperCase()
    : "C";

  let currentMeta = routeTitles[pathname];
  if (!currentMeta) {
    const matchedKey = Object.keys(routeTitles).find((k) => pathname.startsWith(`${k}/`));
    currentMeta = matchedKey
      ? routeTitles[matchedKey]
      : { title: "Portal", subtitle: orgName };
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] text-gray-900 font-sans transition-colors">
      {/* 224px White-Labeled Sidebar */}
      <aside className="w-[224px] bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 shadow-xs h-screen sticky top-0 z-40 transition-colors">
        <div>
          {/* Client Logo Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={orgName}
                  className="h-8 max-w-[150px] object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {orgName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-xs text-gray-900 truncate">
                    {orgName}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="py-2.5 px-3 space-y-1">
            <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Client Portal
            </div>
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                    active
                      ? "font-semibold shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                  }`}
                  style={
                    active
                      ? {
                          backgroundColor: `${primaryColor}15`,
                          color: primaryColor,
                        }
                      : {}
                  }
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={{ color: active ? primaryColor : undefined }}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <a
            href="https://orifatech.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
          >
            <Globe className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 transition-colors shrink-0" />
            <span className="flex-1 font-medium truncate">Client Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-700 transition-colors opacity-70 shrink-0" />
          </a>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10 transition-colors">
          <div>
            <h1 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
              {currentMeta.title}
            </h1>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              {currentMeta.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Status Pill with Client Primary Color Accent */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span>Portal Live</span>
            </div>

            <ThemeToggle />

            {/* User Pill */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div
                className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                {userInitial}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-gray-900 leading-tight truncate max-w-[130px]">
                  {viewer?.name || viewer?.email || "Client User"}
                </div>
                <div className="mt-0.5">
                  <span className="inline-block text-[10px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-1.5 py-0.2 rounded">
                    {viewer?.role === "client_admin" ? "Client Admin" : "Content Editor"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
