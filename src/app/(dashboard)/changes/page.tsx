"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { GitPullRequest, ArrowRight, Globe } from "lucide-react";

export default function GlobalChangesPage() {
  const projects = useQuery(api.projects.list, {});

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
          <GitPullRequest className="h-6 w-6 text-blue-500" />
          Review Staged Changes Across Client Sites
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Select a client website to inspect pending visual edits and approve GitHub Pull Requests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects?.map((project) => (
          <Link
            key={project._id}
            href={`/projects/${project._id}/changes`}
            className="p-5 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center justify-between group transition-all"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                  {project.name}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono truncate">
                {project.githubRepoOwner}/{project.githubRepoName}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-400 group-hover:text-zinc-200">View Queue</span>
              <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
