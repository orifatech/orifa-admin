import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertProjectAccess, assertSuperAdmin } from "./lib/auth";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const { organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.organizationId,
      { resourceType: "projects" }
    );

    if (isSuperAdmin) {
      if (organizationId) {
        return await ctx.db
          .query("projects")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      }
      return await ctx.db.query("projects").collect();
    }

    if (!organizationId) return [];

    return await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
      .collect();
  },
});

export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
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
    const admin = await assertSuperAdmin(ctx);

    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found.");

    // Generate random 32-character hexadecimal editor token
    const editorSecretToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const gitPublishMode = args.gitPublishMode ?? "pull_request";
    const hasMaintenanceContract =
      args.hasMaintenanceContract ?? (gitPublishMode === "pull_request");

    const projectId = await ctx.db.insert("projects", {
      ...args,
      gitPublishMode,
      hasMaintenanceContract,
      editorSecretToken,
      createdAt: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: admin._id,
      action: "project_created",
      resourceType: "projects",
      resourceId: projectId as string,
      severity: "info",
      details: {
        name: args.name,
        productionUrl: args.productionUrl,
        gitPublishMode,
      },
    });

    return projectId;
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
    const { user, project } = await assertProjectAccess(ctx, projectId);

    await ctx.db.patch(projectId, updates);

    await logSecurityAudit(ctx, {
      tenantId: project.organizationId,
      actorId: user._id,
      action: "project_updated",
      resourceType: "projects",
      resourceId: projectId as string,
      severity: "info",
      details: updates,
    });
  },
});

export const rotateEditorSecret = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const { user, project } = await assertProjectAccess(ctx, args.projectId);

    const editorSecretToken = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    await ctx.db.patch(args.projectId, { editorSecretToken });

    await logSecurityAudit(ctx, {
      tenantId: project.organizationId,
      actorId: user._id,
      action: "project_editor_token_rotated",
      resourceType: "projects",
      resourceId: args.projectId as string,
      severity: "warning",
      details: {
        projectName: project.name,
      },
    });

    return editorSecretToken;
  },
});
