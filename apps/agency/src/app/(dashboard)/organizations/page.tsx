"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import {
  api,
  Id,
  SUPPORTED_PAYSTACK_COUNTRIES,
  formatCurrencyAmount,
} from "@orifa/backend";
import {
  Building2,
  Plus,
  Mail,
  Calendar,
  UserPlus,
  Copy,
  Check,
  Palette,
  ShieldCheck,
  Settings,
  CreditCard,
} from "lucide-react";

export default function OrganizationsPage() {
  const organizations = useQuery(api.organizations.list);
  const allSubscriptions = useQuery(api.subscriptions.list, {});
  const createOrganization = useMutation(api.organizations.create);
  const updateOrganization = useMutation(api.organizations.update);
  const createInvitation = useMutation(api.invitations.create);
  const addSubscription = useMutation(api.subscriptions.add);
  const updateSubscription = useMutation(api.subscriptions.update);

  // Map active subscriptions by organization ID
  const activeSubsByOrgId = useMemo(() => {
    const map = new Map<string, any>();
    if (allSubscriptions) {
      for (const s of allSubscriptions) {
        if (s.status === "active") {
          map.set(s.organizationId as string, s);
        }
      }
    }
    return map;
  }, [allSubscriptions]);

  // Add Client Modal State (Onboarding)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    phone: "",
    country: "NG",
    currency: "NGN",
    logoUrl: "",
    primaryColor: "#006e2b",
    secondaryColor: "#16a34a",
    theme: "white",
    // Maintenance Retainer Contract Details
    hasMaintenance: false,
    monthlyFee: 250000,
    billingDayOfMonth: 1,
    planName: "Monthly SLA Maintenance & Engineering Retainer",
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit Client & Retainer Modal State
  const [editModalOrg, setEditModalOrg] = useState<{
    id: Id<"organizations">;
    name: string;
    contactEmail: string;
    phone: string;
    country: string;
    currency: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    theme: string;
    // Retainer state
    existingSubscriptionId?: Id<"subscriptions">;
    hasMaintenance: boolean;
    monthlyFee: number;
    billingDayOfMonth: number;
    planName: string;
    status: "active" | "cancelled" | "overdue";
  } | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Invite modal state
  const [inviteModalOrg, setInviteModalOrg] = useState<{
    id: Id<"organizations">;
    name: string;
  } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"client_admin" | "client_editor">("client_editor");
  const [isInviting, setIsInviting] = useState(false);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNameChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setCreateFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  // When country changes during onboarding, auto-set appropriate currency and default retainer
  const handleCountryChangeOnboarding = (newCountry: string) => {
    const config = SUPPORTED_PAYSTACK_COUNTRIES[newCountry] || SUPPORTED_PAYSTACK_COUNTRIES.US;
    setCreateFormData((prev) => ({
      ...prev,
      country: newCountry,
      currency: config.currency,
      monthlyFee: config.defaultMonthlyRetainer,
    }));
  };

  // Submit new client onboarding
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.slug) return;

    try {
      setIsSubmittingCreate(true);
      const orgId = await createOrganization({
        name: createFormData.name,
        slug: createFormData.slug,
        contactEmail: createFormData.contactEmail.trim() || undefined,
        phone: createFormData.phone.trim() || undefined,
        status: "active",
        logoUrl: createFormData.logoUrl.trim() || undefined,
        primaryColor: createFormData.primaryColor,
        secondaryColor: createFormData.secondaryColor,
        theme: createFormData.theme || "white",
        country: createFormData.country,
        currency: createFormData.currency,
      });

      // If Maintenance Retainer is specified, create the subscription contract & initial invoice
      if (createFormData.hasMaintenance && Number(createFormData.monthlyFee) > 0) {
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        nextBilling.setDate(Math.min(Number(createFormData.billingDayOfMonth) || 1, 28));

        await addSubscription({
          organizationId: orgId,
          planName: createFormData.planName.trim() || "Monthly SLA Maintenance & Engineering Retainer",
          monthlyFee: Number(createFormData.monthlyFee),
          currency: createFormData.currency,
          billingCycle: "monthly",
          billingDayOfMonth: Number(createFormData.billingDayOfMonth) || 1,
          nextBillingDate: nextBilling.getTime(),
          status: "active",
          paymentMethod: "Paystack",
          notes: `Negotiated retainer established during onboarding (${createFormData.currency} ${createFormData.monthlyFee}/month)`,
        });
      }

      setIsCreateModalOpen(false);
      setCreateFormData({
        name: "",
        slug: "",
        contactEmail: "",
        phone: "",
        country: "NG",
        currency: "NGN",
        logoUrl: "",
        primaryColor: "#006e2b",
        secondaryColor: "#16a34a",
        theme: "white",
        hasMaintenance: false,
        monthlyFee: 250000,
        billingDayOfMonth: 1,
        planName: "Monthly SLA Maintenance & Engineering Retainer",
      });
    } catch (err: any) {
      alert("Error creating organization: " + err.message);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Client & Retainer Modal
  const openEditModal = (org: any) => {
    const existingSub = activeSubsByOrgId.get(org._id as string);
    const countryKey = org.country || "NG";
    const countryConfig = SUPPORTED_PAYSTACK_COUNTRIES[countryKey] || SUPPORTED_PAYSTACK_COUNTRIES.US;

    setEditModalOrg({
      id: org._id,
      name: org.name,
      contactEmail: org.contactEmail || "",
      phone: org.phone || "",
      country: org.country || "NG",
      currency: existingSub?.currency || org.currency || countryConfig.currency,
      logoUrl: org.logoUrl || "",
      primaryColor: org.primaryColor || "#006e2b",
      secondaryColor: org.secondaryColor || "#16a34a",
      theme: org.theme || "white",
      existingSubscriptionId: existingSub?._id,
      hasMaintenance: Boolean(existingSub && existingSub.status === "active"),
      monthlyFee: existingSub?.monthlyFee ?? countryConfig.defaultMonthlyRetainer,
      billingDayOfMonth: existingSub?.billingDayOfMonth ?? 1,
      planName: existingSub?.planName || "Monthly SLA Maintenance & Engineering Retainer",
      status: existingSub?.status || "active",
    });
  };

  // Submit Edit Client & Retainer Updates
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalOrg) return;

    try {
      setIsSubmittingEdit(true);

      // 1. Update Organization Details & Branding
      await updateOrganization({
        organizationId: editModalOrg.id,
        name: editModalOrg.name.trim(),
        contactEmail: editModalOrg.contactEmail.trim() || undefined,
        phone: editModalOrg.phone.trim() || undefined,
        country: editModalOrg.country,
        currency: editModalOrg.currency,
        logoUrl: editModalOrg.logoUrl.trim() || undefined,
        primaryColor: editModalOrg.primaryColor,
        secondaryColor: editModalOrg.secondaryColor,
        theme: editModalOrg.theme || "white",
      });

      // 2. Handle Maintenance Retainer
      if (editModalOrg.hasMaintenance) {
        if (editModalOrg.existingSubscriptionId) {
          // Update existing maintenance contract
          await updateSubscription({
            subscriptionId: editModalOrg.existingSubscriptionId,
            planName: editModalOrg.planName.trim() || "Monthly SLA Maintenance & Engineering Retainer",
            monthlyFee: Number(editModalOrg.monthlyFee),
            currency: editModalOrg.currency,
            billingDayOfMonth: Number(editModalOrg.billingDayOfMonth) || 1,
            status: "active",
          });
        } else {
          // Establish new negotiated maintenance contract
          const nextBilling = new Date();
          nextBilling.setMonth(nextBilling.getMonth() + 1);
          nextBilling.setDate(Math.min(Number(editModalOrg.billingDayOfMonth) || 1, 28));

          await addSubscription({
            organizationId: editModalOrg.id,
            planName: editModalOrg.planName.trim() || "Monthly SLA Maintenance & Engineering Retainer",
            monthlyFee: Number(editModalOrg.monthlyFee),
            currency: editModalOrg.currency,
            billingCycle: "monthly",
            billingDayOfMonth: Number(editModalOrg.billingDayOfMonth) || 1,
            nextBillingDate: nextBilling.getTime(),
            status: "active",
            paymentMethod: "Paystack",
            notes: `Negotiated retainer added via client editor (${editModalOrg.currency} ${editModalOrg.monthlyFee}/month)`,
          });
        }
      } else {
        // If maintenance was deselected and they had an existing active subscription, deactivate it
        if (editModalOrg.existingSubscriptionId) {
          await updateSubscription({
            subscriptionId: editModalOrg.existingSubscriptionId,
            status: "cancelled",
          });
        }
      }

      setEditModalOrg(null);
    } catch (err: any) {
      alert("Error updating client account: " + err.message);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalOrg || !inviteEmail) return;

    try {
      setIsInviting(true);
      const res = await createInvitation({
        organizationId: inviteModalOrg.id,
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      const inviteUrl = `${window.location.origin}/invite/${res.token}`;
      setGeneratedInviteUrl(inviteUrl);
    } catch (err: any) {
      alert("Error generating invitation: " + err.message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopy = () => {
    if (!generatedInviteUrl) return;
    navigator.clipboard.writeText(generatedInviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusChange = async (
    orgId: Id<"organizations">,
    newStatus: "active" | "suspended" | "offboarding" | "deleted"
  ) => {
    if (!confirm(`Are you sure you want to change organization status to '${newStatus}'?`)) {
      return;
    }
    try {
      await updateOrganization({
        organizationId: orgId,
        status: newStatus,
      });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-700" />
            Client Organizations &amp; Workspaces
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage client tenancies, custom white-labeled themes, and negotiated Paystack maintenance retainers.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client Organization</span>
        </button>
      </div>

      {/* Organizations Grid */}
      {organizations === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 bg-white border border-gray-200/80 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl bg-white p-8 shadow-xs">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900">
            No client organizations created
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
            Create tenant workspaces with custom branding and negotiated maintenance retainers to isolate client portals and billing.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Organization</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {organizations.map((org: any) => {
            const orgStatus = org.status ?? "active";
            const isSuspended = orgStatus === "suspended";
            const isOffboarding = orgStatus === "offboarding";
            const primaryColor = org.primaryColor || "#006e2b";
            const secondaryColor = org.secondaryColor || "#16a34a";
            const countryKey = org.country || "NG";
            const countryConfig = SUPPORTED_PAYSTACK_COUNTRIES[countryKey] || SUPPORTED_PAYSTACK_COUNTRIES.US;
            const activeSub = activeSubsByOrgId.get(org._id);

            return (
              <div
                key={org._id}
                className="bg-white border border-gray-200/80 hover:border-gray-300 rounded-xl p-5 flex flex-col justify-between transition-all space-y-4 shadow-xs"
              >
                <div>
                  {/* Top: Logo, Name & Slug */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {org.logoUrl ? (
                        <div className="w-10 h-10 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={org.logoUrl}
                            alt={org.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-10 h-10 rounded-lg text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {org.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            /{org.slug}
                          </span>
                          <span className="text-xs text-gray-400" title={countryConfig.name}>
                            {countryConfig.flag}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Brand 2-Color Swatch Badges */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                        title={`Primary: ${primaryColor}`}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                        style={{ backgroundColor: secondaryColor }}
                        title={`Secondary: ${secondaryColor}`}
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  {org.contactEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{org.contactEmail}</span>
                    </div>
                  )}

                  {/* Negotiated Retainer Badge */}
                  <div className="mt-3 p-2.5 rounded-lg bg-gray-50/80 border border-gray-200/60 flex items-center justify-between text-xs">
                    <span className="text-gray-500 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span>Retainer:</span>
                    </span>
                    {activeSub ? (
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{formatCurrencyAmount(activeSub.monthlyFee, activeSub.currency)} / mo</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        Pay-as-you-go (No Retainer)
                      </span>
                    )}
                  </div>

                  {/* Status & Lifecycle Selector */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status:</span>
                    <select
                      value={orgStatus}
                      onChange={(e) =>
                        handleStatusChange(
                          org._id,
                          e.target.value as "active" | "suspended" | "offboarding" | "deleted"
                        )
                      }
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border focus:outline-hidden cursor-pointer ${
                        isSuspended
                          ? "bg-red-50 text-red-700 border-red-200"
                          : isOffboarding
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="offboarding">Offboarding</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(org.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditModal(org)}
                      className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium cursor-pointer text-xs bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200"
                      title="Edit Client Account & Retainer"
                    >
                      <Settings className="w-3.5 h-3.5 text-gray-500" />
                      <span>Edit &amp; Retainer</span>
                    </button>

                    <button
                      onClick={() => {
                        setInviteModalOrg({ id: org._id, name: org.name });
                        setInviteEmail("");
                        setGeneratedInviteUrl(null);
                      }}
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-900 font-semibold cursor-pointer text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Invite</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Add Client Organization Modal (Onboarding with Maintenance Checkbox) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Add Client Organization
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              {/* Basic Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Motors"
                    value={createFormData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tenant Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.slug}
                    onChange={(e) => setCreateFormData({ ...createFormData, slug: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@clientdomain.com"
                    value={createFormData.contactEmail}
                    onChange={(e) => setCreateFormData({ ...createFormData, contactEmail: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Billing Country
                  </label>
                  <select
                    value={createFormData.country}
                    onChange={(e) => handleCountryChangeOnboarding(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  >
                    {Object.values(SUPPORTED_PAYSTACK_COUNTRIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branding Section */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <Palette className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Client White-label Branding (Max 2 Colors)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Client Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://clientdomain.com/logo.png"
                    value={createFormData.logoUrl}
                    onChange={(e) => setCreateFormData({ ...createFormData, logoUrl: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Primary Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={createFormData.primaryColor}
                        onChange={(e) => setCreateFormData({ ...createFormData, primaryColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={createFormData.primaryColor}
                        onChange={(e) => setCreateFormData({ ...createFormData, primaryColor: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={createFormData.secondaryColor}
                        onChange={(e) => setCreateFormData({ ...createFormData, secondaryColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={createFormData.secondaryColor}
                        onChange={(e) => setCreateFormData({ ...createFormData, secondaryColor: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500">
                  Default theme is <span className="font-semibold text-gray-700">White</span> (compatible with client logos out-of-the-box).
                </div>
              </div>

              {/* Maintenance Retainer Section (Checkbox & Conditionally Rendered Fields) */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="hasMaintenance"
                    checked={createFormData.hasMaintenance}
                    onChange={(e) => setCreateFormData({ ...createFormData, hasMaintenance: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="hasMaintenance" className="font-bold text-gray-900 cursor-pointer">
                      SLA Maintenance Retainer Contract
                    </label>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Enable monthly recurring maintenance billing via Paystack, automated renewal tracking, and visual editor updates.
                    </p>
                  </div>
                </div>

                {createFormData.hasMaintenance && (
                  <div className="space-y-3 pt-2 border-t border-emerald-200/60 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Billing Currency
                        </label>
                        <select
                          value={createFormData.currency}
                          onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        >
                          <option value="NGN">NGN (₦) - Nigerian Naira</option>
                          <option value="USD">USD ($) - US Dollar (Global)</option>
                          <option value="GHS">GHS (GH₵) - Ghanaian Cedi</option>
                          <option value="KES">KES (KSh) - Kenyan Shilling</option>
                          <option value="ZAR">ZAR (R) - South African Rand</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Negotiated Monthly Retainer Fee *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            required={createFormData.hasMaintenance}
                            min="1"
                            step="any"
                            value={createFormData.monthlyFee}
                            onChange={(e) => setCreateFormData({ ...createFormData, monthlyFee: Number(e.target.value) })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Custom amount negotiated separately for this client.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Billing Day of Month
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={createFormData.billingDayOfMonth}
                          onChange={(e) => setCreateFormData({ ...createFormData, billingDayOfMonth: Number(e.target.value) })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-gray-800 mb-1">
                          Plan Description
                        </label>
                        <input
                          type="text"
                          value={createFormData.planName}
                          onChange={(e) => setCreateFormData({ ...createFormData, planName: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmittingCreate ? "Creating..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Client Account & Retainer Modal */}
      {editModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-700" />
                Edit Client Account &amp; Retainer
              </h2>
              <button
                onClick={() => setEditModalOrg(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Organization Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editModalOrg.name}
                    onChange={(e) => setEditModalOrg({ ...editModalOrg, name: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Billing Country
                  </label>
                  <select
                    value={editModalOrg.country}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      const config = SUPPORTED_PAYSTACK_COUNTRIES[newCountry] || SUPPORTED_PAYSTACK_COUNTRIES.US;
                      setEditModalOrg({
                        ...editModalOrg,
                        country: newCountry,
                        currency: config.currency,
                      });
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  >
                    {Object.values(SUPPORTED_PAYSTACK_COUNTRIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={editModalOrg.contactEmail}
                    onChange={(e) => setEditModalOrg({ ...editModalOrg, contactEmail: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={editModalOrg.phone}
                    onChange={(e) => setEditModalOrg({ ...editModalOrg, phone: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* White-label Branding */}
              <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                  <Palette className="w-3.5 h-3.5 text-emerald-700" />
                  <span>White-label Logo &amp; Palette (Max 2 Colors)</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1">
                    Logo URL (PNG, SVG, or WebP)
                  </label>
                  <input
                    type="url"
                    value={editModalOrg.logoUrl}
                    onChange={(e) => setEditModalOrg({ ...editModalOrg, logoUrl: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editModalOrg.primaryColor}
                        onChange={(e) => setEditModalOrg({ ...editModalOrg, primaryColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={editModalOrg.primaryColor}
                        onChange={(e) => setEditModalOrg({ ...editModalOrg, primaryColor: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                      Secondary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editModalOrg.secondaryColor}
                        onChange={(e) => setEditModalOrg({ ...editModalOrg, secondaryColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={editModalOrg.secondaryColor}
                        onChange={(e) => setEditModalOrg({ ...editModalOrg, secondaryColor: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Retainer Section */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="editMaintenance"
                    checked={editModalOrg.hasMaintenance}
                    onChange={(e) => setEditModalOrg({ ...editModalOrg, hasMaintenance: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <label htmlFor="editMaintenance" className="font-bold text-gray-900 cursor-pointer">
                      SLA Maintenance Retainer Contract
                    </label>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Enable monthly recurring retainer billing for this client. Amounts are negotiated and set per client.
                    </p>
                  </div>
                </div>

                {editModalOrg.hasMaintenance && (
                  <div className="space-y-3 pt-2 border-t border-emerald-200/60 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Billing Currency
                        </label>
                        <select
                          value={editModalOrg.currency}
                          onChange={(e) => setEditModalOrg({ ...editModalOrg, currency: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        >
                          <option value="NGN">NGN (₦) - Nigerian Naira</option>
                          <option value="USD">USD ($) - US Dollar (Global)</option>
                          <option value="GHS">GHS (GH₵) - Ghanaian Cedi</option>
                          <option value="KES">KES (KSh) - Kenyan Shilling</option>
                          <option value="ZAR">ZAR (R) - South African Rand</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Negotiated Monthly Retainer Fee *
                        </label>
                        <input
                          type="number"
                          required={editModalOrg.hasMaintenance}
                          min="1"
                          step="any"
                          value={editModalOrg.monthlyFee}
                          onChange={(e) => setEditModalOrg({ ...editModalOrg, monthlyFee: Number(e.target.value) })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        />
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Amount client pays monthly for engineering support &amp; monitoring.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-800 mb-1">
                          Billing Day of Month
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={editModalOrg.billingDayOfMonth}
                          onChange={(e) => setEditModalOrg({ ...editModalOrg, billingDayOfMonth: Number(e.target.value) })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-gray-800 mb-1">
                          Plan Description
                        </label>
                        <input
                          type="text"
                          value={editModalOrg.planName}
                          onChange={(e) => setEditModalOrg({ ...editModalOrg, planName: e.target.value })}
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOrg(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Invite Member Modal */}
      {inviteModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                Invite Client Member
              </h2>
              <button
                onClick={() => setInviteModalOrg(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Generate a cryptographically secure, tenant-bound invitation link for{" "}
              <span className="font-semibold text-gray-800">{inviteModalOrg.name}</span>.
            </p>

            {generatedInviteUrl ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Invitation link generated! Valid for 7 days.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-600">
                    Invitation URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteUrl}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-800 select-all"
                    />
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setInviteModalOrg(null);
                    setGeneratedInviteUrl(null);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold py-2 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Client Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Role in Client Workspace
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "client_admin" | "client_editor")
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  >
                    <option value="client_admin">
                      Organization Administrator (Full access + billing)
                    </option>
                    <option value="client_editor">
                      Content Editor (Visual editor &amp; staging only)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setInviteModalOrg(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {isInviting ? "Generating..." : "Generate Invite Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
