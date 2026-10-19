"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Building2,
  Plus,
  Mail,
  Calendar,
  UserPlus,
  Copy,
  Check,
  Palette,
} from "lucide-react";

export default function OrganizationsPage() {
  const organizations = useQuery(api.organizations.list);
  const createOrganization = useMutation(api.organizations.create);
  const updateOrganization = useMutation(api.organizations.update);
  const createInvitation = useMutation(api.invitations.create);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    phone: "",
    logoUrl: "",
    primaryColor: "#006e2b",
    secondaryColor: "#16a34a",
    theme: "white",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branding modal state
  const [brandingModalOrg, setBrandingModalOrg] = useState<{
    id: Id<"organizations">;
    name: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    theme: string;
  } | null>(null);
  const [isUpdatingBranding, setIsUpdatingBranding] = useState(false);

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
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === "" || prev.slug === slug.slice(0, -1) ? slug : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;

    try {
      setIsSubmitting(true);
      await createOrganization({
        name: formData.name,
        slug: formData.slug,
        contactEmail: formData.contactEmail || undefined,
        phone: formData.phone || undefined,
        status: "active",
        logoUrl: formData.logoUrl.trim() || undefined,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        theme: formData.theme || "white",
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        slug: "",
        contactEmail: "",
        phone: "",
        logoUrl: "",
        primaryColor: "#006e2b",
        secondaryColor: "#16a34a",
        theme: "white",
      });
    } catch (err: any) {
      alert("Error creating organization: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandingModalOrg) return;

    try {
      setIsUpdatingBranding(true);
      await updateOrganization({
        organizationId: brandingModalOrg.id,
        logoUrl: brandingModalOrg.logoUrl.trim() || undefined,
        primaryColor: brandingModalOrg.primaryColor,
        secondaryColor: brandingModalOrg.secondaryColor,
        theme: brandingModalOrg.theme || "white",
      });
      setBrandingModalOrg(null);
    } catch (err: any) {
      alert("Error updating branding: " + err.message);
    } finally {
      setIsUpdatingBranding(false);
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
            Manage client tenancies, custom logo and 2-color white-labeled themes, and secure invitation tokens.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
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
              className="h-48 bg-white border border-gray-200/80 rounded-xl animate-pulse"
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
            Create tenant workspaces with custom branding to isolate client portals, domain reminders, and visual editor updates.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
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

            return (
              <div
                key={org._id}
                className="bg-white border border-gray-200/80 hover:border-gray-300 rounded-xl p-5 flex flex-col justify-between transition-all space-y-4 shadow-xs"
              >
                <div>
                  {/* Top: Logo & Name */}
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
                        <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                          /{org.slug}
                        </span>
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

                  {org.contactEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{org.contactEmail}</span>
                    </div>
                  )}

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
                      onClick={() =>
                        setBrandingModalOrg({
                          id: org._id,
                          name: org.name,
                          logoUrl: org.logoUrl || "",
                          primaryColor: org.primaryColor || "#006e2b",
                          secondaryColor: org.secondaryColor || "#16a34a",
                          theme: org.theme || "white",
                        })
                      }
                      className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium cursor-pointer text-xs"
                      title="Edit Logo & Brand Colors"
                    >
                      <Palette className="w-3.5 h-3.5 text-gray-400" />
                      <span>Branding</span>
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

      {/* Invite Member Modal */}
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
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setInviteModalOrg(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Client Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client.contact@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Portal Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "client_admin" | "client_editor")
                    }
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600 cursor-pointer"
                  >
                    <option value="client_admin">
                      Client Admin (Manage team, view billing &amp; monitors)
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

      {/* Edit Branding Modal */}
      {brandingModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-700" />
                Customize Client Branding
              </h2>
              <button
                onClick={() => setBrandingModalOrg(null)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Update logo and custom color palette for{" "}
              <span className="font-semibold text-gray-800">{brandingModalOrg.name}</span>. Maximum 2 colors. Default theme is white.
            </p>

            <form onSubmit={handleUpdateBranding} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Logo URL (PNG, SVG, or WebP)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={brandingModalOrg.logoUrl}
                  onChange={(e) =>
                    setBrandingModalOrg({ ...brandingModalOrg, logoUrl: e.target.value })
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {brandingModalOrg.logoUrl && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={brandingModalOrg.logoUrl}
                      alt="Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-gray-600 font-medium">Logo Live Preview</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Primary Color (Accent)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingModalOrg.primaryColor}
                      onChange={(e) =>
                        setBrandingModalOrg({
                          ...brandingModalOrg,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandingModalOrg.primaryColor}
                      onChange={(e) =>
                        setBrandingModalOrg({
                          ...brandingModalOrg,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Secondary Color (Subtle)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={brandingModalOrg.secondaryColor}
                      onChange={(e) =>
                        setBrandingModalOrg({
                          ...brandingModalOrg,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={brandingModalOrg.secondaryColor}
                      onChange={(e) =>
                        setBrandingModalOrg({
                          ...brandingModalOrg,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Base Theme
                </label>
                <select
                  value={brandingModalOrg.theme}
                  onChange={(e) =>
                    setBrandingModalOrg({ ...brandingModalOrg, theme: e.target.value })
                  }
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                >
                  <option value="white">White Theme (Clean, light background - Recommended)</option>
                  <option value="light">Soft Light Theme</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBrandingModalOrg(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingBranding}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isUpdatingBranding ? "Saving..." : "Save Branding"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Org Modal (With Logo and 2 Colors) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                Add Client Organization
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Motors"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tenant Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 font-mono focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Primary Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@clientdomain.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* Branding Section */}
              <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
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
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
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
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
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
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0 bg-transparent"
                      />
                      <input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-md px-2 py-1 text-xs font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-gray-500">
                  Default theme is <span className="font-semibold text-gray-700">White</span> (compatible with client logos out-of-the-box).
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
