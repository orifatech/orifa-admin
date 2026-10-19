"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@orifa/backend";
import type { Id } from "@orifa/backend";
import {
  GitPullRequest,
  Clock,
  Trash2,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  GitBranch,
  ArrowRight,
  Globe,
  Check,
} from "lucide-react";

export default function ClientChangesPage() {
  const viewer = useQuery(api.users.viewer);
  const orgId = viewer?.organizationId;
  const projects = useQuery(api.projects.list, orgId ? { organizationId: orgId } : {}) || [];
  const subscriptions = useQuery(api.subscriptions.list, orgId ? { organizationId: orgId } : {}) || [];
  const activeSubscription = subscriptions.find((s) => s.status === "active");

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "draft" | "pending_review" | "pr_created" | "merged">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeProjectId = selectedProjectId || (projects.length > 0 ? (projects[0]._id as string) : "");
  const activeProject = projects.find((p) => p._id === activeProjectId);

  const stagedChanges = useQuery(
    api.stagedChanges.listByProject,
    activeProjectId ? { projectId: activeProjectId as Id<"projects"> } : "skip"
  ) || [];

  const discardMutation = useMutation(api.stagedChanges.deleteChange);
  const updateStatusMutation = useMutation(api.stagedChanges.updateStatus);

  const filteredChanges = stagedChanges.filter((ch) => {
    if (filterStatus === "all") return true;
    return ch.status === filterStatus;
  });

  const draftChanges = stagedChanges.filter((ch) => ch.status === "draft");

  const handleBatchSubmit = async () => {
    if (draftChanges.length === 0) return;
    setIsSubmitting(true);
    try {
      for (const ch of draftChanges) {
        await updateStatusMutation({
          changeId: ch._id,
          status: "pending_review",
        });
      }
      setToastMessage(
        activeSubscription
          ? "Staged changes submitted! Auto-PR branch generation queued."
          : "Staged changes submitted to Orifa Technologies engineers for review."
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert("Failed to submit changes: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <Clock className="w-3 h-3 text-gray-500" />
            <span>Staged Draft</span>
          </span>
        );
      case "pending_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Under Review</span>
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Approved</span>
          </span>
        );
      case "pr_created":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-300">
            <GitPullRequest className="w-3 h-3 text-purple-600" />
            <span>PR Created</span>
          </span>
        );
      case "merged":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Merged &amp; Live</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Content Changes &amp; Pull Requests
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review staged visual edits, pending pull requests, and Git deployment approvals{activeProject ? ` for ${activeProject.name}` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 1 && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select
                value={activeProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <span>Open Visual Editor</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Maintenance Tier Banner */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-900">
              {activeSubscription ? (
                <span>Active Retainer Plan: <span className="text-emerald-700 font-bold">{activeSubscription.planName}</span></span>
              ) : (
                <span>Plan: <span className="text-gray-700 font-bold">Self-Managed Maintenance</span></span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {activeSubscription
                ? "Your edits trigger automated branch creation and Pull Requests on GitHub with accelerated deployment."
                : "Your edits are queued for technical review by Orifa Technologies engineers prior to staging and production merge."}
            </p>
          </div>
        </div>

        {draftChanges.length > 0 && (
          <button
            onClick={handleBatchSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit {draftChanges.length} Draft{draftChanges.length > 1 ? "s" : ""} for Review</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-gray-200/80 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-emerald-50 text-emerald-800 font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          All ({stagedChanges.length})
        </button>
        <button
          onClick={() => setFilterStatus("draft")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === "draft"
              ? "bg-emerald-50 text-emerald-800 font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Drafts ({stagedChanges.filter((c) => c.status === "draft").length})
        </button>
        <button
          onClick={() => setFilterStatus("pending_review")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === "pending_review"
              ? "bg-emerald-50 text-emerald-800 font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Under Review ({stagedChanges.filter((c) => c.status === "pending_review").length})
        </button>
        <button
          onClick={() => setFilterStatus("pr_created")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === "pr_created"
              ? "bg-emerald-50 text-emerald-800 font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Pull Requests ({stagedChanges.filter((c) => c.status === "pr_created").length})
        </button>
        <button
          onClick={() => setFilterStatus("merged")}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterStatus === "merged"
              ? "bg-emerald-50 text-emerald-800 font-semibold"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          }`}
        >
          Merged ({stagedChanges.filter((c) => c.status === "merged").length})
        </button>
      </div>

      {/* Changes List */}
      {filteredChanges.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-xl p-12 text-center shadow-xs space-y-3">
          <GitPullRequest className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900">No content changes in this view</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Use the Visual Editor to modify website text, headings, buttons, and images in real time.
          </p>
          <div className="pt-2">
            <Link
              href="/editor"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700"
            >
              <span>Launch Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden divide-y divide-gray-100">
          {filteredChanges.map((change) => (
            <div key={change._id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(change.status)}
                  <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                    {change.contentKey}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {change.targetFile}
                  </span>
                </div>

                {/* Diff Comparison */}
                <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-3 text-xs space-y-1 font-sans">
                  {change.originalValue && (
                    <div className="text-gray-500 flex items-start gap-2">
                      <span className="text-red-600 font-bold font-mono shrink-0">-</span>
                      <span className="line-through break-words text-[11px]">{change.originalValue}</span>
                    </div>
                  )}
                  <div className="text-emerald-800 font-medium flex items-start gap-2">
                    <span className="text-emerald-600 font-bold font-mono shrink-0">+</span>
                    <span className="break-words text-[11px]">{change.proposedValue}</span>
                  </div>
                </div>

                {/* GitHub PR Reference */}
                {change.pullRequestUrl && (
                  <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 w-fit">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Branch: <code className="font-mono">{change.branchName || "orifa-update"}</code></span>
                    <a
                      href={change.pullRequestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold hover:underline ml-2"
                    >
                      <span>PR #{change.pullRequestNumber || "View"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {change.status === "draft" && (
                  <button
                    onClick={() => discardMutation({ changeId: change._id })}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                    title="Discard Staged Edit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
