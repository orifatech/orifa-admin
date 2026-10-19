"use client";

import { useState } from "react";
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
  Loader2,
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        slug: "",
        contactEmail: "",
        phone: "",
      });
    } catch (err: any) {
      alert("Error creating organization: " + err.message);
    } finally {
      setIsSubmitting(false);
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
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-blue-500" />
            Client Organizations &amp; Workspaces
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Manage multi-tenant workspaces to isolate client websites, media files, and sensitive credentials with OWASP multi-tenant governance.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Client Org
        </button>
      </div>

      {/* Organizations List */}
      {organizations === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20 p-8 shadow-xs">
          <Building2 className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">
            No client organizations created
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Create tenant workspaces to organize client websites and permissions without bleeding information across.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create First Organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => {
            const orgStatus = org.status ?? "active";
            const isSuspended = orgStatus === "suspended";
            const isOffboarding = orgStatus === "offboarding";

            return (
              <div
                key={org._id}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all space-y-4 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                      {org.name}
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                      /{org.slug}
                    </span>
                  </div>

                  {org.contactEmail && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      <Mail className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                      <span>{org.contactEmail}</span>
                    </div>
                  )}

                  {/* Status & Lifecycle Selector */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Status:</span>
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
                          ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                          : isOffboarding
                          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      }`}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="offboarding">Offboarding</option>
                      <option value="deleted">Deleted</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(org.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => {
                      setInviteModalOrg({ id: org._id, name: org.name });
                      setInviteEmail("");
                      setGeneratedInviteUrl(null);
                    }}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Invite Client
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Invite Client Member
              </h2>
              <button
                onClick={() => setInviteModalOrg(null)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Generate a cryptographically secure, tenant-bound invitation link for{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-200">{inviteModalOrg.name}</span>.
            </p>

            {generatedInviteUrl ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Invitation link generated! Valid for 7 days.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-zinc-500">
                    Invitation URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedInviteUrl}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 select-all"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setInviteModalOrg(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Client Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Role &amp; Permissions *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "client_admin" | "client_editor")
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="client_editor">
                      Client Content Editor (Can propose edits &amp; media)
                    </option>
                    <option value="client_admin">
                      Client Admin (Full tenant control, billing, credentials, domain monitors)
                    </option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setInviteModalOrg(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isInviting}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isInviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isInviting ? "Generating..." : "Generate Invite Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Org Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Add Client Organization
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Legal Group"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tenant Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@clientdomain.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
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
