"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  Globe,
  Clock,
  CreditCard,
  Mail,
  GitPullRequest,
  Image as ImageIcon,
  FileText,
  KeyRound,
  ShieldAlert,
  LogOut,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

type UserRole = "super_admin" | "client_admin" | "client_editor";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles?: UserRole[];
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  {
    name: "Organizations",
    href: "/organizations",
    icon: Building2,
    allowedRoles: ["super_admin"],
  },
  { name: "Projects & Sites", href: "/projects", icon: Globe },
  {
    name: "Domain Monitors",
    href: "/domains",
    icon: Clock,
    allowedRoles: ["super_admin", "client_admin"],
  },
  {
    name: "Retainers & Billing",
    href: "/billing",
    icon: CreditCard,
    allowedRoles: ["super_admin", "client_admin"],
  },
  {
    name: "Email Licenses",
    href: "/licenses",
    icon: Mail,
    allowedRoles: ["super_admin", "client_admin"],
  },
  { name: "Staged Changes", href: "/changes", icon: GitPullRequest },
  { name: "Media Assets", href: "/media", icon: ImageIcon },
  { name: "Blog Studio", href: "/blog", icon: FileText },
  {
    name: "Encrypted Vault",
    href: "/vault",
    icon: KeyRound,
    allowedRoles: ["super_admin", "client_admin"],
  },
  {
    name: "Audit Log",
    href: "/audit-logs",
    icon: ShieldAlert,
    allowedRoles: ["super_admin", "client_admin"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();

  const userRole = (viewer?.role ?? "client_editor") as UserRole;

  const visibleNavItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.includes(userRole);
  });

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard" || pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-[224px] bg-white border-r border-gray-200/80 flex flex-col justify-between shrink-0 shadow-xs h-screen sticky top-0 z-40 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image
              src="/images/orifa-logo.png"
              alt="Orifa Technologies"
              width={140}
              height={38}
              priority
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="py-2.5 px-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Main Navigation
          </div>
          {visibleNavItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${
                  active
                    ? "bg-emerald-50 text-emerald-800 font-semibold shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active ? "text-emerald-700" : "text-gray-400"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Visit Website & Sign Out */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <a
          href="https://orifatech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 w-full text-left text-xs font-medium text-gray-600 hover:text-emerald-800 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
        >
          <Globe className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 transition-colors shrink-0" />
          <span className="flex-1 font-medium">Visit Website</span>
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
  );
}
