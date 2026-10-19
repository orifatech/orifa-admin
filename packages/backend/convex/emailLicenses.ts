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
      { resourceType: "emailLicenses" }
    );

    let licenses;
    if (isSuperAdmin) {
      if (organizationId) {
        licenses = await ctx.db
          .query("emailLicenses")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      } else {
        licenses = await ctx.db.query("emailLicenses").collect();
      }
    } else {
      if (!organizationId) return [];
      licenses = await ctx.db
        .query("emailLicenses")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
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
    const admin = await assertSuperAdmin(ctx);

    const now = Date.now();
    const days = (args.renewalDate - now) / (1000 * 60 * 60 * 24);
    const status = days < 0 ? "suspended" : days <= 14 ? "expiring_soon" : "active";

    const licenseId = await ctx.db.insert("emailLicenses", {
      ...args,
      status,
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: admin._id,
      action: "email_license_created",
      resourceType: "emailLicenses",
      resourceId: licenseId as string,
      severity: "info",
      details: {
        provider: args.provider,
        seatCount: args.seatCount,
        renewalDate: args.renewalDate,
      },
    });

    return licenseId;
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
    status: v.optional(
      v.union(v.literal("active"), v.literal("expiring_soon"), v.literal("suspended"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);
    const lic = await ctx.db.get(args.licenseId);
    if (!lic) throw new Error("License not found.");

    const { licenseId, ...updates } = args;
    await ctx.db.patch(licenseId, updates);

    await logSecurityAudit(ctx, {
      tenantId: lic.organizationId,
      actorId: admin._id,
      action: "email_license_updated",
      resourceType: "emailLicenses",
      resourceId: licenseId as string,
      severity: "info",
      details: updates,
    });
  },
});

export const deleteLicense = mutation({
  args: { licenseId: v.id("emailLicenses") },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);
    const lic = await ctx.db.get(args.licenseId);
    if (!lic) return;

    await ctx.db.delete(args.licenseId);

    await logSecurityAudit(ctx, {
      tenantId: lic.organizationId,
      actorId: admin._id,
      action: "email_license_deleted",
      resourceType: "emailLicenses",
      resourceId: args.licenseId as string,
      severity: "warning",
      details: { provider: lic.provider, adminEmail: lic.adminEmail },
    });
  },
});
