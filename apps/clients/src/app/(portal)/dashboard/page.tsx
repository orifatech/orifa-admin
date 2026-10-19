"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@orifa/backend";
import {
  Globe,
  Clock,
  Mail,
  CreditCard,
  ShieldCheck,
  RotateCw,
  GitPullRequest,
  Image as ImageIcon,
  LifeBuoy,
} from "lucide-react";

export default function ClientDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const viewer = useQuery(api.users.viewer);
  const projects = useQuery(api.projects.list, {}) || [];
  const orgId = viewer?.organizationId;
  const domains = useQuery(api.domains.list, orgId ? { organizationId: orgId } : {}) || [];
  const emailLicenses = useQuery(api.emailLicenses.list, orgId ? { organizationId: orgId } : {}) || [];
  const subscriptions = useQuery(api.subscriptions.list, orgId ? { organizationId: orgId } : {}) || [];
  const stagedChanges = useQuery(api.stagedChanges.list, orgId ? { organizationId: orgId } : {}) || [];

  const organization = viewer?.organization;
  const primaryColor = organization?.primaryColor || "#006e2b";
  const activeSubscription = subscriptions.find((s) => s.status === "active");
  const pendingChanges = stagedChanges.filter(
    (c: any) => c.status === "pending_review" || c.status === "draft"
  );

  const nearestDomain = domains.reduce((prev: any, curr: any) => {
    if (!prev) return curr;
    return (curr.daysRemaining ?? 9999) < (prev.daysRemaining ?? 9999) ? curr : prev;
  }, null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Realtime Status Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-xs font-semibold text-gray-800">
            Realtime Monitoring Active
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            • Automated domain WHOIS &amp; work email expiration tracking
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Connected Sites */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Live Sites</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
              }}
            >
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-700">Monitored</span>
              <span>• Visual editor ready</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Domain Expiration */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Domain Renewal</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              {nearestDomain ? (
                nearestDomain.daysRemaining > 0 ? (
                  `${nearestDomain.daysRemaining}d`
                ) : (
                  "Renew Now"
                )
              ) : (
                "Healthy"
              )}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {nearestDomain ? `${nearestDomain.domain}` : "No active domain alerts"}
            </div>
          </div>
        </div>

        {/* Metric 3: Email Licenses */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Email Licenses</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              {emailLicenses.reduce((acc: number, l: any) => acc + (l.seatCount || 0), 0)}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              <span className="text-purple-700 font-semibold">{emailLicenses.length}</span> domains provisioned
            </div>
          </div>
        </div>

        {/* Metric 4: Maintenance Status */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Service Plan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-gray-900 truncate">
              {activeSubscription ? activeSubscription.planName.toUpperCase() : "MANAGED"}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              <span className="text-emerald-700 font-semibold">Active</span> with Orifa Technologies
            </div>
          </div>
        </div>
      </div>

      {/* 3:1 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (Span 3): Expiration Schedule Table */}
        <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Domain &amp; Email Expiration Schedule
              </h2>
              <p className="text-[11px] text-gray-500">
                Automated reminders ensure your brand domain and email never lapse
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Monitored Service</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Time Remaining</th>
                  <th className="py-3 px-4">Renewal Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {domains.length === 0 && emailLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No domains or email licenses monitored yet. Contact Orifa Technologies to link your domain.
                    </td>
                  </tr>
                ) : (
                  <>
                    {domains.map((d: any) => {
                      const isUrgent = (d.daysRemaining ?? 99) <= 14;
                      const isWarning = (d.daysRemaining ?? 99) <= 30;

                      return (
                        <tr key={d._id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-gray-900">
                            {d.domain}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            Web Domain (WHOIS)
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isUrgent
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : isWarning
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {d.daysRemaining > 0
                                ? `${d.daysRemaining} days left`
                                : "Expired"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(d.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-emerald-700 font-semibold">Protected</span>
                          </td>
                        </tr>
                      );
                    })}

                    {emailLicenses.map((l: any) => (
                      <tr key={l._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-gray-900">
                          {l.domain}
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {l.provider === "google_workspace" ? "Google Workspace" : "Microsoft 365"} ({l.seatCount} seats)
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Active Seats
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(l.renewalDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-blue-700 font-semibold">Managed</span>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Span 1): Quick Actions */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
            <p className="text-[11px] text-gray-500">Direct portal shortcuts</p>
          </div>

          <div className="space-y-2">
            <Link
              href="/editor"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                }}
              >
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-emerald-800 truncate">
                  Visual Content Editor
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Edit copy &amp; buttons on-page
                </div>
              </div>
            </Link>

            <Link
              href="/changes"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-800 truncate">
                  Staged Edits ({pendingChanges.length})
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Review website revisions
                </div>
              </div>
            </Link>

            <Link
              href="/media"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-purple-800 truncate">
                  Media Library
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Upload brand graphics &amp; photos
                </div>
              </div>
            </Link>

            <Link
              href="/billing"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-amber-800 truncate">
                  Retainer &amp; Billing
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Maintenance contract details
                </div>
              </div>
            </Link>

            <a
              href="mailto:support@orifatech.com"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <LifeBuoy className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-emerald-800 truncate">
                  Contact Agency Support
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Orifa technical assistance
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
