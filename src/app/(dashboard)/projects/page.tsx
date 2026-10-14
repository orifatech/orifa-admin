"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  Globe,
  Plus,
  GitBranch,
  ExternalLink,
  Edit3,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ProjectsPage() {
  const projects = useQuery(api.projects.list, {});
  const organizations = useQuery(api.organizations.list);
  const createProject = useMutation(api.projects.create);
  const updateProject = useMutation(api.projects.update);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);

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
    gitPublishMode: "pull_request" as "pull_request" | "direct_commit",
    hasMaintenanceContract: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.name) return;

    try {
      setIsSubmitting(true);
      await createProject({
        organizationId: formData.organizationId as Id<"organizations">,
        name: formData.name,
        productionUrl: formData.productionUrl,
        stagingUrl: formData.stagingUrl || undefined,
        framework: formData.framework,
        githubRepoOwner: formData.githubRepoOwner,
        githubRepoName: formData.githubRepoName,
        githubDefaultBranch: formData.githubDefaultBranch,
        contentRootPath: formData.contentRootPath,
        gitPublishMode: formData.gitPublishMode,
        hasMaintenanceContract: formData.hasMaintenanceContract,
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
        gitPublishMode: "pull_request",
        hasMaintenanceContract: true,
      });
    } catch (err: any) {
      alert(err.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    try {
      setIsSubmitting(true);
      await updateProject({
        projectId: editingProject._id,
        gitPublishMode: editingProject.gitPublishMode,
        hasMaintenanceContract: editingProject.hasMaintenanceContract,
        githubDefaultBranch: editingProject.githubDefaultBranch,
        contentRootPath: editingProject.contentRootPath,
      });
      setEditingProject(null);
    } catch (err: any) {
      alert(err.message || "Failed to update project settings");
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
          <Globe className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No websites configured yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Connect your first client website to enable in-place visual editing and Git-synced content publishing.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" /> Connect Client Site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isDirectCommit = project.gitPublishMode === "direct_commit";

            return (
              <div
                key={project._id}
                className="group relative bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                        {project.framework}
                      </span>
                      <button
                        onClick={() =>
                          setEditingProject({
                            ...project,
                            gitPublishMode: project.gitPublishMode || "pull_request",
                            hasMaintenanceContract:
                              project.hasMaintenanceContract ??
                              (project.gitPublishMode !== "direct_commit"),
                          })
                        }
                        title="Configure Git Strategy & Maintenance Settings"
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Git Strategy Badge */}
                  <div className="mb-3">
                    {isDirectCommit ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/25">
                        <Zap className="h-3 w-3" />
                        Direct to Production (No Contract)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/25">
                        <ShieldCheck className="h-3 w-3" />
                        PR Review (Maintenance Plan)
                      </span>
                    )}
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
            );
          })}
        </div>
      )}

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
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
                  <option value="">Select a client organization...</option>
                  {organizations?.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Website Name & Framework */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Website Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Marketing Site"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Framework *
                  </label>
                  <select
                    value={formData.framework}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        framework: e.target.value as "astro" | "nextjs" | "react",
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="astro">Astro (Content Collections)</option>
                    <option value="nextjs">Next.js (App Router)</option>
                    <option value="react">React / Vite</option>
                  </select>
                </div>
              </div>

              {/* Production & Staging URLs */}
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

              {/* Git & Maintenance Strategy Configuration */}
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-lg space-y-2.5">
                <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  Maintenance Contract &amp; Git Deployment Strategy
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Configure whether this client requires agency PR review or commits directly to production.
                </p>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <label
                    onClick={() =>
                      setFormData({
                        ...formData,
                        gitPublishMode: "pull_request",
                        hasMaintenanceContract: true,
                      })
                    }
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      formData.gitPublishMode === "pull_request"
                        ? "bg-purple-950/20 border-purple-500/50 text-purple-200"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="publishMode"
                      value="pull_request"
                      checked={formData.gitPublishMode === "pull_request"}
                      onChange={() => {}}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                        Pull Request Review Workflow
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                          Maintenance Contract
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Edits create an automated feature branch and open a GitHub Pull Request. You review and merge before going live.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() =>
                      setFormData({
                        ...formData,
                        gitPublishMode: "direct_commit",
                        hasMaintenanceContract: false,
                      })
                    }
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      formData.gitPublishMode === "direct_commit"
                        ? "bg-amber-950/20 border-amber-500/50 text-amber-200"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="publishMode"
                      value="direct_commit"
                      checked={formData.gitPublishMode === "direct_commit"}
                      onChange={() => {}}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        Direct Commit to Production
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          No Maintenance Plan
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Edits commit directly to the default branch (<code className="font-mono text-zinc-300">main</code>), updating production immediately without review.
                      </p>
                    </div>
                  </label>
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
                      Production Branch
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

      {/* Edit / Quick-Settings Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-500" />
                Settings: {editingProject.name}
              </h2>
              <button
                onClick={() => setEditingProject(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-zinc-300">
                  Client Git Publishing Strategy
                </label>
                <p className="text-[11px] text-zinc-400">
                  Switch this client between Pull Request review and Direct Commit to production.
                </p>

                <div className="space-y-2 pt-1">
                  <label
                    onClick={() =>
                      setEditingProject({
                        ...editingProject,
                        gitPublishMode: "pull_request",
                        hasMaintenanceContract: true,
                      })
                    }
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      editingProject.gitPublishMode === "pull_request"
                        ? "bg-purple-950/20 border-purple-500/50 text-purple-200"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editPublishMode"
                      value="pull_request"
                      checked={editingProject.gitPublishMode === "pull_request"}
                      onChange={() => {}}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                        Pull Request Review
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Client has an active maintenance contract. Agency reviews all edits via GitHub PR before merging.
                      </p>
                    </div>
                  </label>

                  <label
                    onClick={() =>
                      setEditingProject({
                        ...editingProject,
                        gitPublishMode: "direct_commit",
                        hasMaintenanceContract: false,
                      })
                    }
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      editingProject.gitPublishMode === "direct_commit"
                        ? "bg-amber-950/20 border-amber-500/50 text-amber-200"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="editPublishMode"
                      value="direct_commit"
                      checked={editingProject.gitPublishMode === "direct_commit"}
                      onChange={() => {}}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        Direct Commit to Production
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        No maintenance contract. Edits commit directly to <code className="font-mono text-zinc-300">{editingProject.githubDefaultBranch}</code> without review.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Production Branch
                </label>
                <input
                  type="text"
                  value={editingProject.githubDefaultBranch}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      githubDefaultBranch: e.target.value,
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
