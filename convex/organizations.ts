import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getViewer, assertSuperAdmin } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];

    if (viewer.role === "super_admin") {
      return await ctx.db.query("organizations").collect();
    }

    if (!viewer.organizationId) {
      return [];
    }

    const org = await ctx.db.get(viewer.organizationId);
    return org ? [org] : [];
  },
});

export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;

    if (viewer.role !== "super_admin" && viewer.organizationId !== args.organizationId) {
      throw new Error("Forbidden: You do not have access to this organization.");
    }

    return await ctx.db.get(args.organizationId);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    billingStatus: v.optional(v.union(v.literal("active"), v.literal("past_due"), v.literal("free"))),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`An organization with slug '${args.slug}' already exists.`);
    }

    return await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      contactEmail: args.contactEmail ?? "",
      phone: args.phone,
      billingStatus: args.billingStatus ?? "active",
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    phone: v.optional(v.string()),
    billingStatus: v.optional(
      v.union(v.literal("active"), v.literal("past_due"), v.literal("free"))
    ),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);

    const { organizationId, ...updates } = args;
    await ctx.db.patch(organizationId, updates);
  },
});
