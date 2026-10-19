import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getViewer, assertSuperAdmin } from "./lib/auth";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const user = await getViewer(ctx);
    if (!user) return null;

    let organization = null;
    if (user.organizationId) {
      organization = await ctx.db.get(user.organizationId);
    }

    return {
      ...user,
      organization,
    };
  },
});

export const listUsers = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const { viewer, organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.organizationId,
      { resourceType: "users" }
    );

    if (isSuperAdmin) {
      if (organizationId) {
        return await ctx.db
          .query("users")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      }
      return await ctx.db.query("users").collect();
    }

    // Client admin can list users in their own organization
    if (viewer.role === "client_admin" && organizationId) {
      return await ctx.db
        .query("users")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();
    }

    // Client editors only see their own profile
    const me = await ctx.db.get(viewer._id);
    return me ? [me] : [];
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("super_admin"), v.literal("client_admin"), v.literal("client_editor")),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found.");

    await ctx.db.patch(args.userId, {
      role: args.role,
      organizationId: args.organizationId,
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId ?? targetUser.organizationId,
      actorId: admin._id,
      action: "user_role_changed",
      resourceType: "users",
      resourceId: args.userId as string,
      severity: "critical",
      details: {
        targetUserEmail: targetUser.email,
        previousRole: targetUser.role,
        newRole: args.role,
        newOrganizationId: args.organizationId,
      },
    });
  },
});
