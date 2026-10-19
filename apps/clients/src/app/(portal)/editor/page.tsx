"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@orifa/backend";
import type { Id } from "@orifa/backend";
import {
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle,
  ExternalLink,
  Save,
  Eye,
  Edit3,
} from "lucide-react";

export default function VisualEditorPage() {
  const projects = useQuery(api.projects.list, {}) || [];
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [deviceViewport, setDeviceViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const activeProjectId = selectedProjectId || (projects.length > 0 ? projects[0]._id : "");
  const activeProject = projects.find((p) => p._id === activeProjectId);

  // Staged changes for this project
  const stagedChanges = useQuery(
    api.stagedChanges.listByProject,
    activeProjectId ? { projectId: activeProjectId as Id<"projects"> } : "skip"
  ) || [];

  const stageMutation = useMutation(api.stagedChanges.stageChange);

  // Simulated content edit handler
  const handleSimulateEdit = async () => {
    if (!activeProject) return;
    setIsSubmitting(true);
    try {
      await stageMutation({
        projectId: activeProject._id,
        targetFile: "src/content/homepage.json",
        contentKey: "hero-headline",
        contentType: "text",
        originalValue: "Empowering Next Generation Businesses",
        proposedValue: "Empowering Modern Businesses with Orifa Visual Studio",
      });
      setSubmitSuccess("Sample content change staged successfully!");
      setTimeout(() => setSubmitSuccess(null), 4000);
    } catch (err: unknown) {
      console.error("Failed to stage change:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getViewportWidth = () => {
    switch (deviceViewport) {
      case "mobile":
        return "max-w-[390px]";
      case "tablet":
        return "max-w-[768px]";
      case "desktop":
      default:
        return "max-w-full";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] space-y-4">
      {/* Editor Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        {/* Project Selector */}
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-indigo-500" />
          <select
            value={activeProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.productionUrl || "No URL"})
              </option>
            ))}
          </select>

          {activeProject?.productionUrl && (
            <a
              href={activeProject.productionUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              Open Live <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Viewport & Mode Controls */}
        <div className="flex items-center gap-4">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-800">
            <button
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                isEditMode
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Mode
            </button>
            <button
              onClick={() => setIsEditMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                !isEditMode
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Mode
            </button>
          </div>

          {/* Viewport switcher */}
          <div className="hidden sm:flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-800">
            <button
              onClick={() => setDeviceViewport("desktop")}
              title="Desktop View"
              className={`p-1.5 rounded-md ${
                deviceViewport === "desktop"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceViewport("tablet")}
              title="Tablet View"
              className={`p-1.5 rounded-md ${
                deviceViewport === "tablet"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceViewport("mobile")}
              title="Mobile View"
              className={`p-1.5 rounded-md ${
                deviceViewport === "mobile"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          {/* Save / Submit PR Button */}
          <button
            onClick={handleSimulateEdit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            Stage Changes ({stagedChanges.length})
          </button>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {submitSuccess}
        </div>
      )}

      {/* Editor Canvas Area */}
      <div className="flex-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-4 flex items-center justify-center overflow-hidden">
        <div
          className={`w-full h-full ${getViewportWidth()} transition-all duration-300 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-300 dark:border-zinc-800 flex flex-col overflow-hidden`}
        >
          {/* Mock Browser URL Bar */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 mx-4 px-3 py-1 rounded-md bg-white dark:bg-zinc-900 text-xs text-zinc-500 border border-zinc-200 dark:border-zinc-700 truncate">
              {activeProject?.productionUrl || "https://preview.orifatech.com"}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              {isEditMode ? "Editing Active" : "Preview"}
            </span>
          </div>

          {/* Interactive Editable Content Simulation */}
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="border border-dashed border-indigo-400/60 rounded-xl p-6 bg-indigo-50/30 dark:bg-indigo-950/20 relative group hover:border-indigo-600 transition-colors">
              <span className="absolute top-2 right-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md shadow-xs">
                Hero Section • Click to edit
              </span>
              <h1 className="text-3xl font-extrabold text-zinc-900 dark:white tracking-tight">
                Empowering Modern Businesses with Orifa
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-300 text-sm max-w-xl">
                We design and build bespoke web applications, enterprise digital platforms, and managed infrastructure with 24/7 proactive monitoring.
              </p>
              <div className="mt-4 flex gap-3">
                <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xs">
                  Get Started
                </button>
                <button className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Learn More
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 hover:border-indigo-400 transition-colors">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Feature 1</h3>
                <p className="text-xs text-zinc-500 mt-1">High-performance Next.js full-stack development.</p>
              </div>
              <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 hover:border-indigo-400 transition-colors">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Feature 2</h3>
                <p className="text-xs text-zinc-500 mt-1">Reactive database & real-time synchronization with Convex.</p>
              </div>
              <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-4 hover:border-indigo-400 transition-colors">
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Feature 3</h3>
                <p className="text-xs text-zinc-500 mt-1">OWASP multi-tenant security & encrypted credentials vault.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
