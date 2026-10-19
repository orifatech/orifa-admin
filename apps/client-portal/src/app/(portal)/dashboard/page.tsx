"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@orifa/backend";
import {
  Globe,
  Clock,
  Mail,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Calendar,
} from "lucide-react";

export default function ClientDashboardPage() {
  const viewer = useQuery(api.users.viewer);
  const projects = useQuery(api.projects.list, {}) || [];
  const orgId = viewer?.organizationId;
  const domains = useQuery(api.domains.list, orgId ? { organizationId: orgId } : {}) || [];
  const emailLicenses = useQuery(api.emailLicenses.list, orgId ? { organizationId: orgId } : {}) || [];
  const subscriptions = useQuery(api.subscriptions.list, orgId ? { organizationId: orgId } : {}) || [];

  const activeSubscription = subscriptions.find((s) => s.status === "active");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wide uppercase text-indigo-200 mb-4 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
            {activeSubscription ? "Active Maintenance Contract" : "Self-Managed Plan"}
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {viewer?.name?.split(" ")[0] || "Client"}
          </h1>
          <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
            Monitor your domain health, manage work email licenses, view monthly performance metrics, and edit website copy in place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              <Zap className="w-4 h-4 text-indigo-600" />
              Launch Visual Editor
            </Link>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-indigo-200" />
              View Invoices & Billing
            </Link>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-violet-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Sites count */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Connected Sites
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
              {projects.length}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Live & Monitored
            </span>
          </div>
        </div>

        {/* Health Score */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              App Health Score
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">99.8%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Uptime (30d)
            </span>
          </div>
        </div>

        {/* Domains Tracked */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Domains Monitored
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
              {domains.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Auto-expiry check
            </span>
          </div>
        </div>

        {/* Work Emails */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Work Email Accounts
            </span>
            <div className="h-8 w-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-white">
              {emailLicenses.length}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Active licenses
            </span>
          </div>
        </div>
      </div>

      {/* Expiration Countdown & Renewal Warning Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Expiry Watchlist */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-500" />
                Domain Expiration Monitors
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Live Status</span>
            </div>

            {domains.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700">
                <Globe className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No domains registered yet</p>
                <p className="text-xs text-zinc-500 mt-1">Orifa Technologies will configure your domain tracking upon deployment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {domains.map((dom) => {
                  const days = dom.daysRemaining;
                  const isExpiringSoon = days <= 30;
                  return (
                    <div
                      key={dom._id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            isExpiringSoon
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isExpiringSoon ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {dom.domainName}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            <span>Registrar: {dom.registrar || "Configured"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dom.expiresAt ? new Date(dom.expiresAt).toLocaleDateString() : "Auto-renew"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            days <= 14
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : days <= 30
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {days > 0 ? `${days} days left` : "Expired"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Work Email Licenses Watchlist */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-violet-500" />
                Work Email Expirations
              </h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">License Monitor</span>
            </div>

            {emailLicenses.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700">
                <Mail className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No work email licenses configured</p>
                <p className="text-xs text-zinc-500 mt-1">Google Workspace and Microsoft 365 monitors can be added via Orifa support.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {emailLicenses.map((lic) => {
                  const days = lic.daysToRenewal;
                  return (
                    <div
                      key={lic._id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {lic.provider || "Work Email"} ({lic.seatCount || 1} Seats)
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Renews on {lic.renewalDate ? new Date(lic.renewalDate).toLocaleDateString() : "Annually"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            days <= 14
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                              : days <= 30
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400"
                              : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {days}d remaining
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connected Applications & Visual Editor Entry Point */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Your Managed Websites</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select a website to launch the in-place visual content editor.
            </p>
          </div>
          <Link
            href="/editor"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
          >
            Open Editor <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700">
            <Globe className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No websites connected</p>
            <p className="text-xs text-zinc-500 mt-1">Your assigned websites will show up here once configured by the Orifa team.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <div
                key={proj._id}
                className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Live
                    </span>
                    <span className="text-xs text-zinc-400">Git Synced</span>
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                    {proj.productionUrl || "https://example.com"}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Branch: {proj.githubDefaultBranch || "main"}</span>
                  <Link
                    href={`/editor?project=${proj._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors"
                  >
                    Edit Content
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
