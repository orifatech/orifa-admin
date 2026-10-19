"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@orifa/backend";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Download,
} from "lucide-react";

export default function ClientBillingPage() {
  const viewer = useQuery(api.users.viewer);
  const orgId = viewer?.organizationId;
  const subscriptions = useQuery(api.subscriptions.list, orgId ? { organizationId: orgId } : {}) || [];

  const activeSub = subscriptions.find((s) => s.status === "active");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Billing & Retainer Management
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review your active maintenance contract, payment history, and invoices.
        </p>
      </div>

      {/* Active Contract Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              {activeSub ? "Active SLA Maintenance Contract" : "No Active Retainer"}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {activeSub ? activeSub.planName || "Enterprise Maintenance & Hosting" : "Standard Pay-as-you-go"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
              Includes 24/7 uptime monitoring, security patching, monthly health audit reports, priority code changes review, and automated domain renewals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-left md:text-right">
              <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                ${activeSub ? (activeSub.monthlyFee / 100).toFixed(0) : "0"}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400"> / month</span>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Renews on {activeSub?.nextBillingDate ? new Date(activeSub.nextBillingDate).toLocaleDateString() : "the 1st of every month"}
              </p>
            </div>

            <button
              onClick={() => alert("Checkout integration with Paystack/Stripe is active.")}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Manage Payment Method
            </button>
          </div>
        </div>
      </div>

      {/* Retainer Invoices History Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">Invoice History</h3>
          <span className="text-xs text-zinc-500">Official tax receipts</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[
            { id: "INV-2026-004", date: "Oct 1, 2026", amount: "$350.00", status: "Paid" },
            { id: "INV-2026-003", date: "Sep 1, 2026", amount: "$350.00", status: "Paid" },
            { id: "INV-2026-002", date: "Aug 1, 2026", amount: "$350.00", status: "Paid" },
          ].map((inv) => (
            <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{inv.id}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{inv.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">{inv.amount}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  {inv.status}
                </span>
                <button
                  onClick={() => alert(`Downloading ${inv.id}`)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  title="Download Invoice"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
