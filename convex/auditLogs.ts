import { query } from "./_generated/server";
import { v } from "convex/values";
import { assertTenantContext } from "./lib/tenant";

export const list = query({
  args: {
    tenantId: v.optional(v.id("organizations")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { viewer, organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.tenantId,
      { resourceType: "auditLogs" }
    );

    // Client editors cannot view security audit logs
    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Administrator access required to view audit logs.");
    }

    const maxItems = Math.min(args.limit ?? 50, 100);

    let logs;
    if (organizationId) {
      logs = await ctx.db
        .query("auditLogs")
        .withIndex("by_tenant", (q) => q.eq("tenantId", organizationId))
        .order("desc")
        .take(maxItems);
    } else {
      // Super admin viewing global events
      logs = await ctx.db
        .query("auditLogs")
        .order("desc")
        .take(maxItems);
    }

    return logs;
  },
});
