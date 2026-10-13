import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getViewer, assertSuperAdmin, getViewerOrThrow } from "./lib/auth";

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
    const viewer = await getViewerOrThrow(ctx);

    if (viewer.role === "super_admin") {
      if (args.organizationId) {
        return await ctx.db
          .query("users")
          .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
          .collect();
      }
      return await ctx.db.query("users").collect();
    }

    if (!viewer.organizationId) {
      return [viewer];
    }

    return await ctx.db
      .query("users")
      .withIndex("by_org", (q) => q.eq("organizationId", viewer.organizationId))
      .collect();
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("super_admin"), v.literal("client_admin"), v.literal("client_editor")),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx);
    await ctx.db.patch(args.userId, {
      role: args.role,
      organizationId: args.organizationId,
    });
  },
});
