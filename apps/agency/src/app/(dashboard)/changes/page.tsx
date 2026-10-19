"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  GitPullRequest,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  GitBranch,
  Check,
} from "lucide-react";

export default function GlobalChangesPage() {
  const projects = useQuery(api.projects.list, {}) || [];
  const allChanges = useQuery(api.stagedChanges.list, {}) || [];
  const organizations = useQuery(api.organizations.list, {}) || [];

  const updateStatus = useMutation(api.stagedChanges.updateStatus);
  const deleteChange = useMutation(api.stagedChanges.deleteChange);

  const [selectedFilter, setSelectedFilter] = useState<"pending_review" | "approved" | "pr_created" | "merged" | "all">("pending_review");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredChanges = allChanges.filter((ch) => {
    const matchesStatus = selectedFilter === "all" ? true : ch.status === selectedFilter;
    const matchesProject = selectedProjectId === "all" ? true : ch.projectId === selectedProjectId;
    return matchesStatus && matchesProject;
  });

  const pendingCount = allChanges.filter((c) => c.status === "pending_review").length;
  const approvedCount = allChanges.filter((c) => c.status === "approved").length;
  const prCount = allChanges.filter((c) => c.status === "pr_created").length;
  const mergedCount = allChanges.filter((c) => c.status === "merged").length;

  const handleApprove = async (id: Id<"stagedChanges">) => {
    try {
      await updateStatus({ changeId: id, status: "approved" });
      setToastMessage("Change approved! Ready to publish to GitHub.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert("Error approving change: " + (error.message || "Unknown error"));
    }
  };

  const handleReject = async (id: Id<"stagedChanges">) => {
    const feedback = prompt("Reason for rejection (sent to client):");
    if (feedback === null) return;
    try {
      await updateStatus({
        changeId: id,
        status: "rejected",
        reviewerFeedback: feedback || undefined,
      });
      setToastMessage("Change rejected with feedback.");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert("Error rejecting change: " + (error.message || "Unknown error"));
    }
  };

  const handleDelete = async (id: Id<"stagedChanges">) => {
    if (confirm("Permanently discard this staged change?")) {
      await deleteChange({ changeId: id });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-gray-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Global Staged Content Changes
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Review and approve pending visual edits across all client websites before publishing to GitHub.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
          >
            <option value="all">All Client Sites ({projects.length})</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedFilter("pending_review")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFilter === "pending_review"
              ? "bg-amber-50/60 border-amber-300 shadow-xs"
              : "bg-white border-gray-200/80 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{pendingCount}</div>
        </div>

        <div
          onClick={() => setSelectedFilter("approved")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFilter === "approved"
              ? "bg-blue-50/60 border-blue-300 shadow-xs"
              : "bg-white border-gray-200/80 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{approvedCount}</div>
        </div>

        <div
          onClick={() => setSelectedFilter("pr_created")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFilter === "pr_created"
              ? "bg-purple-50/60 border-purple-300 shadow-xs"
              : "bg-white border-gray-200/80 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold text-gray-700">PRs on GitHub</span>
            <GitPullRequest className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{prCount}</div>
        </div>

        <div
          onClick={() => setSelectedFilter("merged")}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedFilter === "merged"
              ? "bg-emerald-50/60 border-emerald-300 shadow-xs"
              : "bg-white border-gray-200/80 hover:border-gray-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Merged &amp; Live</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{mergedCount}</div>
        </div>
      </div>

      {/* Changes Roster */}
      {filteredChanges.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-xl p-12 text-center shadow-xs space-y-3">
          <GitPullRequest className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900">No staged changes found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            All client edits are currently up to date, or none match the selected filter.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden divide-y divide-gray-100">
          {filteredChanges.map((change) => {
            const project = projects.find((p) => p._id === change.projectId);
            const org = organizations.find((o) => o._id === change.organizationId);

            return (
              <div
                key={change._id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      {project?.name || "Client Website"}
                    </span>
                    {org && (
                      <span className="text-[11px] text-gray-500 font-medium">
                        ({org.name})
                      </span>
                    )}
                    <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {change.contentKey}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {change.targetFile}
                    </span>
                  </div>

                  {/* Diff Preview */}
                  <div className="bg-gray-50 border border-gray-200/80 rounded-lg p-3 text-xs space-y-1">
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

                  {/* Feedback or PR Link */}
                  {change.reviewerFeedback && (
                    <div className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                      Feedback: {change.reviewerFeedback}
                    </div>
                  )}

                  {change.pullRequestUrl && (
                    <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 w-fit">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>PR #{change.pullRequestNumber || "View"}</span>
                      <a
                        href={change.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:underline flex items-center gap-1 ml-1"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {change.status === "pending_review" && (
                    <>
                      <button
                        onClick={() => handleApprove(change._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(change._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  <Link
                    href={`/projects/${change.projectId}/changes`}
                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                    title="Open Project Change Review & GitHub Publishing"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(change._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                    title="Discard change"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
