import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getViewer, assertProjectAccess, assertSuperAdmin } from "./lib/auth";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];

    const targetOrgId = args.organizationId;
    if (viewer.role === "super_admin") {
      if (targetOrgId) {
        return await ctx.db
          .query("projects")
          .withIndex("by_org", (q) => q.eq("organizationId", targetOrgId))
          .collect();
      }
      return await ctx.db.query("projects").collect();
    }

    const viewerOrgId = viewer.organizationId;
    if (!viewerOrgId) return [];

    return await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("organizationId", viewerOrgId))
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;

    const { project } = await assertProjectAccess(ctx, args.projectId);
    const org = await ctx.db.get(project.organizationId);
    return {
      ...project,
      organization: org,
    };
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    productionUrl: v.string(),
    stagingUrl: v.optional(v.string()),
    framework: v.union(v.literal("astro"), v.literal("nextjs"), v.literal("react")),
    githubRepoOwner: v.string(),
    githubRepoName: v.string(),
    githubDefaultBranch: v.string(),
    contentRootPath: v.string(),
    gitPublishMode: v.optional(v.union(v.literal("pull_request"), v.literal("direct_commit"))),
    hasMaintenanceContract: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);

    // Generate random 24-character hexadecimal editor token
    const editorSecretToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const gitPublishMode = args.gitPublishMode ?? "pull_request";
    const hasMaintenanceContract =
      args.hasMaintenanceContract ?? (gitPublishMode === "pull_request");

    return await ctx.db.insert("projects", {
      ...args,
      gitPublishMode,
      hasMaintenanceContract,
      editorSecretToken,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    productionUrl: v.optional(v.string()),
    stagingUrl: v.optional(v.string()),
    framework: v.optional(v.union(v.literal("astro"), v.literal("nextjs"), v.literal("react"))),
    githubRepoOwner: v.optional(v.string()),
    githubRepoName: v.optional(v.string()),
    githubDefaultBranch: v.optional(v.string()),
    contentRootPath: v.optional(v.string()),
    gitPublishMode: v.optional(v.union(v.literal("pull_request"), v.literal("direct_commit"))),
    hasMaintenanceContract: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    await assertProjectAccess(ctx, projectId);
    await ctx.db.patch(projectId, updates);
  },
});

export const rotateEditorSecret = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await assertProjectAccess(ctx, args.projectId);

    const editorSecretToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await ctx.db.patch(args.projectId, { editorSecretToken });
    return editorSecretToken;
  },
});
