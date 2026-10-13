import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin, getViewerOrThrow } from "./lib/auth";
import { api } from "./_generated/api";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);

    let domains;
    if (viewer.role === "super_admin") {
      if (args.organizationId) {
        domains = await ctx.db
          .query("domainMonitors")
          .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
          .collect();
      } else {
        domains = await ctx.db.query("domainMonitors").collect();
      }
    } else {
      if (!viewer.organizationId) return [];
      domains = await ctx.db
        .query("domainMonitors")
        .filter((q) => q.eq(q.field("organizationId"), viewer.organizationId))
        .collect();
    }

    const now = Date.now();
    return await Promise.all(
      domains.map(async (d) => {
        const org = await ctx.db.get(d.organizationId);
        const daysRemaining = Math.ceil((d.expiresAt - now) / (1000 * 60 * 60 * 24));
        return {
          ...d,
          organizationName: org?.name ?? "Unknown",
          daysRemaining,
        };
      })
    );
  },
});

export const add = mutation({
  args: {
    organizationId: v.id("organizations"),
    projectId: v.optional(v.id("projects")),
    domainName: v.string(),
    registrar: v.optional(v.string()),
    expiresAt: v.number(),
    autoRenewStatus: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);

    const now = Date.now();
    const days = (args.expiresAt - now) / (1000 * 60 * 60 * 24);
    const status = days < 0 ? "expired" : days <= 30 ? "expiring_soon" : "healthy";

    return await ctx.db.insert("domainMonitors", {
      ...args,
      lastCheckedAt: now,
      status,
    });
  },
});

export const update = mutation({
  args: {
    domainId: v.id("domainMonitors"),
    registrar: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    autoRenewStatus: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal("healthy"), v.literal("expiring_soon"), v.literal("expired"))),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    const { domainId, ...updates } = args;
    await ctx.db.patch(domainId, updates);
  },
});

export const deleteDomain = mutation({
  args: { domainId: v.id("domainMonitors") },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    await ctx.db.delete(args.domainId);
  },
});
