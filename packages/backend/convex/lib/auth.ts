import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { auth } from "../auth";
import { assertTenantContext } from "./tenant";

export async function getViewer(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  const user = await ctx.db.get(userId);
  if (!user) return null;
  return {
    ...user,
    // Least-privilege: never fall back to super_admin
    role: user.role ?? "client_editor",
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
  const project = await ctx.db.get(projectId);
  if (!project) {
    throw new Error("Project not found.");
  }

  // Derive and verify tenant context (OWASP §1 & §2)
  const { viewer } = await assertTenantContext(ctx, project.organizationId, {
    resourceType: "projects",
    resourceId: projectId as string,
  });

  return { user: viewer, project };
}

export async function assertOrgAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
) {
  const { viewer } = await assertTenantContext(ctx, organizationId, {
    resourceType: "organizations",
    resourceId: organizationId as string,
  });
  return viewer;
}
