import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin } from "./lib/auth";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const { organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.organizationId,
      { resourceType: "subscriptions" }
    );

    let subs;
    if (isSuperAdmin) {
      if (organizationId) {
        subs = await ctx.db
          .query("subscriptions")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      } else {
        subs = await ctx.db.query("subscriptions").collect();
      }
    } else {
      if (!organizationId) return [];
      subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
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
    // Platform-level MRR aggregates are strictly restricted to Orifa super administrators
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
    billingCycle: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("annual"),
      v.literal("ad_hoc")
    ),
    billingDayOfMonth: v.number(),
    nextBillingDate: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("overdue"),
      v.literal("cancelled"),
      v.literal("not_applicable")
    ),
    paymentMethod: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);
    const subId = await ctx.db.insert("subscriptions", args);

    // Auto-generate initial retainer invoice
    const invoiceYear = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${invoiceYear}-${randomSuffix}`;
    await ctx.db.insert("invoices", {
      organizationId: args.organizationId,
      subscriptionId: subId,
      invoiceNumber,
      description: `${args.planName} (${args.billingCycle === "monthly" ? "Monthly Retainer" : args.billingCycle})`,
      amount: args.monthlyFee,
      amountInMinor: Math.round(args.monthlyFee * 100),
      currency: args.currency,
      status: "pending",
      dueDate: args.nextBillingDate,
      paymentMethod: "Paystack",
      createdAt: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: admin._id,
      action: "subscription_created",
      resourceType: "subscriptions",
      resourceId: subId as string,
      severity: "info",
      details: {
        planName: args.planName,
        monthlyFee: args.monthlyFee,
        currency: args.currency,
        initialInvoiceNumber: invoiceNumber,
      },
    });

    return subId;
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
    const admin = await assertSuperAdmin(ctx);
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) throw new Error("Subscription not found.");

    const { subscriptionId, ...updates } = args;
    await ctx.db.patch(subscriptionId, updates);

    await logSecurityAudit(ctx, {
      tenantId: sub.organizationId,
      actorId: admin._id,
      action: "subscription_updated",
      resourceType: "subscriptions",
      resourceId: subscriptionId as string,
      severity: "info",
      details: updates,
    });
  },
});

export const deleteSubscription = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) return;

    await ctx.db.delete(args.subscriptionId);

    await logSecurityAudit(ctx, {
      tenantId: sub.organizationId,
      actorId: admin._id,
      action: "subscription_deleted",
      resourceType: "subscriptions",
      resourceId: args.subscriptionId as string,
      severity: "warning",
      details: { planName: sub.planName },
    });
  },
});
