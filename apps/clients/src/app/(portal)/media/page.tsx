"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@orifa/backend";
import type { Id } from "@orifa/backend";
import {
  Image as ImageIcon,
  Upload,
  FileImage,
  Copy,
  Check,
  Sparkles,
  Globe,
  ExternalLink,
} from "lucide-react";

export default function ClientMediaPage() {
  const viewer = useQuery(api.users.viewer);
  const orgId = viewer?.organizationId;
  const projects = useQuery(api.projects.list, orgId ? { organizationId: orgId } : {}) || [];

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeProjectId = selectedProjectId || (projects.length > 0 ? (projects[0]._id as string) : "");
  const activeProject = projects.find((p) => p._id === activeProjectId);

  const mediaAssets = useQuery(
    api.media.listByProject,
    activeProjectId ? { projectId: activeProjectId as Id<"projects"> } : "skip"
  ) || [];

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const optimizeToWebp = useAction(api.actions.optimizeImage.optimizeToWebp);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProjectId) return;

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading ${file.name}...`);

        // 1. Get temporary upload URL
        const uploadUrl = await generateUploadUrl({
          projectId: activeProjectId as Id<"projects">,
        });

        // 2. Upload to Convex storage
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await uploadRes.json();

        // 3. Convert to WebP via Sharp action
        setUploadProgressText(`Optimizing ${file.name} to WebP...`);
        await optimizeToWebp({
          projectId: activeProjectId as Id<"projects">,
          storageId,
          originalFilename: file.name,
        });
      }

      setToastMessage("Image converted to WebP and saved to your asset library!");
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert("Error uploading media: " + (error.message || "Unknown error"));
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
    }
  };

  const copyPath = (id: string, path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-gray-700 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
            Media &amp; WebP Asset Library
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Uploaded images are automatically compressed into modern next-gen WebP format for fast web performance{activeProject ? ` for ${activeProject.name}` : ""}.
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

          <div>
            <input
              type="file"
              id="media-file-input"
              accept="image/*"
              disabled={isUploading || !activeProjectId}
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="media-file-input"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? uploadProgressText : "Upload New Image"}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-900">Automatic WebP Optimization</div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Every PNG and JPEG you upload is processed through Sharp to reduce bandwidth without visual fidelity loss. The generated repo destination paths are ready for use in your website code and visual editor.
          </p>
        </div>
      </div>

      {/* Media Assets Grid */}
      {mediaAssets.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center shadow-xs space-y-3">
          <FileImage className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900">No media assets found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Upload hero images, team photos, or product assets to automatically optimize them for your website.
          </p>
          <div className="pt-2">
            <label
              htmlFor="media-file-input"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File</span>
            </label>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaAssets.map((asset) => (
            <div
              key={asset._id}
              className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs hover:border-emerald-500 transition-colors flex flex-col justify-between group"
            >
              {/* Image Preview Box */}
              <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
                {asset.url ? (
                  <Image
                    src={asset.url}
                    alt={asset.originalName}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                  WebP
                </div>
              </div>

              {/* Asset Details */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <p className="font-semibold text-gray-900 truncate" title={asset.originalName}>
                    {asset.originalName}
                  </p>
                  <span className="text-[10px] text-gray-400 shrink-0 font-mono ml-2">
                    {formatBytes(asset.sizeBytes)}
                  </span>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded p-1.5 text-[11px] font-mono text-gray-600 truncate flex items-center justify-between">
                  <span className="truncate">{asset.repoDestinationPath}</span>
                  <button
                    onClick={() => copyPath(asset._id, asset.repoDestinationPath)}
                    className="text-gray-400 hover:text-emerald-700 p-1 shrink-0 transition-colors"
                    title="Copy repo destination path"
                  >
                    {copiedId === asset._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {asset.url && (
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline pt-1"
                  >
                    <span>View full size</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
