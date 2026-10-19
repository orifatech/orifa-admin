"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  api,
  SUPPORTED_PAYSTACK_COUNTRIES,
  formatCurrencyAmount,
} from "@orifa/backend";
import {
  CreditCard,
  Plus,
  Building2,
  Trash2,
  Receipt,
  CheckCircle2,
  Clock,
  FilePlus,
  Search,
} from "lucide-react";

export default function BillingPage() {
  const subscriptions = useQuery(api.subscriptions.list, {});
  const mrrData = useQuery(api.subscriptions.getMRR);
  const organizations = useQuery(api.organizations.list);
  const invoices = useQuery(api.invoices.list, {});

  const addSubscription = useMutation(api.subscriptions.add);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const createInvoice = useMutation(api.invoices.create);
  const markInvoicePaid = useMutation(api.invoices.markPaid);
  const deleteInvoice = useMutation(api.invoices.deleteInvoice);

  const [activeTab, setActiveTab] = useState<"retainers" | "invoices">("retainers");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add Retainer Modal State
  const [isRetainerModalOpen, setIsRetainerModalOpen] = useState(false);
  const [retainerForm, setRetainerForm] = useState({
    organizationId: "",
    planName: "Monthly Maintenance & Content Retainer",
    monthlyFee: 500000,
    currency: "NGN",
    billingCycle: "monthly" as const,
    billingDayOfMonth: 1,
    status: "active" as const,
    paymentMethod: "Paystack",
    notes: "",
  });

  // Create Invoice Modal State
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    organizationId: "",
    invoiceNumber: "",
    description: "Monthly Website Maintenance Retainer",
    amount: 500000,
    currency: "NGN",
    dueDateDays: 14,
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // When org changes in retainer modal, adapt currency default
  const handleOrgChangeForRetainer = (orgId: string) => {
    const org = organizations?.find((o: any) => o._id === orgId);
    const country = (org as any)?.country || "NG";
    const config = SUPPORTED_PAYSTACK_COUNTRIES[country] || SUPPORTED_PAYSTACK_COUNTRIES.NG;
    setRetainerForm((prev) => ({
      ...prev,
      organizationId: orgId,
      currency: config.currency,
      monthlyFee: config.defaultMonthlyRetainer,
    }));
  };

  // When org changes in invoice modal, adapt currency default
  const handleOrgChangeForInvoice = (orgId: string) => {
    const org = organizations?.find((o: any) => o._id === orgId);
    const country = (org as any)?.country || "NG";
    const config = SUPPORTED_PAYSTACK_COUNTRIES[country] || SUPPORTED_PAYSTACK_COUNTRIES.NG;
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    setInvoiceForm((prev) => ({
      ...prev,
      organizationId: orgId,
      invoiceNumber: `INV-${year}-${randomSuffix}`,
      currency: config.currency,
      amount: config.defaultMonthlyRetainer,
    }));
  };

  const handleRetainerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retainerForm.organizationId) return;

    try {
      setIsSubmitting(true);
      const now = new Date();
      const nextDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        retainerForm.billingDayOfMonth
      ).getTime();

      await addSubscription({
        organizationId: retainerForm.organizationId as any,
        planName: retainerForm.planName,
        monthlyFee: Number(retainerForm.monthlyFee),
        currency: retainerForm.currency,
        billingCycle: retainerForm.billingCycle,
        billingDayOfMonth: Number(retainerForm.billingDayOfMonth),
        nextBillingDate: nextDate,
        status: retainerForm.status,
        paymentMethod: retainerForm.paymentMethod,
        notes: retainerForm.notes || undefined,
      });

      setIsRetainerModalOpen(false);
    } catch (err: any) {
      alert("Error adding subscription: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.organizationId) return;

    try {
      setIsSubmitting(true);
      const dueDate = Date.now() + invoiceForm.dueDateDays * 24 * 60 * 60 * 1000;

      await createInvoice({
        organizationId: invoiceForm.organizationId as any,
        invoiceNumber: invoiceForm.invoiceNumber,
        description: invoiceForm.description,
        amount: Number(invoiceForm.amount),
        currency: invoiceForm.currency,
        dueDate,
        notes: invoiceForm.notes || undefined,
      });

      setIsInvoiceModalOpen(false);
    } catch (err: any) {
      alert("Error generating invoice: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRetainer = async (id: any, name: string) => {
    if (confirm(`Remove maintenance retainer for ${name}?`)) {
      await deleteSubscription({ subscriptionId: id });
    }
  };

  const handleDeleteInvoice = async (id: any, invNum: string) => {
    if (confirm(`Permanently cancel and delete invoice ${invNum}?`)) {
      await deleteInvoice({ invoiceId: id });
    }
  };

  const handleManualMarkPaid = async (id: any, invNum: string) => {
    if (confirm(`Manually mark invoice ${invNum} as settled/paid?`)) {
      await markInvoicePaid({
        invoiceId: id,
        paymentMethod: "Manual Admin Confirmation",
      });
    }
  };

  // Calculations
  const totalsByCurrency = mrrData?.totalsByCurrency || {};
  const overdueCount = subscriptions?.filter((s: any) => s.status === "overdue").length || 0;

  const filteredInvoices = (invoices || []).filter((inv: any) => {
    if (invoiceStatusFilter !== "all" && inv.status !== invoiceStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.organizationName?.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q) ||
        (inv.paystackReference && inv.paystackReference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto font-sans">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <CreditCard className="h-5 w-5 text-emerald-800" />
            Client Retainers &amp; Paystack Billing
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage multi-currency maintenance contracts, track Paystack payments, and dispatch invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <FilePlus className="h-4 w-4 text-emerald-800" />
            Create Invoice
          </button>
          <button
            onClick={() => setIsRetainerModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Retainer
          </button>
        </div>
      </div>

      {/* 2. Multi-Currency MRR Breakdown Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total NGN MRR */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🇳🇬 Nigeria MRR</span>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatCurrencyAmount(totalsByCurrency["NGN"] || 0, "NGN")}
            <span className="text-[11px] font-normal text-gray-400 ml-1">/ mo</span>
          </div>
        </div>

        {/* Total USD MRR */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🌐 Global (USD) MRR</span>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatCurrencyAmount(totalsByCurrency["USD"] || 0, "USD")}
            <span className="text-[11px] font-normal text-gray-400 ml-1">/ mo</span>
          </div>
        </div>

        {/* Active Retainer Contracts */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Active Retainers
          </div>
          <div className="text-2xl font-black text-gray-900">
            {mrrData?.activeSubscribersCount || 0}
            <span className="text-xs font-normal text-gray-400 ml-1">clients</span>
          </div>
        </div>

        {/* Overdue Count */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs space-y-1">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Overdue / Pending
          </div>
          <div
            className={`text-2xl font-black ${
              overdueCount > 0 ? "text-amber-600" : "text-emerald-700"
            }`}
          >
            {overdueCount}
            <span className="text-xs font-normal text-gray-400 ml-1">accounts</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("retainers")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "retainers"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Active Retainer Contracts ({subscriptions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "invoices"
              ? "border-emerald-800 text-emerald-800"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          Paystack Invoices &amp; Receipts ({invoices?.length || 0})
        </button>
      </div>

      {/* TAB 1: RETAINERS TABLE */}
      {activeTab === "retainers" && (
        <>
          {subscriptions === undefined ? (
            <div className="h-64 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 p-8">
              <CreditCard className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <h3 className="text-sm font-semibold text-gray-900">No active retainers</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Record recurring maintenance retainers to enable automated GitHub PRs and Paystack billing for clients.
              </p>
              <button
                onClick={() => setIsRetainerModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add First Retainer
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Client Org</th>
                    <th className="px-5 py-3 font-semibold">Plan Description</th>
                    <th className="px-5 py-3 font-semibold">Monthly Retainer</th>
                    <th className="px-5 py-3 font-semibold">Billing Schedule</th>
                    <th className="px-5 py-3 font-semibold">Channel</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subscriptions.map((sub: any) => (
                    <tr key={sub._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-emerald-700 shrink-0" />
                        <span>{sub.organizationName}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">{sub.planName}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        {formatCurrencyAmount(sub.monthlyFee, sub.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        Day {sub.billingDayOfMonth} of month
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-[11px] font-medium">
                        {sub.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                            sub.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : sub.status === "overdue"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteRetainer(sub._id, sub.organizationName)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                          title="Delete Retainer"
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
        </>
      )}

      {/* TAB 2: INVOICES & PAYSTACK TRANSACTIONS */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          {/* Invoices Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Filter Status:</span>
              <div className="flex items-center gap-1">
                {["all", "pending", "paid"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInvoiceStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                      invoiceStatusFilter === st
                        ? "bg-emerald-800 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search invoice number, client, or ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs w-64 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Invoices Table */}
          {invoices === undefined ? (
            <div className="h-64 bg-white border border-gray-200 rounded-xl animate-pulse" />
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-white p-6">
              <Receipt className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <h4 className="text-xs font-bold text-gray-900">No invoices match filter</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Generate a new invoice using the &quot;Create Invoice&quot; button above.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Invoice #</th>
                    <th className="px-5 py-3 font-semibold">Client</th>
                    <th className="px-5 py-3 font-semibold">Description</th>
                    <th className="px-5 py-3 font-semibold">Amount</th>
                    <th className="px-5 py-3 font-semibold">Due Date</th>
                    <th className="px-5 py-3 font-semibold">Paystack Ref</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInvoices.map((inv: any) => {
                    const isPaid = inv.status === "paid";
                    return (
                      <tr key={inv._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-gray-900">{inv.invoiceNumber}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">
                          {inv.organizationName}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">
                          {inv.description}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {formatCurrencyAmount(inv.amount, inv.currency)}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[10px] text-gray-500">
                          {inv.paystackReference ? (
                            <span className="truncate max-w-[120px] inline-block" title={inv.paystackReference}>
                              {inv.paystackReference}
                            </span>
                          ) : (
                            <span className="text-gray-300">Pending checkout</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {isPaid ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-700" />
                            )}
                            <span>{isPaid ? "Paid" : "Pending"}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!isPaid && (
                              <button
                                onClick={() => handleManualMarkPaid(inv._id, inv.invoiceNumber)}
                                className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                                title="Mark Paid Manually"
                              >
                                Mark Paid
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInvoice(inv._id, inv.invoiceNumber)}
                              className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                              title="Delete Invoice"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD RETAINER */}
      {isRetainerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-800" />
                Add Client Maintenance Retainer
              </h2>
              <button
                onClick={() => setIsRetainerModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRetainerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client Organization *
                </label>
                <select
                  required
                  value={retainerForm.organizationId}
                  onChange={(e) => handleOrgChangeForRetainer(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Select client...</option>
                  {organizations?.map((org: any) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.country || "NG"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Plan Description *
                </label>
                <input
                  type="text"
                  required
                  value={retainerForm.planName}
                  onChange={(e) => setRetainerForm({ ...retainerForm, planName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Fee &amp; Currency *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      required
                      min={0}
                      value={retainerForm.monthlyFee}
                      onChange={(e) =>
                        setRetainerForm({ ...retainerForm, monthlyFee: Number(e.target.value) })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                    <select
                      value={retainerForm.currency}
                      onChange={(e) =>
                        setRetainerForm({ ...retainerForm, currency: e.target.value })
                      }
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 text-xs font-mono"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="GHS">GHS</option>
                      <option value="KES">KES</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Billing Day (1-28)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={retainerForm.billingDayOfMonth}
                    onChange={(e) =>
                      setRetainerForm({
                        ...retainerForm,
                        billingDayOfMonth: Number(e.target.value),
                      })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={retainerForm.paymentMethod}
                  onChange={(e) =>
                    setRetainerForm({ ...retainerForm, paymentMethod: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRetainerModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Retainer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CREATE INVOICE */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <FilePlus className="h-4 w-4 text-emerald-800" />
                Generate Client Invoice
              </h2>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Client Organization *
                </label>
                <select
                  required
                  value={invoiceForm.organizationId}
                  onChange={(e) => handleOrgChangeForInvoice(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="">Select client...</option>
                  {organizations?.map((org: any) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.country || "NG"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Invoice Number *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Description / Service *
                </label>
                <input
                  type="text"
                  required
                  value={invoiceForm.description}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, description: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Amount &amp; Currency *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      required
                      min={0}
                      value={invoiceForm.amount}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                    <select
                      value={invoiceForm.currency}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, currency: e.target.value })
                      }
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 text-xs font-mono"
                    >
                      <option value="NGN">NGN</option>
                      <option value="USD">USD</option>
                      <option value="GHS">GHS</option>
                      <option value="KES">KES</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Due In (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={invoiceForm.dueDateDays}
                    onChange={(e) =>
                      setInvoiceForm({ ...invoiceForm, dueDateDays: Number(e.target.value) })
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Generating..." : "Generate & Dispatch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
