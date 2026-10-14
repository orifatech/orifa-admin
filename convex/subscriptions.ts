import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin, getViewerOrThrow } from "./lib/auth";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);

    let subs;
    const targetOrgId = args.organizationId;
    if (viewer.role === "super_admin") {
      if (targetOrgId) {
        subs = await ctx.db
          .query("subscriptions")
          .withIndex("by_org", (q) => q.eq("organizationId", targetOrgId))
          .collect();
      } else {
        subs = await ctx.db.query("subscriptions").collect();
      }
    } else {
      const viewerOrgId = viewer.organizationId;
      if (!viewerOrgId) return [];
      subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_org", (q) => q.eq("organizationId", viewerOrgId))
        .collect();
    }

    return await Promise.all(
      subs.map(async (s) => {
        const org = await ctx.db.get(s.organizationId);
        return {
          ...s,
          organizationName: org?.name ?? "Unknown",
        };
      })
    );
  },
});

export const getMRR = query({
  args: {},
  handler: async (ctx) => {
    await assertSuperAdmin(ctx);

    const subs = await ctx.db.query("subscriptions").collect();
    const activeSubs = subs.filter((s) => s.status === "active");

    const totalsByCurrency: Record<string, number> = {};
    for (const sub of activeSubs) {
      const curr = sub.currency || "USD";
      totalsByCurrency[curr] = (totalsByCurrency[curr] || 0) + sub.monthlyFee;
    }

    return {
      activeSubscribersCount: activeSubs.length,
      totalsByCurrency,
    };
  },
});

export const add = mutation({
  args: {
    organizationId: v.id("organizations"),
    planName: v.string(),
    monthlyFee: v.number(),
    currency: v.string(),
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual"), v.literal("ad_hoc")),
    billingDayOfMonth: v.number(),
    nextBillingDate: v.number(),
    status: v.union(v.literal("active"), v.literal("overdue"), v.literal("cancelled"), v.literal("not_applicable")),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    return await ctx.db.insert("subscriptions", args);
  },
});

export const update = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    planName: v.optional(v.string()),
    monthlyFee: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingCycle: v.optional(
      v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual"), v.literal("ad_hoc"))
    ),
    billingDayOfMonth: v.optional(v.number()),
    nextBillingDate: v.optional(v.number()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("overdue"), v.literal("cancelled"), v.literal("not_applicable"))
    ),
    paymentMethod: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    const { subscriptionId, ...updates } = args;
    await ctx.db.patch(subscriptionId, updates);
  },
});

export const deleteSubscription = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    await ctx.db.delete(args.subscriptionId);
  },
});
