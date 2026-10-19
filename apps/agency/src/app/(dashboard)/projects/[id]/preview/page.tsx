"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
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
  Sparkles,
} from "lucide-react";

export default function VisualPreviewPage() {
  const params = useParams();
  const projectId = params.id as Id<"projects">;

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
        } catch (err: unknown) {
          const error = err as { message?: string };
          console.error("Failed to stage change:", error);
          alert("Error saving staged change: " + (error.message || "Unknown error"));
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
        <div className="text-gray-400 animate-pulse text-sm">Loading Visual Editor...</div>
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

  const fallbackDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${project.name || "Client Website Preview"}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="/orifa-editor.js" data-site="${project._id}" data-token="${project.editorSecretToken}" defer></script>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background-color: #fdfdfd; color: #111827; }
      </style>
    </head>
    <body class="p-8 max-w-4xl mx-auto space-y-12">
      <header class="flex items-center justify-between pb-6 border-b border-gray-200">
        <div class="font-bold text-lg text-emerald-800" data-cms="src/content/global.json#site.brand_name">${project.name}</div>
        <nav class="flex gap-6 text-sm text-gray-600">
          <a href="#about" class="hover:text-black" data-cms="src/content/nav.json#link.about">About</a>
          <a href="#services" class="hover:text-black" data-cms="src/content/nav.json#link.services">Services</a>
          <a href="#contact" class="hover:text-black" data-cms="src/content/nav.json#link.contact">Contact</a>
        </nav>
      </header>

      <section class="text-center py-12 space-y-4">
        <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" data-cms="src/content/home.json#hero.badge">
          Orifa In-Place Visual CMS
        </span>
        <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight" data-cms="src/content/home.json#hero.headline">
          Empowering Next Generation Digital Experiences
        </h1>
        <p class="text-gray-600 max-w-xl mx-auto text-base" data-cms="src/content/home.json#hero.subhead">
          Click on any highlighted element on this page to edit copy, links, or swap images in real-time. Changes are staged safely in your portal.
        </p>
        <div class="pt-4 flex justify-center gap-3">
          <button class="px-5 py-2.5 bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-xs hover:bg-emerald-800" data-cms="src/content/home.json#hero.primary_cta">
            Get Started Now
          </button>
          <button class="px-5 py-2.5 bg-gray-100 text-gray-800 font-medium text-sm rounded-lg hover:bg-gray-200" data-cms="src/content/home.json#hero.secondary_cta">
            Learn More
          </button>
        </div>
      </section>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div class="p-6 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2">
          <h3 class="font-bold text-gray-900 text-base" data-cms="src/content/services.json#item1.title">Real-Time Domain Tracking</h3>
          <p class="text-xs text-gray-600" data-cms="src/content/services.json#item1.desc">Automated renewal monitors ensure your domain names and SSL certificates never expire unexpectedly.</p>
        </div>
        <div class="p-6 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2">
          <h3 class="font-bold text-gray-900 text-base" data-cms="src/content/services.json#item2.title">Optimized WebP Media</h3>
          <p class="text-xs text-gray-600" data-cms="src/content/services.json#item2.desc">Images uploaded are automatically compressed into modern next-gen WebP format for fast load times.</p>
        </div>
        <div class="p-6 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2">
          <h3 class="font-bold text-gray-900 text-base" data-cms="src/content/services.json#item3.title">Git-Backed Staging Queue</h3>
          <p class="text-xs text-gray-600" data-cms="src/content/services.json#item3.desc">Every visual modification produces clean pull requests on GitHub, preserving version history.</p>
        </div>
      </section>
    </body>
    </html>
  `;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#eef0f2] font-sans">
      {/* Editor Control Bar */}
      <header className="h-14 border-b border-gray-200/80 bg-white px-4 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/projects"
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-gray-900 truncate">
                {project.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                {project.framework}
              </span>
            </div>
            {targetUrl ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-mono"
              >
                <span>{targetUrl}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : (
              <span className="text-[11px] text-gray-400 font-mono">Live Sandbox Mode</span>
            )}
          </div>
        </div>

        {/* Device Mode Switchers */}
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => setDeviceMode("desktop")}
            title="Desktop Mode"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              deviceMode === "desktop"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            title="Tablet (768px)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              deviceMode === "tablet"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            title="Mobile (375px)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              deviceMode === "mobile"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
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
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowScriptModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer font-medium"
          >
            <Code2 className="h-3.5 w-3.5 text-emerald-600" />
            Snippet
          </button>

          <button
            onClick={toggleEditMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
              editMode
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            <Edit3 className="h-3.5 w-3.5 text-emerald-600" />
            {editMode ? "Visual Editing ON" : "Edit Mode OFF"}
          </button>

          <Link
            href={`/projects/${project._id}/changes`}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
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
        <div className="absolute top-16 right-6 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Frame Container */}
      <div className="flex-1 p-4 flex items-center justify-center overflow-auto">
        <div
          className={`h-full transition-all duration-200 rounded-xl overflow-hidden border border-gray-300/80 shadow-lg bg-white flex flex-col ${
            deviceMode === "desktop"
              ? "w-full"
              : deviceMode === "tablet"
              ? "w-[768px]"
              : "w-[375px]"
          }`}
        >
          {targetUrl ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={targetUrl}
              title="Website Live Preview"
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          ) : (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={fallbackDoc}
              title="Website Live Sandbox"
              className="w-full h-full border-none"
              sandbox="allow-same-origin allow-scripts allow-forms"
            />
          )}
        </div>
      </div>

      {/* Embed Script Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-600" />
                Client Snippet Installation
              </h2>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Paste this script tag into your client website&apos;s root layout (e.g. in{" "}
              <code className="text-gray-900 bg-gray-100 px-1 py-0.5 rounded font-mono">
                src/layouts/Layout.astro
              </code>{" "}
              or{" "}
              <code className="text-gray-900 bg-gray-100 px-1 py-0.5 rounded font-mono">
                src/app/layout.tsx
              </code>
              ). Then add <code className="text-emerald-700 font-mono">data-cms=&quot;targetFile#key&quot;</code>{" "}
              attributes to any editable element.
            </p>

            <div className="relative">
              <pre className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                {embedSnippet}
              </pre>
              <button
                onClick={copyEmbedCode}
                className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 border border-gray-700 transition-colors cursor-pointer"
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

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900">
              <AlertCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Security:</strong> All edits are authenticated via the project&apos;s secret token
                and placed into your review queue. Changes never commit to production without your GitHub Pull Request approval.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
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
