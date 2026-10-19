"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@orifa/backend";
import type { Id } from "@orifa/backend";
import {
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Trash2,
  Upload,
  RefreshCw,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
  Eye,
  Sliders,
  X,
  FileImage,
} from "lucide-react";

export default function VisualEditorPage() {
  const viewer = useQuery(api.users.viewer);
  const orgId = viewer?.organizationId;
  const organization = viewer?.organization;
  const primaryColor = organization?.primaryColor || "#006e2b";

  const projects = useQuery(api.projects.list, orgId ? { organizationId: orgId } : {}) || [];
  const subscriptions = useQuery(api.subscriptions.list, orgId ? { organizationId: orgId } : {}) || [];
  const activeSubscription = subscriptions.find((s: any) => s.status === "active");

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [deviceViewport, setDeviceViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSnippetModalOpen, setIsSnippetModalOpen] = useState<boolean>(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Media upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>("");

  const activeProjectId = selectedProjectId || (projects.length > 0 ? (projects[0]._id as string) : "");
  const activeProject = projects.find((p: any) => p._id === activeProjectId);

  const stagedChanges = useQuery(
    api.stagedChanges.listByProject,
    activeProjectId ? { projectId: activeProjectId as Id<"projects"> } : "skip"
  ) || [];

  const mediaAssets = useQuery(
    api.media.listByProject,
    activeProjectId ? { projectId: activeProjectId as Id<"projects"> } : "skip"
  ) || [];

  const stageMutation = useMutation(api.stagedChanges.stageChange);
  const updateStatusMutation = useMutation(api.stagedChanges.updateStatus);
  const deleteMutation = useMutation(api.stagedChanges.deleteChange);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const optimizeToWebp = useAction(api.actions.optimizeImage.optimizeToWebp);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for editor events posted from inside the client website iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "ORIFA_STAGE_CHANGE" && activeProjectId) {
        const payload = event.data.payload;
        try {
          await stageMutation({
            projectId: activeProjectId as Id<"projects">,
            targetFile: payload.targetFile || "src/content/home.json",
            contentKey: payload.contentKey || "unknown",
            contentType: payload.contentType || "text",
            originalValue: payload.originalValue || "",
            proposedValue: payload.proposedValue || "",
          });
          setToastMessage(`Saved staged edit for "${payload.contentKey}"!`);
          setTimeout(() => setToastMessage(null), 3500);
        } catch (err: unknown) {
          const error = err as { message?: string };
          console.error("Failed to stage change:", error);
          alert("Error saving staged change: " + (error.message || "Unknown error"));
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activeProjectId, stageMutation]);

  // Toggle Edit Mode in iframe
  const handleToggleEditMode = () => {
    const nextState = !isEditMode;
    setIsEditMode(nextState);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "ORIFA_TOGGLE_EDIT_MODE", enabled: nextState },
        "*"
      );
    }
  };

  const handleDeviceChange = (mode: "desktop" | "tablet" | "mobile") => {
    setDeviceViewport(mode);
  };

  const handleReloadIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleBatchSubmit = async () => {
    const drafts = stagedChanges.filter((c: any) => c.status === "draft");
    if (drafts.length === 0) return;

    try {
      for (const ch of drafts) {
        await updateStatusMutation({
          changeId: ch._id,
          status: "pending_review",
        });
      }
      setToastMessage(
        activeSubscription
          ? "Staged changes submitted! Auto-PR generation initiated."
          : "Staged changes submitted to Orifa Technologies for review."
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert("Failed to submit changes: " + (error.message || "Unknown error"));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeProjectId) return;

    try {
      setIsUploading(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgressText(`Uploading ${file.name}...`);

        const uploadUrl = await generateUploadUrl({ projectId: activeProjectId as Id<"projects"> });

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await uploadRes.json();

        setUploadProgressText(`Optimizing ${file.name} to WebP...`);
        await optimizeToWebp({
          projectId: activeProjectId as Id<"projects">,
          storageId,
          originalFilename: file.name,
        });
      }
      setToastMessage("Image successfully converted to WebP!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      alert("Error uploading media: " + (error.message || "Unknown error"));
    } finally {
      setIsUploading(false);
      setUploadProgressText("");
    }
  };

  const targetUrl = activeProject?.stagingUrl || activeProject?.productionUrl;

  const embedSnippet = `<script
  src="${typeof window !== "undefined" ? window.location.origin : ""}/orifa-editor.js"
  data-site="${activeProject?._id || "YOUR_PROJECT_ID"}"
  data-token="${activeProject?.editorSecretToken || "YOUR_EDITOR_TOKEN"}"
  defer
></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  // Fallback demo interactive website if no live URL is configured yet
  const fallbackDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${activeProject?.name || "Client Website Preview"}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="/orifa-editor.js" data-site="${activeProject?._id || ""}" data-token="${activeProject?.editorSecretToken || ""}" defer></script>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background-color: #fdfdfd; color: #111827; }
      </style>
    </head>
    <body class="p-8 max-w-4xl mx-auto space-y-12">
      <header class="flex items-center justify-between pb-6 border-b border-gray-200">
        <div class="font-bold text-lg text-emerald-800" data-cms="src/content/global.json#site.brand_name">${activeProject?.name || "Acme Co."}</div>
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
          <button class="px-5 py-2.5 bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm hover:bg-emerald-800" data-cms="src/content/home.json#hero.primary_cta">
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

  const pendingCount = stagedChanges.filter((c: any) => c.status === "draft" || c.status === "pending_review").length;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-gray-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Controls Toolbar */}
      <div className="bg-white border-b border-gray-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Project Selector & Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" style={{ color: primaryColor }} />
            <select
              value={activeProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-emerald-600"
            >
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-gray-500 hover:text-emerald-700 flex items-center gap-1 font-mono transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">{targetUrl}</span>
            </a>
          )}
        </div>

        {/* Center: Device Viewport Controls */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={() => handleDeviceChange("desktop")}
            className={`p-1.5 rounded-md transition-colors ${
              deviceViewport === "desktop"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeviceChange("tablet")}
            className={`p-1.5 rounded-md transition-colors ${
              deviceViewport === "tablet"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
            title="Tablet view (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeviceChange("mobile")}
            className={`p-1.5 rounded-md transition-colors ${
              deviceViewport === "mobile"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
            title="Mobile view (390px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Edit Mode Toggle */}
          <button
            onClick={handleToggleEditMode}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              isEditMode
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEditMode ? "Edit Mode: ON" : "Preview Mode"}</span>
          </button>

          {/* Refresh Frame */}
          <button
            onClick={handleReloadIframe}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            title="Reload Preview Frame"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Quick Media Uploader */}
          <button
            onClick={() => setIsMediaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            title="Upload and optimize WebP image"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden md:inline">Upload Image</span>
          </button>

          {/* Embed Script Snippet */}
          <button
            onClick={() => setIsSnippetModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            title="View HTML Header Embed Code"
          >
            <Code2 className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden md:inline">Script Snippet</span>
          </button>

          {/* Staged Changes Queue Toggle */}
          <button
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              pendingCount > 0
                ? "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5 text-amber-600" />
            <span>Staged ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 bg-[#eef0f2] p-4 flex items-center justify-center overflow-auto relative">
        <div
          className={`h-full bg-white rounded-xl shadow-lg border border-gray-300/80 overflow-hidden transition-all duration-300 flex flex-col ${
            deviceViewport === "mobile"
              ? "w-[390px]"
              : deviceViewport === "tablet"
              ? "w-[768px]"
              : "w-full"
          }`}
        >
          {/* Iframe Top Browser Chrome Bar */}
          <div className="h-7 bg-gray-100 border-b border-gray-200 px-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-[11px] font-mono text-gray-500 truncate max-w-xs">
              {targetUrl || `${activeProject?.name || "Client Website"} (Live Sandbox)`}
            </div>
            <div className="w-8" />
          </div>

          {/* Render real iframe or interactive demo fallback */}
          {targetUrl ? (
            <iframe
              ref={iframeRef}
              src={targetUrl}
              className="w-full flex-1 border-0"
              title="Client Visual CMS Editor"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={fallbackDoc}
              className="w-full flex-1 border-0"
              title="Client Visual CMS Editor Sandbox"
              sandbox="allow-scripts allow-same-origin allow-forms"
            />
          )}
        </div>

        {/* Slide-out Staged Changes Drawer */}
        {isDrawerOpen && (
          <div className="absolute right-4 top-4 bottom-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/90 z-40 flex flex-col animate-in slide-in-from-right-4 duration-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900">Staged Visual Edits</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 border-b border-gray-200 text-[11px] text-gray-600 flex items-center justify-between">
              <span>Status: {activeSubscription ? "Active Retainer (Auto-PR)" : "Self-Managed (Review)"}</span>
              <span className="font-semibold text-gray-900">{stagedChanges.length} items</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-gray-100">
              {stagedChanges.length === 0 ? (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <Sliders className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs">No staged edits yet.</p>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    Click any highlighted element in the preview website above to edit copy or links.
                  </p>
                </div>
              ) : (
                stagedChanges.map((change) => (
                  <div key={change._id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        {change.contentKey}
                      </span>
                      <button
                        onClick={() => deleteMutation({ changeId: change._id })}
                        className="text-gray-400 hover:text-red-600 p-1 rounded"
                        title="Discard this staged change"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-200/80 space-y-1">
                      <div className="line-through text-red-500 text-[11px] break-words">
                        {change.originalValue || "(empty)"}
                      </div>
                      <div className="text-emerald-700 font-medium break-words">
                        {change.proposedValue}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{change.targetFile}</span>
                      <span className="capitalize">{change.status.replace("_", " ")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {stagedChanges.length > 0 && (
              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl space-y-2">
                <button
                  onClick={handleBatchSubmit}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {activeSubscription ? "Submit & Auto-Deploy" : "Submit for Agency Review"}
                  </span>
                </button>
                <p className="text-[10px] text-center text-gray-500">
                  {activeSubscription
                    ? "Changes are committed directly or merged to main via active retainer."
                    : "Orifa engineers review the proposed diffs before deploying."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Script Embed Snippet Modal */}
      {isSnippetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-900">Website Header Embed Code</h3>
              </div>
              <button
                onClick={() => setIsSnippetModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Insert this script into your website&apos;s <code>&lt;head&gt;</code> tag (Astro, Next.js, WordPress, or HTML). Tag your editable elements with <code>data-cms=&quot;file.json#key&quot;</code> to enable in-place visual editing.
            </p>

            <div className="relative bg-gray-900 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
              <pre>{embedSnippet}</pre>
              <button
                onClick={copyEmbedCode}
                className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-white p-1.5 rounded-md border border-gray-700 transition-colors"
                title="Copy code"
              >
                {copiedSnippet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Example Markup for Editable Elements</span>
              </div>
              <p className="text-[11px] font-mono text-emerald-800">
                &lt;h1 data-cms=&quot;src/content/home.json#hero.title&quot;&gt;Welcome&lt;/h1&gt;
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsSnippetModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Uploader & WebP Converter Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-gray-900">Upload &amp; Optimize Image</h3>
              </div>
              <button
                onClick={() => setIsMediaModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Upload any PNG or JPEG image. Orifa automatically compresses and converts it into next-gen WebP format before staging.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center space-y-3 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-xs text-gray-700 font-medium">
                {isUploading ? uploadProgressText : "Drag and drop image here or click to browse"}
              </div>
              <input
                type="file"
                accept="image/*"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
                id="modal-image-upload"
              />
              <label
                htmlFor="modal-image-upload"
                className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                {isUploading ? "Converting..." : "Select Image"}
              </label>
            </div>

            {/* Quick List of Recent Assets */}
            {mediaAssets.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-700">Recent WebP Assets</span>
                <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-xl">
                  {mediaAssets.slice(0, 5).map((asset) => (
                    <div key={asset._id} className="p-2.5 flex items-center justify-between text-xs">
                      <div className="truncate max-w-[240px]">
                        <p className="font-medium text-gray-900 truncate">{asset.optimizedName}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{asset.repoDestinationPath}</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(asset.repoDestinationPath);
                          setToastMessage("Copied repo asset path!");
                          setTimeout(() => setToastMessage(null), 2500);
                        }}
                        className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium rounded transition-colors"
                      >
                        Copy Path
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => setIsMediaModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-colors"
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
