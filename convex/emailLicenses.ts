import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin, getViewerOrThrow } from "./lib/auth";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);

    let licenses;
    const targetOrgId = args.organizationId;
    if (viewer.role === "super_admin") {
      if (targetOrgId) {
        licenses = await ctx.db
          .query("emailLicenses")
          .withIndex("by_org", (q) => q.eq("organizationId", targetOrgId))
          .collect();
      } else {
        licenses = await ctx.db.query("emailLicenses").collect();
      }
    } else {
      const viewerOrgId = viewer.organizationId;
      if (!viewerOrgId) return [];
      licenses = await ctx.db
        .query("emailLicenses")
        .withIndex("by_org", (q) => q.eq("organizationId", viewerOrgId))
        .collect();
    }

    const now = Date.now();
    return await Promise.all(
      licenses.map(async (lic) => {
        const org = await ctx.db.get(lic.organizationId);
        const daysToRenewal = Math.ceil((lic.renewalDate - now) / (1000 * 60 * 60 * 24));
        const totalMonthlyCost = lic.seatCount * lic.costPerSeat;
        return {
          ...lic,
          organizationName: org?.name ?? "Unknown",
          daysToRenewal,
          totalMonthlyCost,
        };
      })
    );
  },
});

export const add = mutation({
  args: {
    organizationId: v.id("organizations"),
    provider: v.union(
      v.literal("google_workspace"),
      v.literal("microsoft_365"),
      v.literal("zoho"),
      v.literal("cpanel_imap"),
      v.literal("other")
    ),
    adminEmail: v.string(),
    seatCount: v.number(),
    costPerSeat: v.number(),
    currency: v.string(),
    renewalDate: v.number(),
    paymentCardLast4: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);

    const now = Date.now();
    const days = (args.renewalDate - now) / (1000 * 60 * 60 * 24);
    const status = days < 0 ? "suspended" : days <= 14 ? "expiring_soon" : "active";

    return await ctx.db.insert("emailLicenses", {
      ...args,
      status,
    });
  },
});

export const update = mutation({
  args: {
    licenseId: v.id("emailLicenses"),
    provider: v.optional(
      v.union(
        v.literal("google_workspace"),
        v.literal("microsoft_365"),
        v.literal("zoho"),
        v.literal("cpanel_imap"),
        v.literal("other")
      )
    ),
    adminEmail: v.optional(v.string()),
    seatCount: v.optional(v.number()),
    costPerSeat: v.optional(v.number()),
    currency: v.optional(v.string()),
    renewalDate: v.optional(v.number()),
    paymentCardLast4: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("expiring_soon"), v.literal("suspended"))),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    const { licenseId, ...updates } = args;
    await ctx.db.patch(licenseId, updates);
  },
});

export const deleteLicense = mutation({
  args: { licenseId: v.id("emailLicenses") },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    await ctx.db.delete(args.licenseId);
  },
});
