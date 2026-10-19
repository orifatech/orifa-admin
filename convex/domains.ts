import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const { organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.organizationId,
      { resourceType: "domainMonitors" }
    );

    let domains;
    if (isSuperAdmin) {
      if (organizationId) {
        domains = await ctx.db
          .query("domainMonitors")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      } else {
        domains = await ctx.db.query("domainMonitors").collect();
      }
    } else {
      if (!organizationId) return [];
      domains = await ctx.db
        .query("domainMonitors")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
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
    const { viewer, isSuperAdmin } = await assertTenantContext(ctx, args.organizationId, {
      resourceType: "domainMonitors",
    });

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Administrator access required to add domain monitors.");
    }

    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.organizationId !== args.organizationId) {
        throw new Error("Invalid project for this organization.");
      }
    }

    const now = Date.now();
    const days = (args.expiresAt - now) / (1000 * 60 * 60 * 24);
    const status = days < 0 ? "expired" : days <= 30 ? "expiring_soon" : "healthy";

    const monitorId = await ctx.db.insert("domainMonitors", {
      ...args,
      lastCheckedAt: now,
      status,
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: viewer._id,
      action: "domain_monitor_created",
      resourceType: "domainMonitors",
      resourceId: monitorId as string,
      severity: "info",
      details: { domainName: args.domainName },
    });

    return monitorId;
  },
});

export const update = mutation({
  args: {
    domainId: v.id("domainMonitors"),
    registrar: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    autoRenewStatus: v.optional(v.boolean()),
    status: v.optional(
      v.union(v.literal("healthy"), v.literal("expiring_soon"), v.literal("expired"))
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain) throw new Error("Domain monitor not found.");

    const { viewer, isSuperAdmin } = await assertTenantContext(
      ctx,
      domain.organizationId,
      { resourceType: "domainMonitors", resourceId: args.domainId as string }
    );

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Administrator access required to update domain monitors.");
    }

    const { domainId, ...updates } = args;
    await ctx.db.patch(domainId, updates);

    await logSecurityAudit(ctx, {
      tenantId: domain.organizationId,
      actorId: viewer._id,
      action: "domain_monitor_updated",
      resourceType: "domainMonitors",
      resourceId: domainId as string,
      severity: "info",
      details: updates,
    });
  },
});

export const deleteDomain = mutation({
  args: { domainId: v.id("domainMonitors") },
  handler: async (ctx, args) => {
    const domain = await ctx.db.get(args.domainId);
    if (!domain) return;

    const { viewer, isSuperAdmin } = await assertTenantContext(
      ctx,
      domain.organizationId,
      { resourceType: "domainMonitors", resourceId: args.domainId as string }
    );

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Administrator access required to delete domain monitors.");
    }

    await ctx.db.delete(args.domainId);

    await logSecurityAudit(ctx, {
      tenantId: domain.organizationId,
      actorId: viewer._id,
      action: "domain_monitor_deleted",
      resourceType: "domainMonitors",
      resourceId: args.domainId as string,
      severity: "warning",
      details: { domainName: domain.domainName },
    });
  },
});
