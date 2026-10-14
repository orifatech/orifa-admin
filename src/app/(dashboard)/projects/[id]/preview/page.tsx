"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Edit3,
  CheckCircle2,
  RefreshCw,
  Code2,
  Copy,
  Check,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function VisualPreviewPage() {
  const params = useParams();
  const projectId = params.id as any;

  const project = useQuery(api.projects.get, { projectId });
  const stagedChanges = useQuery(api.stagedChanges.listByProject, { projectId });
  const stageChange = useMutation(api.stagedChanges.stageChange);

  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [editMode, setEditMode] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for editor events posted from inside the client website iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "ORIFA_STAGE_CHANGE") {
        const payload = event.data.payload;
        try {
          await stageChange({
            projectId,
            targetFile: payload.targetFile || "src/content/home.json",
            contentKey: payload.contentKey || "unknown",
            contentType: payload.contentType || "text",
            originalValue: payload.originalValue || "",
            proposedValue: payload.proposedValue || "",
          });
          setToastMessage(`Saved edit for "${payload.contentKey}" to Staged Changes!`);
          setTimeout(() => setToastMessage(null), 4000);
        } catch (err: any) {
          console.error("Failed to stage change:", err);
          alert("Error saving staged change: " + err.message);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [projectId, stageChange]);

  const toggleEditMode = () => {
    const nextState = !editMode;
    setEditMode(nextState);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "ORIFA_TOGGLE_EDIT_MODE", enabled: nextState },
        "*"
      );
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-zinc-500 animate-pulse text-sm">Loading Visual Editor...</div>
      </div>
    );
  }

  const targetUrl = project.stagingUrl || project.productionUrl;
  const pendingCount = stagedChanges?.filter((c) => c.status === "pending_review").length || 0;

  const embedSnippet = `<script
  src="${typeof window !== "undefined" ? window.location.origin : ""}/orifa-editor.js"
  data-site="${project._id}"
  data-token="${project.editorSecretToken}"
  defer
></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-zinc-950">
      {/* Editor Control Bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/projects"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-200 truncate">
                {project.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                {project.framework}
              </span>
            </div>
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
            >
              <span>{targetUrl}</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        {/* Device Mode Switchers */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setDeviceMode("desktop")}
            title="Desktop Mode"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === "desktop"
                ? "bg-zinc-800 text-blue-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            title="Tablet (768px)"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === "tablet"
                ? "bg-zinc-800 text-blue-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            title="Mobile (375px)"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === "mobile"
                ? "bg-zinc-800 text-blue-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload Frame"
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowScriptModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700/60"
          >
            <Code2 className="h-3.5 w-3.5 text-blue-400" />
            Snippet
          </button>

          <button
            onClick={toggleEditMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              editMode
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/40"
                : "bg-zinc-800 text-zinc-400 border-zinc-700"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            {editMode ? "Visual Editing ON" : "Edit Mode OFF"}
          </button>

          <Link
            href={`/projects/${project._id}/changes`}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Review Diff Queue</span>
            {pendingCount > 0 && (
              <span className="ml-1 bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 right-6 z-50 bg-emerald-950 border border-emerald-600/50 text-emerald-200 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Frame Container */}
      <div className="flex-1 bg-zinc-950/80 p-4 flex items-center justify-center overflow-auto">
        <div
          className={`h-full transition-all duration-200 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl bg-white flex flex-col ${
            deviceMode === "desktop"
              ? "w-full"
              : deviceMode === "tablet"
              ? "w-[768px]"
              : "w-[375px]"
          }`}
        >
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={targetUrl}
            title="Website Live Preview"
            className="w-full h-full border-none"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      </div>

      {/* Embed Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-blue-400" />
                Client Snippet Installation
              </h2>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Paste this script tag into your client website&apos;s root layout (e.g. in{" "}
              <code className="text-zinc-200 bg-zinc-950 px-1 py-0.5 rounded font-mono">
                src/layouts/Layout.astro
              </code>{" "}
              or{" "}
              <code className="text-zinc-200 bg-zinc-950 px-1 py-0.5 rounded font-mono">
                src/app/layout.tsx
              </code>
              ). Then add <code className="text-blue-400 font-mono">data-cms=&quot;targetFile#key&quot;</code>{" "}
              attributes to any editable element.
            </p>

            <div className="relative">
              <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                {embedSnippet}
              </pre>
              <button
                onClick={copyEmbedCode}
                className="absolute top-2 right-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border border-zinc-700 transition-colors"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> Copy Snippet
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-blue-950/30 border border-blue-900/50 rounded-lg flex items-start gap-2.5 text-xs text-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong>Security:</strong> All edits are authenticated via the project&apos;s secret token
                and placed into your review queue. Changes never commit to production without your GitHub Pull Request approval.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
