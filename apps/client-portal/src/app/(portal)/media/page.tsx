"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@orifa/backend";
import { Image as ImageIcon, Upload, FileImage } from "lucide-react";

export default function ClientMediaPage() {
  const projects = useQuery(api.projects.list, {}) || [];
  const activeProject = projects[0];

  const mediaAssets = useQuery(
    api.media.listByProject,
    activeProject ? { projectId: activeProject._id } : "skip"
  ) || [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Media & Asset Library
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Uploaded images are automatically converted to optimized WebP format with zero visual quality loss.
          </p>
        </div>

        <button
          onClick={() => alert("Upload dialog")}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors self-start"
        >
          <Upload className="w-4 h-4" />
          Upload New Image
        </button>
      </div>

      {mediaAssets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <FileImage className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="font-semibold text-zinc-900 dark:text-white text-base">No media assets found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Upload product photos, blog images, or team headshots to optimize and include them in your site.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {mediaAssets.map((asset) => (
            <div
              key={asset._id}
              className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs hover:border-indigo-500 transition-colors"
            >
              <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                  {asset.originalName}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {(asset.sizeBytes / 1024).toFixed(1)} KB • WebP
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
