import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertProjectAccess, getViewer } from "./lib/auth";
import { logSecurityAudit } from "./lib/tenant";

export const generateUploadUrl = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    await assertProjectAccess(ctx, args.projectId);
    return await ctx.storage.generateUploadUrl();
  },
});

export const registerAsset = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    originalName: v.string(),
    optimizedName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    repoDestinationPath: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, project } = await assertProjectAccess(ctx, args.projectId);

    const assetId = await ctx.db.insert("mediaAssets", {
      projectId: args.projectId,
      organizationId: project.organizationId,
      originalName: args.originalName,
      optimizedName: args.optimizedName,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      storageId: args.storageId,
      repoDestinationPath: args.repoDestinationPath,
      isCommitted: false,
      uploadedBy: user._id,
      createdAt: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: project.organizationId,
      actorId: user._id,
      action: "media_asset_uploaded",
      resourceType: "mediaAssets",
      resourceId: assetId as string,
      severity: "info",
      details: {
        originalName: args.originalName,
        optimizedName: args.optimizedName,
        sizeBytes: args.sizeBytes,
      },
    });

    return assetId;
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];

    await assertProjectAccess(ctx, args.projectId);

    const assets = await ctx.db
      .query("mediaAssets")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return await Promise.all(
      assets.map(async (asset) => {
        const url = await ctx.storage.getUrl(asset.storageId);
        return {
          ...asset,
          url,
        };
      })
    );
  },
});
