import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getViewerOrThrow, assertProjectAccess } from "./lib/auth";

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending_review"),
        v.literal("approved"),
        v.literal("pr_created"),
        v.literal("merged"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    await assertProjectAccess(ctx, args.projectId);

    if (args.status) {
      return await ctx.db
        .query("stagedChanges")
        .withIndex("by_project", (q) =>
          q.eq("projectId", args.projectId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("stagedChanges")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const stageChange = mutation({
  args: {
    projectId: v.id("projects"),
    targetFile: v.string(),
    contentKey: v.string(),
    contentType: v.union(v.literal("text"), v.literal("html"), v.literal("image"), v.literal("link")),
    originalValue: v.string(),
    proposedValue: v.string(),
    batchName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, project } = await assertProjectAccess(ctx, args.projectId);

    // Look for an existing draft or pending review change on the same file and key
    const existing = await ctx.db
      .query("stagedChanges")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("targetFile"), args.targetFile),
          q.eq(q.field("contentKey"), args.contentKey),
          q.or(
            q.eq(q.field("status"), "draft"),
            q.eq(q.field("status"), "pending_review")
          )
        )
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        proposedValue: args.proposedValue,
        status: "pending_review",
        batchName: args.batchName ?? existing.batchName,
      });
      return existing._id;
    }

    return await ctx.db.insert("stagedChanges", {
      projectId: args.projectId,
      organizationId: project.organizationId,
      authorId: user._id,
      targetFile: args.targetFile,
      contentKey: args.contentKey,
      contentType: args.contentType,
      originalValue: args.originalValue,
      proposedValue: args.proposedValue,
      status: "pending_review",
      batchName: args.batchName,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    changeId: v.id("stagedChanges"),
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("merged")
    ),
    reviewerFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const change = await ctx.db.get(args.changeId);
    if (!change) throw new Error("Staged change not found.");

    await assertProjectAccess(ctx, change.projectId);

    await ctx.db.patch(args.changeId, {
      status: args.status,
      reviewerFeedback: args.reviewerFeedback,
    });
  },
});

export const batchApprove = mutation({
  args: {
    changeIds: v.array(v.id("stagedChanges")),
  },
  handler: async (ctx, args) => {
    for (const id of args.changeIds) {
      const change = await ctx.db.get(id);
      if (change) {
        await assertProjectAccess(ctx, change.projectId);
        await ctx.db.patch(id, { status: "approved" });
      }
    }
  },
});

export const deleteChange = mutation({
  args: { changeId: v.id("stagedChanges") },
  handler: async (ctx, args) => {
    const change = await ctx.db.get(args.changeId);
    if (!change) throw new Error("Staged change not found.");

    await assertProjectAccess(ctx, change.projectId);
    await ctx.db.delete(args.changeId);
  },
});

export const markPRCreated = mutation({
  args: {
    changeIds: v.array(v.id("stagedChanges")),
    pullRequestUrl: v.string(),
    pullRequestNumber: v.number(),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    for (const id of args.changeIds) {
      await ctx.db.patch(id, {
        status: "pr_created",
        pullRequestUrl: args.pullRequestUrl,
        pullRequestNumber: args.pullRequestNumber,
        branchName: args.branchName,
        committedAt: Date.now(),
      });
    }
  },
});

export const markDirectCommitted = mutation({
  args: {
    changeIds: v.array(v.id("stagedChanges")),
    commitUrl: v.string(),
    commitSha: v.string(),
    branchName: v.string(),
  },
  handler: async (ctx, args) => {
    for (const id of args.changeIds) {
      await ctx.db.patch(id, {
        status: "merged",
        commitUrl: args.commitUrl,
        commitSha: args.commitSha,
        branchName: args.branchName,
        committedAt: Date.now(),
      });
    }
  },
});
