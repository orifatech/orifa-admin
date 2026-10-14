"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Calendar,
  Building2,
  Trash2,
} from "lucide-react";

export default function BillingPage() {
  const subscriptions = useQuery(api.subscriptions.list, {});
  const mrrData = useQuery(api.subscriptions.getMRR);
  const organizations = useQuery(api.organizations.list);
  const addSubscription = useMutation(api.subscriptions.add);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: "",
    planName: "Monthly Maintenance & Content Retainer",
    monthlyFee: 350,
    currency: "USD",
    billingCycle: "monthly" as const,
    billingDayOfMonth: 1,
    status: "active" as const,
    paymentMethod: "Stripe Auto-Debit",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId) return;

    try {
      setIsSubmitting(true);
      const now = new Date();
      const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, formData.billingDayOfMonth).getTime();

      await addSubscription({
        organizationId: formData.organizationId as any,
        planName: formData.planName,
        monthlyFee: Number(formData.monthlyFee),
        currency: formData.currency,
        billingCycle: formData.billingCycle,
        billingDayOfMonth: Number(formData.billingDayOfMonth),
        nextBillingDate: nextDate,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error adding subscription: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any, name: string) => {
    if (confirm(`Remove subscription for ${name}?`)) {
      await deleteSubscription({ subscriptionId: id });
    }
  };

  const totalUSD = mrrData?.totalsByCurrency?.USD || 0;
  const overdueCount = subscriptions?.filter((s) => s.status === "overdue").length || 0;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-blue-500" />
            Client Retainers &amp; Monthly Revenue
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track website maintenance retainers, recurring billing schedules, and agency MRR.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Retainer
        </button>
      </div>

      {/* MRR Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-gradient-to-br from-blue-950/40 to-indigo-950/20 border border-blue-800/40 space-y-1">
          <div className="text-xs font-medium text-blue-300 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-blue-400" /> Total Agency MRR
          </div>
          <div className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            ${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            <span className="text-xs font-normal text-zinc-400 ml-1">/ month</span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-xs font-medium text-zinc-400">Active Retainers</div>
          <div className="text-3xl font-bold text-zinc-100 tracking-tight">
            {mrrData?.activeSubscribersCount || 0}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
          <div className="text-xs font-medium text-zinc-400">Past Due / Overdue</div>
          <div className={`text-3xl font-bold tracking-tight ${overdueCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {overdueCount}
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      {subscriptions === undefined ? (
        <div className="h-64 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse" />
      ) : subscriptions.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <CreditCard className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No retainers configured</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Record recurring maintenance retainers to forecast cashflow and monitor payment statuses.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Retainer
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Client Org</th>
                <th className="px-5 py-3 font-semibold">Plan Name</th>
                <th className="px-5 py-3 font-semibold">Monthly Fee</th>
                <th className="px-5 py-3 font-semibold">Billing Day</th>
                <th className="px-5 py-3 font-semibold">Payment Method</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {subscriptions.map((sub) => (
                <tr key={sub._id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-100 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>{sub.organizationName}</span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300">{sub.planName}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-400 font-mono">
                    ${sub.monthlyFee} <span className="text-[10px] text-zinc-500">{sub.currency}</span>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">
                    Day {sub.billingDayOfMonth} of month
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400 text-[11px]">{sub.paymentMethod}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        sub.status === "active"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : sub.status === "overdue"
                          ? "bg-rose-950/60 text-rose-400 border-rose-800/40"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(sub._id, sub.organizationName)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-400" />
                Add Client Retainer
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Client Organization *
                </label>
                <select
                  required
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select client...</option>
                  {organizations?.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Plan Description *
                </label>
                <input
                  type="text"
                  required
                  value={formData.planName}
                  onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Monthly Fee ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Billing Day (1-28)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={formData.billingDayOfMonth}
                    onChange={(e) => setFormData({ ...formData, billingDayOfMonth: Number(e.target.value) })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {isSubmitting ? "Saving..." : "Save Retainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
