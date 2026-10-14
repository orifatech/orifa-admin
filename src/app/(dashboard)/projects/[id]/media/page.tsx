"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Image as ImageIcon,
  UploadCloud,
  Copy,
  Check,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function MediaAssetsPage() {
  const params = useParams();
  const projectId = params.id as any;

  const project = useQuery(api.projects.get, { projectId });
  const assets = useQuery(api.media.listByProject, { projectId });
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const optimizeToWebp = useAction(api.actions.optimizeImage.optimizeToWebp);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500 animate-pulse text-sm">Loading Media Library...</div>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading ${file.name}...`);

        // 1. Get temporary upload URL
        const uploadUrl = await generateUploadUrl({ projectId });

        // 2. Upload file to Convex storage
        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await uploadRes.json();

        // 3. Optimize to WebP with Sharp
        setUploadProgressText(`Converting ${file.name} to WebP...`);
        await optimizeToWebp({
          projectId,
          storageId,
          originalFilename: file.name,
        });
      }
    } catch (err: any) {
      alert("Error uploading media: " + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
    }
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

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
            <ImageIcon className="h-6 w-6 text-blue-500" />
            Media &amp; WebP Asset Library
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            All uploaded images are automatically optimized into high-performance <code className="text-blue-400 font-mono">.webp</code> and staged for Git deployment.
          </p>
        </div>

        {/* Upload Trigger */}
        <label className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 cursor-pointer text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20">
          <UploadCloud className="h-4 w-4" />
          <span>Upload New Image</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Uploading Progress */}
      {isUploading && (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center gap-3 text-xs text-blue-200">
          <Sparkles className="h-4 w-4 text-blue-400 animate-spin" />
          <span>{uploadProgressText}</span>
        </div>
      )}

      {/* Assets Grid */}
      {assets === undefined ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <ImageIcon className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No media uploaded yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Upload images here or via the In-Place Visual Editor. They will be converted to .webp automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative aspect-video bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800">
                {asset.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt={asset.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-zinc-700" />
                )}
                <span className="absolute top-2 right-2 text-[10px] font-mono uppercase bg-zinc-950/80 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-800 backdrop-blur-sm">
                  WEBP
                </span>
              </div>

              {/* Info & Actions */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-200 truncate" title={asset.optimizedName}>
                    {asset.optimizedName}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    {(asset.sizeBytes / 1024).toFixed(1)} KB &bull; Orig: {asset.originalName}
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => copyPath(`/${asset.repoDestinationPath}`)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 py-1"
                  >
                    {copiedPath === `/${asset.repoDestinationPath}` ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Copied Path
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy Path
                      </>
                    )}
                  </button>

                  {asset.url && (
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-zinc-300 p-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
