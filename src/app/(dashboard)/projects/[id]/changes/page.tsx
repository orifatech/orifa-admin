"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
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
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function StagedChangesPage() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

  const project = useQuery(api.projects.get, { projectId });
  const changes = useQuery(api.stagedChanges.listByProject, { projectId });
  const updateStatus = useMutation(api.stagedChanges.updateStatus);
  const deleteChange = useMutation(api.stagedChanges.deleteChange);
  const publishChanges = useAction(api.actions.github.publishChanges);

  const [selectedChangeIds, setSelectedChangeIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    mode: "pull_request" | "direct_commit";
    pullRequestUrl?: string;
    pullRequestNumber?: number;
    commitUrl?: string;
    commitSha?: string;
    branchName: string;
  } | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500 animate-pulse text-sm">Loading Staged Changes...</div>
      </div>
    );
  }

  const isDirectCommit = project.gitPublishMode === "direct_commit";

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

  const handleOpenActionModal = () => {
    const defaultTitle = isDirectCommit
      ? `CMS Direct Update for ${project.name} (${selectedChangeIds.length} changes)`
      : `CMS Updates for ${project.name} (${selectedChangeIds.length} changes)`;
    setActionTitle(defaultTitle);
    setIsModalOpen(true);
  };

  const handleExecutePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedChangeIds.length === 0) return;

    try {
      setIsPublishing(true);
      const res = await publishChanges({
        projectId,
        changeIds: selectedChangeIds as any,
        customTitle: actionTitle,
        customDescription: actionDescription || undefined,
      });
      setPublishResult(res);
      setSelectedChangeIds([]);
    } catch (err: any) {
      alert("Error publishing changes: " + err.message);
    } finally {
      setIsPublishing(false);
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

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <GitPullRequest className="h-6 w-6 text-blue-500" />
              Staged Changes Queue
            </h1>
            {isDirectCommit ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/25">
                <Zap className="h-3.5 w-3.5" />
                Direct Commit Mode (No Contract)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border bg-purple-500/10 text-purple-400 border-purple-500/25">
                <ShieldCheck className="h-3.5 w-3.5" />
                PR Review Mode (Maintenance Plan)
              </span>
            )}
          </div>

          <p className="text-sm text-zinc-400 mt-1">
            {isDirectCommit
              ? `Review proposed client content edits and commit directly to production branch (${project.githubDefaultBranch}).`
              : "Review proposed client content edits, inspect side-by-side diffs, and generate GitHub Pull Requests for agency review."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project._id}/preview`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700/60"
          >
            Live Preview
          </Link>
          {isDirectCommit ? (
            <button
              onClick={handleOpenActionModal}
              disabled={selectedChangeIds.length === 0}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Zap className="h-4 w-4" />
              Commit to Production ({selectedChangeIds.length})
            </button>
          ) : (
            <button
              onClick={handleOpenActionModal}
              disabled={selectedChangeIds.length === 0}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
            >
              <Sparkles className="h-4 w-4" />
              Create Pull Request ({selectedChangeIds.length})
            </button>
          )}
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
                className="rounded border-zinc-700 bg-zinc-800 text-blue-600"
              />
              <span>
                {selectedChangeIds.length} of {pendingOrApproved.length} ready change(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400">Targeting repository:</span>
              <span className="font-mono text-zinc-300 text-[11px] bg-zinc-800 px-2 py-0.5 rounded">
                {project.githubRepoOwner}/{project.githubRepoName} ({project.githubDefaultBranch})
              </span>
            </div>
          </div>

          {/* Individual Diff Cards */}
          {changes.map((change) => {
            const isSelected = selectedChangeIds.includes(change._id);
            const isPendingOrApproved =
              change.status === "pending_review" || change.status === "approved";

            return (
              <div
                key={change._id}
                className={`bg-zinc-900/50 border rounded-xl p-5 transition-all space-y-4 ${
                  isSelected
                    ? "border-blue-500/60 ring-1 ring-blue-500/30"
                    : "border-zinc-800 hover:border-zinc-700/80"
                }`}
              >
                {/* Diff Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {isPendingOrApproved && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(change._id)}
                        className="rounded border-zinc-700 bg-zinc-800 text-blue-600 mt-0.5"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <FileCode className="h-4 w-4 text-zinc-400" />
                        <span className="font-mono text-xs font-semibold text-zinc-200">
                          {change.targetFile}
                        </span>
                        <span className="text-zinc-600">→</span>
                        <span className="font-mono text-xs text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/50">
                          {change.contentKey}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
                        <span>Type: {change.contentType}</span>
                        <span>•</span>
                        <span>Staged: {new Date(change.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Review Controls */}
                  <div className="flex items-center gap-2">
                    {change.status === "pending_review" && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full border border-amber-500/20 font-medium">
                        <Clock className="h-3 w-3" /> Pending Review
                      </span>
                    )}
                    {change.status === "approved" && (
                      <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 text-xs px-2.5 py-1 rounded-full border border-blue-500/20 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Approved for Commit
                      </span>
                    )}
                    {change.status === "pr_created" && (
                      <a
                        href={change.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs px-2.5 py-1 rounded-full border border-purple-500/20 font-medium transition-colors"
                      >
                        <GitBranch className="h-3 w-3" /> PR #{change.pullRequestNumber} Opened
                        <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    )}
                    {change.status === "merged" && (
                      <a
                        href={change.commitUrl || change.pullRequestUrl || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium transition-colors"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Live in Production
                        <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    )}
                    {change.status === "rejected" && (
                      <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/20 font-medium">
                        <XCircle className="h-3 w-3" /> Rejected
                      </span>
                    )}

                    {/* Inline Actions */}
                    {change.status === "pending_review" && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => handleApprove(change._id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 transition-colors"
                          title="Approve change"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(change._id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-rose-400 transition-colors"
                          title="Reject change"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleDelete(change._id)}
                      className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors ml-1"
                      title="Discard change"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Side-by-Side Visual Diff */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  {/* Original Value */}
                  <div className="bg-rose-950/10 border border-rose-900/30 rounded-lg p-3 space-y-1">
                    <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider">
                      Current Value in Git
                    </div>
                    <div className="text-rose-200/90 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                      {change.originalValue || <span className="text-zinc-600 italic">(Empty / New Key)</span>}
                    </div>
                  </div>

                  {/* Proposed Value */}
                  <div className="bg-emerald-950/15 border border-emerald-900/30 rounded-lg p-3 space-y-1">
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Proposed Client Change
                    </div>
                    <div className="text-emerald-200 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                      {change.proposedValue}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Publish Action Modal (PR or Direct Commit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                {isDirectCommit ? (
                  <>
                    <Zap className="h-5 w-5 text-amber-400" />
                    Commit Directly to Production
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Create GitHub Pull Request
                  </>
                )}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setPublishResult(null);
                }}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            {publishResult ? (
              <div className="space-y-4 py-2 text-center">
                <div
                  className={`h-12 w-12 rounded-full mx-auto flex items-center justify-center ${
                    publishResult.mode === "direct_commit"
                      ? "bg-emerald-950/60 border border-emerald-800/40 text-emerald-400"
                      : "bg-purple-950/60 border border-purple-800/40 text-purple-400"
                  }`}
                >
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-zinc-100">
                  {publishResult.mode === "direct_commit"
                    ? "Production Update Committed!"
                    : "Pull Request Created!"}
                </h3>
                <p className="text-xs text-zinc-400">
                  {publishResult.mode === "direct_commit" ? (
                    <>
                      Changes have been committed directly to{" "}
                      <code className="font-mono text-zinc-300">{publishResult.branchName}</code>.
                      Your hosting provider (Vercel/Netlify/Cloudflare) will deploy the update live.
                    </>
                  ) : (
                    <>
                      Branch <code className="font-mono text-zinc-300">{publishResult.branchName}</code> has
                      been pushed and a Pull Request is ready for your team's review.
                    </>
                  )}
                </p>
                <div className="pt-2">
                  {publishResult.mode === "direct_commit" ? (
                    <a
                      href={publishResult.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      View Commit on GitHub
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <a
                      href={publishResult.pullRequestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      View Pull Request #{publishResult.pullRequestNumber} on GitHub
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecutePublish} className="space-y-4">
                <div className="text-xs text-zinc-400">
                  You are preparing to publish <strong>{selectedChangeIds.length}</strong> staged
                  update(s) targeting{" "}
                  <code className="text-zinc-300 font-mono">
                    {project.githubRepoOwner}/{project.githubRepoName}:{project.githubDefaultBranch}
                  </code>
                  .
                </div>

                {isDirectCommit && (
                  <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg text-xs text-amber-200/90 flex items-start gap-2.5">
                    <Zap className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-300">Direct Commit Notice:</div>
                      <p className="text-[11px] text-amber-400/80 mt-0.5">
                        This client does not have a maintenance contract. Committing will immediately push to the production branch without opening a review PR.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    {isDirectCommit ? "Commit Message / Title *" : "Pull Request Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    {isDirectCommit ? "Commit Description / Notes (Optional)" : "Reviewer Notes (Optional)"}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any additional context for the update..."
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-xs text-zinc-400 space-y-1">
                  <div className="font-semibold text-zinc-300">Automation Steps:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    {isDirectCommit ? (
                      <>
                        <li>Fetches latest content from <code className="text-zinc-300 font-mono">{project.githubDefaultBranch}</code></li>
                        <li>Applies changes and commits directly to production</li>
                        <li>Marks staged diff items as merged and live</li>
                      </>
                    ) : (
                      <>
                        <li>Creates unique feature branch <code className="text-zinc-300 font-mono">orifa-update-[timestamp]</code></li>
                        <li>Commits modified files to feature branch</li>
                        <li>Opens formatted Pull Request with diff breakdown for review</li>
                      </>
                    )}
                  </ul>
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
                    disabled={isPublishing}
                    className={`disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isDirectCommit
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-purple-600 hover:bg-purple-500"
                    }`}
                  >
                    {isPublishing
                      ? isDirectCommit
                        ? "Committing to Production..."
                        : "Opening PR on GitHub..."
                      : isDirectCommit
                      ? `Confirm & Commit to ${project.githubDefaultBranch}`
                      : "Confirm & Open PR"}
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
