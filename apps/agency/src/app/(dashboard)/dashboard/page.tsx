"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Building2,
  Globe,
  CreditCard,
  GitPullRequest,
  Clock,
  RotateCw,
  ArrowUpRight,
  ShieldCheck,
  Mail,
  KeyRound,
} from "lucide-react";

export default function AgencyDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const orgs = useQuery(api.organizations.list) || [];
  const domains = useQuery(api.domains.list, {}) || [];
  const mrrData = useQuery(api.subscriptions.getMRR, {});
  const stagedChanges = useQuery(api.stagedChanges.list, {}) || [];

  const totalMRR = mrrData
    ? Object.values(mrrData.totalsByCurrency || {}).reduce(
        (acc: number, curr: number) => acc + curr,
        0
      )
    : 0;
  const activeSubsCount = mrrData?.activeSubscribersCount || 0;

  const expiringSoonDomains = domains.filter((d: any) => d.daysRemaining <= 30);
  const pendingChanges = stagedChanges.filter(
    (c: any) => c.status === "pending_review" || c.status === "draft"
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Realtime Status Bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200/80 rounded-xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-800">
            Realtime Operations Dashboard
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            • Live sync with Convex backend & GitHub hooks
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Organizations */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Client Accounts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{orgs.length}</div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-700 font-semibold">{orgs.filter((o: any) => o.status === "active").length} active</span>
              <span>• Tenancy isolated</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Monitored Domains */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Monitored Domains</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{domains.length}</div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              {expiringSoonDomains.length > 0 ? (
                <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {expiringSoonDomains.length} expiring soon
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  All domains healthy
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Metric 3: Retainer MRR */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Retainer MRR</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ${totalMRR.toLocaleString()}
              <span className="text-xs font-normal text-gray-500">/mo</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              <span className="text-purple-700 font-semibold">{activeSubsCount}</span> active retainers
            </div>
          </div>
        </div>

        {/* Metric 4: Staged Content Changes */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Staged Changes</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <GitPullRequest className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{pendingChanges.length}</div>
            <div className="text-[11px] text-gray-500 mt-1">
              <span className="text-amber-700 font-semibold">{pendingChanges.length}</span> pending review
            </div>
          </div>
        </div>
      </div>

      {/* 3:1 Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column (Span 3): Monitored Client Platforms Table */}
        <div className="lg:col-span-3 bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Monitored Client Platforms</h2>
              <p className="text-[11px] text-gray-500">Domain expiry countdown, maintenance status and DNS health</p>
            </div>
            <Link
              href="/domains"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Organization</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Days Left</th>
                  <th className="py-3 px-4">Expires On</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {domains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No domains added yet. Use "Add Domain Monitor" to get started.
                    </td>
                  </tr>
                ) : (
                  domains.slice(0, 6).map((item: any) => {
                    const isUrgent = item.daysRemaining <= 14;
                    const isWarning = item.daysRemaining <= 30;

                    return (
                      <tr key={item._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {item.organizationName}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {item.domain}
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
                            {item.daysRemaining > 0
                              ? `${item.daysRemaining} days`
                              : "Expired"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(item.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            href="/domains"
                            className="text-xs font-semibold text-emerald-800 hover:text-emerald-900"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Span 1): Quick Links */}
        <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900">Quick Actions</h2>
            <p className="text-[11px] text-gray-500">Common administrative workflows</p>
          </div>

          <div className="space-y-2">
            <Link
              href="/organizations"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-emerald-800 truncate">
                  Onboard Client
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Logo, 2 colors & tenant tokens
                </div>
              </div>
            </Link>

            <Link
              href="/domains"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-blue-800 truncate">
                  Add Domain Monitor
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  WHOIS expiration tracking
                </div>
              </div>
            </Link>

            <Link
              href="/licenses"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-purple-800 truncate">
                  Add Email License
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Seat quotas & renewals
                </div>
              </div>
            </Link>

            <Link
              href="/changes"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <GitPullRequest className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-amber-800 truncate">
                  Review Staged Changes
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Approve visual copy & PRs
                </div>
              </div>
            </Link>

            <Link
              href="/vault"
              className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <KeyRound className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-900 group-hover:text-indigo-800 truncate">
                  Encrypted Vault
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Registrar & API credentials
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
