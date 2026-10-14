"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Building2,
  Plus,
  Mail,
  Globe,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function OrganizationsPage() {
  const organizations = useQuery(api.organizations.list);
  const createOrganization = useMutation(api.organizations.create);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    contactEmail: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        slug: "",
        contactEmail: "",
        notes: "",
      });
    } catch (err: any) {
      alert("Error creating organization: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-blue-500" />
            Client Organizations &amp; Workspaces
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage multi-tenant workspaces to isolate client websites, media files, and sensitive credentials.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Client Org
        </button>
      </div>

      {/* Organizations List */}
      {organizations === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <Building2 className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No client organizations created</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Create tenant workspaces to organize client websites and permissions without bleeding information across.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create First Organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org._id}
              className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-zinc-100 text-base">{org.name}</h3>
                  <span className="font-mono text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    /{org.slug}
                  </span>
                </div>

                {org.contactEmail && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <Mail className="h-3 w-3 text-zinc-500" />
                    <span>{org.contactEmail}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Added {new Date(org.createdAt).toLocaleDateString()}
                </span>
                <span className="text-blue-400 font-medium">Active Workspace</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Org Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-400" />
                Add Client Organization
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
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Legal Group"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tenant Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Primary Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@clientdomain.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
