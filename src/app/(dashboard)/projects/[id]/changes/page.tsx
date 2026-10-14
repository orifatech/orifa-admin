"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  Trash2,
  FileCode,
  Sparkles,
  GitBranch,
  AlertCircle,
} from "lucide-react";

export default function StagedChangesPage() {
  const params = useParams();
  const projectId = params.id as any;

  const project = useQuery(api.projects.get, { projectId });
  const changes = useQuery(api.stagedChanges.listByProject, { projectId });
  const updateStatus = useMutation(api.stagedChanges.updateStatus);
  const deleteChange = useMutation(api.stagedChanges.deleteChange);
  const createPullRequest = useAction(api.actions.github.createPullRequest);

  const [selectedChangeIds, setSelectedChangeIds] = useState<string[]>([]);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prDescription, setPrDescription] = useState("");
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [createdPRResult, setCreatedPRResult] = useState<{
    pullRequestUrl: string;
    pullRequestNumber: number;
    branchName: string;
  } | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500 animate-pulse text-sm">Loading Staged Changes...</div>
      </div>
    );
  }

  const toggleSelect = (id: string) => {
    setSelectedChangeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleApprove = async (id: any) => {
    await updateStatus({ changeId: id, status: "approved" });
  };

  const handleReject = async (id: any) => {
    const feedback = prompt("Reason for rejection (optional):");
    await updateStatus({
      changeId: id,
      status: "rejected",
      reviewerFeedback: feedback || undefined,
    });
  };

  const handleDelete = async (id: any) => {
    if (confirm("Discard this staged edit?")) {
      await deleteChange({ changeId: id });
    }
  };

  const handleOpenPRModal = () => {
    const defaultTitle = `CMS Updates for ${project.name} (${selectedChangeIds.length} changes)`;
    setPrTitle(defaultTitle);
    setIsPRModalOpen(true);
  };

  const handleCreatePR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChangeIds.length === 0) return;

    try {
      setIsCreatingPR(true);
      const res = await createPullRequest({
        projectId,
        changeIds: selectedChangeIds as any,
        customTitle: prTitle,
        customDescription: prDescription || undefined,
      });
      setCreatedPRResult(res);
      setSelectedChangeIds([]);
    } catch (err: any) {
      alert("Error creating Pull Request: " + err.message);
    } finally {
      setIsCreatingPR(false);
    }
  };

  const pendingOrApproved = changes?.filter(
    (c) => c.status === "pending_review" || c.status === "approved"
  ) || [];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/projects"
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Back to Sites
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-zinc-400">{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <GitPullRequest className="h-6 w-6 text-blue-500" />
            Staged Changes Queue
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Review proposed client content edits, inspect side-by-side diffs, and generate GitHub Pull Requests.
          </p>
        </div>

        {/* PR Action Button */}
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project._id}/preview`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700/60"
          >
            Live Preview
          </Link>
          <button
            onClick={handleOpenPRModal}
            disabled={selectedChangeIds.length === 0}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
          >
            <Sparkles className="h-4 w-4" />
            Create Pull Request ({selectedChangeIds.length})
          </button>
        </div>
      </div>

      {/* Changes List */}
      {changes === undefined ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500/80 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">All caught up!</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            No staged changes waiting for review. You can make visual changes anytime in the Live Editor.
          </p>
          <Link
            href={`/projects/${project._id}/preview`}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Open Live Visual Editor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Batch Selector Bar */}
          <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/40 px-4 py-2.5 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  pendingOrApproved.length > 0 &&
                  selectedChangeIds.length === pendingOrApproved.length
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedChangeIds(pendingOrApproved.map((c) => c._id));
                  } else {
                    setSelectedChangeIds([]);
                  }
                }}
                className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
              />
              <span>Select all pending / approved ({pendingOrApproved.length})</span>
            </div>
            <span>{changes.length} total edits logged</span>
          </div>

          {/* Change Cards */}
          {changes.map((change) => {
            const isSelected = selectedChangeIds.includes(change._id);

            return (
              <div
                key={change._id}
                className={`bg-zinc-900/70 border rounded-xl p-5 transition-all space-y-4 ${
                  isSelected
                    ? "border-blue-500/50 bg-blue-950/10"
                    : "border-zinc-800 hover:border-zinc-700/80"
                }`}
              >
                {/* Meta Bar */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(change._id)}
                      className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
                    />
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                      <FileCode className="h-4 w-4 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-blue-400">{change.targetFile}</span>
                      <span className="text-zinc-600">→</span>
                      <span className="text-zinc-400 font-medium">#{change.contentKey}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        change.status === "pr_created"
                          ? "bg-purple-950/60 text-purple-400 border-purple-800/40"
                          : change.status === "approved"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : change.status === "rejected"
                          ? "bg-rose-950/60 text-rose-400 border-rose-800/40"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/40"
                      }`}
                    >
                      {change.status.replace("_", " ")}
                    </span>

                    {/* Pull Request Link if created */}
                    {change.pullRequestUrl && (
                      <a
                        href={change.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 underline font-mono"
                      >
                        PR #{change.pullRequestNumber}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Diff Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Original */}
                  <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      Current Live Value
                    </div>
                    <div className="text-zinc-400 line-through whitespace-pre-wrap break-words">
                      {change.originalValue || "(Empty / New Content)"}
                    </div>
                  </div>

                  {/* Proposed */}
                  <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-900/30 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">
                      Proposed Client Update
                    </div>
                    <div className="text-emerald-300 font-medium whitespace-pre-wrap break-words">
                      {change.proposedValue}
                    </div>
                  </div>
                </div>

                {/* Feedback note if rejected */}
                {change.reviewerFeedback && (
                  <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>Feedback: {change.reviewerFeedback}</span>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
                  <div className="text-zinc-500 text-[11px]">
                    Staged {new Date(change.createdAt).toLocaleDateString()} at{" "}
                    {new Date(change.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  <div className="flex items-center gap-2">
                    {change.status !== "approved" && change.status !== "pr_created" && (
                      <button
                        onClick={() => handleApprove(change._id)}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 px-2.5 py-1 rounded transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Approve
                      </button>
                    )}

                    {change.status !== "rejected" && change.status !== "pr_created" && (
                      <button
                        onClick={() => handleReject(change._id)}
                        className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1 rounded transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(change._id)}
                      className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                      title="Discard"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GitHub PR Modal */}
      {isPRModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-400" />
                Open GitHub Pull Request
              </h2>
              <button
                onClick={() => {
                  setIsPRModalOpen(false);
                  setCreatedPRResult(null);
                }}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            {createdPRResult ? (
              <div className="space-y-4 py-2 text-center">
                <div className="h-12 w-12 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-zinc-100">Pull Request Created!</h3>
                <p className="text-xs text-zinc-400">
                  Branch <code className="font-mono text-zinc-300">{createdPRResult.branchName}</code> has
                  been pushed and a Pull Request is ready for your review.
                </p>
                <div className="pt-2">
                  <a
                    href={createdPRResult.pullRequestUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    View Pull Request #{createdPRResult.pullRequestNumber} on GitHub
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreatePR} className="space-y-4">
                <div className="text-xs text-zinc-400">
                  You are preparing a Pull Request with <strong>{selectedChangeIds.length}</strong> staged
                  update(s) targeting{" "}
                  <code className="text-zinc-300 font-mono">
                    {project.githubRepoOwner}/{project.githubRepoName}:{project.githubDefaultBranch}
                  </code>
                  .
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Pull Request Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={prTitle}
                    onChange={(e) => setPrTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Custom Description / Review Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any additional context for the review..."
                    value={prDescription}
                    onChange={(e) => setPrDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-xs text-zinc-400 space-y-1">
                  <div className="font-semibold text-zinc-300">Automation Steps:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>Creates unique feature branch <code className="text-zinc-300 font-mono">orifa-update-[timestamp]</code></li>
                    <li>Modifies JSON &amp; Markdown files in repository</li>
                    <li>Opens formatted Pull Request with diff breakdown</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsPRModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPR}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {isCreatingPR ? "Opening PR on GitHub..." : "Confirm & Open PR"}
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
