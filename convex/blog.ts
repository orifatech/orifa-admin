import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertProjectAccess, getViewerOrThrow } from "./lib/auth";

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("pending_review"),
        v.literal("pr_created"),
        v.literal("published")
      )
    ),
  },
  handler: async (ctx, args) => {
    await assertProjectAccess(ctx, args.projectId);

    if (args.status) {
      return await ctx.db
        .query("blogPosts")
        .withIndex("by_status", (q) =>
          q.eq("projectId", args.projectId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("blogPosts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Blog post not found.");
    await assertProjectAccess(ctx, post.projectId);
    return post;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    markdownContent: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    author: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, project } = await assertProjectAccess(ctx, args.projectId);

    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_project", (q) =>
        q.eq("projectId", args.projectId).eq("slug", args.slug)
      )
      .first();

    if (existing) {
      throw new Error(`A blog post with slug '${args.slug}' already exists.`);
    }

    const now = Date.now();
    return await ctx.db.insert("blogPosts", {
      ...args,
      organizationId: project.organizationId,
      status: "draft",
      authorId: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    postId: v.id("blogPosts"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    markdownContent: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    author: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { postId, ...updates } = args;
    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Blog post not found.");

    await assertProjectAccess(ctx, post.projectId);

    await ctx.db.patch(postId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const stageForGitPR = mutation({
  args: { postId: v.id("blogPosts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("Blog post not found.");

    const { user, project } = await assertProjectAccess(ctx, post.projectId);

    // Build standard YAML frontmatter for Astro / Next.js Content Collections
    const pubDateFormatted = new Date(post.createdAt).toISOString().split("T")[0];
    const tagsFormatted = JSON.stringify(post.tags);

    const formattedMarkdown = `---
title: ${JSON.stringify(post.title)}
description: ${JSON.stringify(post.excerpt)}
pubDate: '${pubDateFormatted}'
author: ${JSON.stringify(post.author)}
category: ${JSON.stringify(post.category)}
tags: ${tagsFormatted}
${post.coverImageUrl ? `image: ${JSON.stringify(post.coverImageUrl)}\n` : ""}${post.seoTitle ? `seoTitle: ${JSON.stringify(post.seoTitle)}\n` : ""}${post.seoDescription ? `seoDescription: ${JSON.stringify(post.seoDescription)}\n` : ""}---

${post.markdownContent}
`;

    const targetFile = `${project.contentRootPath}/blog/${post.slug}.md`;

    // Stage into stagedChanges queue
    const changeId = await ctx.db.insert("stagedChanges", {
      projectId: post.projectId,
      organizationId: project.organizationId,
      authorId: user._id,
      targetFile,
      contentKey: "article",
      contentType: "text",
      originalValue: "",
      proposedValue: formattedMarkdown,
      status: "pending_review",
      batchName: `Blog: ${post.title}`,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.postId, { status: "pending_review" });

    return changeId;
  },
});
