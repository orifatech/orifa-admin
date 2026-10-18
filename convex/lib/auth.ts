import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { auth } from "../auth";

export async function getViewer(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return {
    ...user,
    role: user.role ?? "super_admin",
  };
}

export async function getViewerOrThrow(ctx: QueryCtx | MutationCtx) {
  const user = await getViewer(ctx);
  if (!user) {
    throw new Error("Unauthorized: Please sign in to perform this action.");
  }
  return user;
}

export async function assertSuperAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await getViewerOrThrow(ctx);
  if (user.role !== "super_admin") {
    throw new Error("Forbidden: Super Administrator access required.");
  }
  return user;
}

export async function assertProjectAccess(
  ctx: QueryCtx | MutationCtx,
  projectId: Id<"projects">
) {
  const user = await getViewerOrThrow(ctx);
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  // Super admins have cross-organization access
  if (user.role === "super_admin") {
    return { user, project };
  }

  // Client users must match the organization
  if (!user.organizationId || user.organizationId !== project.organizationId) {
    throw new Error("Forbidden: You do not have access to this client project.");
  }

  return { user, project };
}

export async function assertOrgAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
) {
  const user = await getViewerOrThrow(ctx);

  if (user.role === "super_admin") {
    return user;
  }

  if (user.organizationId !== organizationId) {
    throw new Error("Forbidden: You do not have access to this organization.");
  }

  return user;
}
