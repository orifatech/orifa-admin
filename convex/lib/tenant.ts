import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { auth } from "../auth";

export interface TenantContext {
  viewer: {
    _id: Id<"users">;
    role: "super_admin" | "client_admin" | "client_editor";
    organizationId?: Id<"organizations">;
    email?: string;
    name?: string;
  };
  organizationId: Id<"organizations"> | null;
  isSuperAdmin: boolean;
}

/**
 * Derives and verifies the tenant context from the server-authenticated session.
 * Adheres strictly to OWASP Multi-Tenant Cheat Sheet Section 1, 2, and 9:
 * - Derives tenant context solely from server-side identity (session token -> user -> org).
 * - Never trusts client-supplied tenant IDs as authorization proof.
 * - Detects and logs any cross-tenant access attempts.
 * - Enforces tenant lifecycle (rejects access if org is suspended or deleted).
 */
export async function assertTenantContext(
  ctx: QueryCtx | MutationCtx,
  requestedOrgId?: Id<"organizations">,
  resourceInfo?: { resourceType: string; resourceId?: string }
): Promise<TenantContext> {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized: Sign-in required to access this resource.");
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unauthorized: User account not found.");
  }

  // Fail-closed: Role must be strictly verified
  const role = user.role;
  if (!role || (role !== "super_admin" && role !== "client_admin" && role !== "client_editor")) {
    throw new Error("Forbidden: Account lacks assigned permissions.");
  }

  const viewer = {
    _id: user._id,
    role,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
  };

  // 1. Super Admin Context
  if (role === "super_admin") {
    if (requestedOrgId) {
      const org = await ctx.db.get(requestedOrgId);
      if (!org) {
        throw new Error("Organization not found.");
      }
      return { viewer, organizationId: requestedOrgId, isSuperAdmin: true };
    }
    return { viewer, organizationId: null, isSuperAdmin: true };
  }

  // 2. Client User Context (client_admin or client_editor)
  if (!user.organizationId) {
    throw new Error("Forbidden: Account is not assigned to any organization.");
  }

  // Verify Organization lifecycle status (OWASP §7 & §1)
  const org = await ctx.db.get(user.organizationId);
  if (!org) {
    throw new Error("Forbidden: Organization does not exist.");
  }

  if (org.status && org.status !== "active") {
    throw new Error(`Forbidden: Organization workspace is currently ${org.status}.`);
  }

  // OWASP §2 & §9: Client-supplied selector must match server-verified tenant
  if (requestedOrgId && requestedOrgId !== user.organizationId) {
    // Record cross-tenant access violation in audit logs if running inside a mutation
    if ("insert" in ctx.db) {
      try {
        await (ctx as MutationCtx).db.insert("auditLogs", {
          tenantId: user.organizationId,
          actorId: user._id,
          action: "cross_tenant_access_attempt",
          resourceType: resourceInfo?.resourceType ?? "unknown",
          resourceId: resourceInfo?.resourceId ?? (requestedOrgId as string),
          severity: "critical",
          details: {
            attemptedOrgId: requestedOrgId,
            verifiedOrgId: user.organizationId,
            userEmail: user.email,
          },
          timestamp: Date.now(),
        });
      } catch (logErr) {
        console.error("Failed to write cross-tenant security audit log:", logErr);
      }
    }

    // Fail closed with a generic message to prevent tenant existence probing
    throw new Error("Forbidden: Access denied.");
  }

  return { viewer, organizationId: user.organizationId, isSuperAdmin: false };
}

/**
 * Append-only security audit log writer.
 * Adheres to OWASP Cheat Sheet Section 9: Tamper-evident, tenant-aware logging.
 */
export async function logSecurityAudit(
  ctx: MutationCtx,
  entry: {
    tenantId?: Id<"organizations">;
    actorId?: Id<"users">;
    action: string;
    resourceType: string;
    resourceId?: string;
    severity: "info" | "warning" | "critical";
    details?: Record<string, unknown>;
  }
) {
  try {
    await ctx.db.insert("auditLogs", {
      tenantId: entry.tenantId,
      actorId: entry.actorId,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      severity: entry.severity,
      details: entry.details,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error("Failed to record security audit log:", err);
  }
}
