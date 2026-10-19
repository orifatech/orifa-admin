"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@orifa/backend";
import {
  GitPullRequest,
  Clock,
  Trash2,
} from "lucide-react";

export default function ClientChangesPage() {
  const projects = useQuery(api.projects.list, {}) || [];
  const selectedProject = projects[0];

  const stagedChanges = useQuery(
    api.stagedChanges.listByProject,
    selectedProject ? { projectId: selectedProject._id } : "skip"
  ) || [];

  const discardMutation = useMutation(api.stagedChanges.deleteChange);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Content Changes & Pull Requests
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Review staged text edits, pending pull requests, and approval status from the Orifa team.
        </p>
      </div>

      {stagedChanges.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <GitPullRequest className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">No pending changes</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            All your website updates are currently merged into production. Use the Visual Editor to modify copy or assets.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Staged Updates ({stagedChanges.length})
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {stagedChanges.map((change) => (
              <div key={change._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Clock className="w-3 h-3" /> Staged
                    </span>
                    <span className="text-xs font-mono text-zinc-500">{change.targetFile}</span>
                  </div>

                  <div className="mt-2 text-xs">
                    <span className="line-through text-rose-500 mr-2">{change.originalValue}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{change.proposedValue}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => discardMutation({ changeId: change._id })}
                    className="p-2 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Discard Staged Change"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
