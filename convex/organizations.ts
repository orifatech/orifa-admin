import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin } from "./lib/auth";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const { organizationId, isSuperAdmin } = await assertTenantContext(ctx, undefined, {
      resourceType: "organizations",
    });

    if (isSuperAdmin) {
      return await ctx.db.query("organizations").collect();
    }

    if (!organizationId) {
      return [];
    }

    const org = await ctx.db.get(organizationId);
    return org ? [org] : [];
  },
});

export const get = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    await assertTenantContext(ctx, args.organizationId, {
      resourceType: "organizations",
      resourceId: args.organizationId as string,
    });

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
    status: v.optional(
      v.union(v.literal("active"), v.literal("suspended"), v.literal("offboarding"), v.literal("deleted"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error(`An organization with slug '${args.slug}' already exists.`);
    }

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      contactEmail: args.contactEmail ?? "",
      phone: args.phone,
      billingStatus: args.billingStatus ?? "active",
      status: args.status ?? "active",
      createdAt: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: orgId,
      actorId: admin._id,
      action: "organization_created",
      resourceType: "organizations",
      resourceId: orgId as string,
      severity: "info",
      details: {
        name: args.name,
        slug: args.slug,
      },
    });

    return orgId;
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
    status: v.optional(
      v.union(v.literal("active"), v.literal("suspended"), v.literal("offboarding"), v.literal("deleted"))
    ),
  },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);

    const { organizationId, ...updates } = args;
    const current = await ctx.db.get(organizationId);
    if (!current) throw new Error("Organization not found.");

    await ctx.db.patch(organizationId, updates);

    // If tenant status changed (e.g. suspended, offboarded), log high severity audit event
    const statusChanged = updates.status && updates.status !== current.status;
    await logSecurityAudit(ctx, {
      tenantId: organizationId,
      actorId: admin._id,
      action: statusChanged ? "organization_status_changed" : "organization_updated",
      resourceType: "organizations",
      resourceId: organizationId as string,
      severity: statusChanged ? "critical" : "info",
      details: {
        previousStatus: current.status,
        newStatus: updates.status,
        ...updates,
      },
    });
  },
});
