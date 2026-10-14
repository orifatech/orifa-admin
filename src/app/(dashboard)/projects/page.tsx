"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Globe,
  Plus,
  ExternalLink,
  GitBranch,
  Edit3,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list, {});
  const organizations = useQuery(api.organizations.list);
  const createProject = useMutation(api.projects.create);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: "",
    name: "",
    productionUrl: "",
    stagingUrl: "",
    framework: "astro" as "astro" | "nextjs" | "react",
    githubRepoOwner: "",
    githubRepoName: "",
    githubDefaultBranch: "main",
    contentRootPath: "src/content",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.name) return;

    try {
      setIsSubmitting(true);
      await createProject({
        organizationId: formData.organizationId as any,
        name: formData.name,
        productionUrl: formData.productionUrl,
        stagingUrl: formData.stagingUrl || undefined,
        framework: formData.framework,
        githubRepoOwner: formData.githubRepoOwner,
        githubRepoName: formData.githubRepoName,
        githubDefaultBranch: formData.githubDefaultBranch,
        contentRootPath: formData.contentRootPath,
      });
      setIsModalOpen(false);
      setFormData({
        organizationId: "",
        name: "",
        productionUrl: "",
        stagingUrl: "",
        framework: "astro",
        githubRepoOwner: "",
        githubRepoName: "",
        githubDefaultBranch: "main",
        contentRootPath: "src/content",
      });
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Globe className="h-6 w-6 text-blue-500" />
            Client Websites & Projects
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage Git-backed client sites, live in-place visual editing, and staged updates.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Client Site
        </button>
      </div>

      {/* Projects Grid */}
      {projects === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <div className="mx-auto h-12 w-12 rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 mb-4">
            <Globe className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-200">No websites registered yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-6">
            Connect an Astro, Next.js, or React client website to enable live visual editing and Pull Request workflows.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-black/40"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-100 text-base truncate group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h3>
                    <a
                      href={project.productionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span>{project.productionUrl.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                    {project.framework}
                  </span>
                </div>

                {/* Git Repo Info */}
                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/80 mb-4">
                  <GitBranch className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate text-zinc-300">
                    {project.githubRepoOwner}/{project.githubRepoName}
                  </span>
                  <span className="text-[10px] text-zinc-400 shrink-0 ml-auto font-mono">
                    ({project.githubDefaultBranch})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800/80">
                <Link
                  href={`/projects/${project._id}/preview`}
                  className="inline-flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Visual Editor
                </Link>
                <Link
                  href={`/projects/${project._id}/changes`}
                  className="inline-flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium py-2 rounded-lg transition-colors border border-zinc-700/60"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Diff Queue
                </Link>
                <Link
                  href={`/projects/${project._id}/blog`}
                  className="inline-flex items-center justify-center gap-1.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Blog Posts
                </Link>
                <Link
                  href={`/projects/${project._id}/media`}
                  className="inline-flex items-center justify-center gap-1.5 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium py-1.5 rounded-lg transition-colors"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Media Assets
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Connect New Website
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Organization Select */}
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
                  <option value="">Select an organization...</option>
                  {organizations?.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Site Name & Framework */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Website Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Studio"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Framework
                  </label>
                  <select
                    value={formData.framework}
                    onChange={(e) => setFormData({ ...formData, framework: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="astro">Astro JS</option>
                    <option value="nextjs">Next.js</option>
                    <option value="react">React / Vite</option>
                  </select>
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Production URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com"
                    value={formData.productionUrl}
                    onChange={(e) => setFormData({ ...formData, productionUrl: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Staging URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://staging.example.com"
                    value={formData.stagingUrl}
                    onChange={(e) => setFormData({ ...formData, stagingUrl: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GitHub Settings */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg space-y-3">
                <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-blue-400" />
                  GitHub Repository Configuration
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Repo Owner (User/Org) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. orifatech"
                      value={formData.githubRepoOwner}
                      onChange={(e) => setFormData({ ...formData, githubRepoOwner: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Repository Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. client-website"
                      value={formData.githubRepoName}
                      onChange={(e) => setFormData({ ...formData, githubRepoName: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Base Branch
                    </label>
                    <input
                      type="text"
                      value={formData.githubDefaultBranch}
                      onChange={(e) => setFormData({ ...formData, githubDefaultBranch: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Content Root Path
                    </label>
                    <input
                      type="text"
                      value={formData.contentRootPath}
                      onChange={(e) => setFormData({ ...formData, contentRootPath: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? "Connecting..." : "Register Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
