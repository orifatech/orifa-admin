import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getViewerOrThrow } from "./lib/auth";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

// Helper to compute SHA-256 hash in Web Crypto API
async function sha256(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper to generate cryptographically secure random token (32 bytes url-safe base64)
function generateSecureToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (let i = 0; i < randomBytes.byteLength; i++) {
    binary += String.fromCharCode(randomBytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Creates a cryptographically secure tenant invitation.
 * OWASP Multi-Tenant Principle §7:
 * - High-entropy token generated server-side.
 * - Only the SHA-256 hash is persisted.
 * - Strict role assignment (client_admin or client_editor).
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("client_admin"), v.literal("client_editor")),
  },
  handler: async (ctx, args) => {
    const { viewer, isSuperAdmin } = await assertTenantContext(ctx, args.organizationId, {
      resourceType: "invitations",
    });

    // Only super_admin or client_admin within the same org can issue invitations
    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Only administrators can invite new members.");
    }

    const normalizedEmail = args.email.trim().toLowerCase();

    // Check for existing pending invitation for this email and organization
    const existing = await ctx.db
      .query("invitations")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) =>
        q.and(
          q.eq(q.field("organizationId"), args.organizationId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existing && existing.expiresAt > Date.now()) {
      throw new Error("An active invitation already exists for this email address.");
    }

    const rawToken = generateSecureToken();
    const tokenHash = await sha256(rawToken);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days expiry

    const invitationId = await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: normalizedEmail,
      role: args.role,
      tokenHash,
      status: "pending",
      invitedBy: viewer._id,
      expiresAt,
      createdAt: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: viewer._id,
      action: "invitation_created",
      resourceType: "invitations",
      resourceId: invitationId as string,
      severity: "info",
      details: {
        recipientEmail: normalizedEmail,
        assignedRole: args.role,
      },
    });

    return {
      invitationId,
      token: rawToken,
      expiresAt,
    };
  },
});

/**
 * Validates an invitation token prior to redemption.
 * Publicly queryable to render the invitation accept landing screen.
 */
export const validate = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    if (!args.token || args.token.length < 16) {
      return { valid: false, reason: "Invalid invitation format." };
    }

    const tokenHash = await sha256(args.token);
    const invite = await ctx.db
      .query("invitations")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!invite) {
      return { valid: false, reason: "Invitation not found." };
    }

    if (invite.status !== "pending") {
      return { valid: false, reason: `This invitation has already been ${invite.status}.` };
    }

    if (Date.now() > invite.expiresAt) {
      return { valid: false, reason: "This invitation has expired." };
    }

    const org = await ctx.db.get(invite.organizationId);
    if (!org || (org.status && org.status !== "active")) {
      return { valid: false, reason: "The invited organization is currently inactive." };
    }

    return {
      valid: true,
      email: invite.email,
      role: invite.role,
      organizationName: org.name,
      organizationSlug: org.slug,
      expiresAt: invite.expiresAt,
    };
  },
});

/**
 * Consumes and accepts an invitation, binding the user to the tenant workspace.
 */
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);

    const tokenHash = await sha256(args.token);
    const invite = await ctx.db
      .query("invitations")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .first();

    if (!invite) {
      throw new Error("Invalid invitation.");
    }

    if (invite.status !== "pending") {
      throw new Error(`This invitation has already been ${invite.status}.`);
    }

    if (Date.now() > invite.expiresAt) {
      await ctx.db.patch(invite._id, { status: "expired" });
      throw new Error("This invitation has expired.");
    }

    const org = await ctx.db.get(invite.organizationId);
    if (!org || (org.status && org.status !== "active")) {
      throw new Error("The invited organization is currently inactive.");
    }

    // Verify email match if account has email
    if (viewer.email && viewer.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error(
        `This invitation was issued to ${invite.email}. Please sign in with the matching email.`
      );
    }

    // Bind user to organization and assign role
    await ctx.db.patch(viewer._id, {
      organizationId: invite.organizationId,
      role: invite.role,
    });

    // Mark invitation as accepted
    await ctx.db.patch(invite._id, {
      status: "accepted",
    });

    await logSecurityAudit(ctx, {
      tenantId: invite.organizationId,
      actorId: viewer._id,
      action: "invitation_accepted",
      resourceType: "invitations",
      resourceId: invite._id as string,
      severity: "info",
      details: {
        role: invite.role,
        userEmail: viewer.email,
      },
    });

    return {
      success: true,
      organizationId: invite.organizationId,
      role: invite.role,
    };
  },
});

/**
 * Lists invitations for an organization.
 */
export const listByOrg = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const { viewer, isSuperAdmin } = await assertTenantContext(ctx, args.organizationId, {
      resourceType: "invitations",
    });

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Only administrators can view workspace invitations.");
    }

    const items = await ctx.db
      .query("invitations")
      .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();

    return items.map((item) => ({
      _id: item._id,
      email: item.email,
      role: item.role,
      status: item.status,
      expiresAt: item.expiresAt,
      createdAt: item.createdAt,
    }));
  },
});

/**
 * Revokes a pending invitation.
 */
export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, args) => {
    const invite = await ctx.db.get(args.invitationId);
    if (!invite) throw new Error("Invitation not found.");

    const { viewer, isSuperAdmin } = await assertTenantContext(ctx, invite.organizationId, {
      resourceType: "invitations",
      resourceId: args.invitationId as string,
    });

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Only administrators can revoke invitations.");
    }

    await ctx.db.patch(args.invitationId, { status: "revoked" });

    await logSecurityAudit(ctx, {
      tenantId: invite.organizationId,
      actorId: viewer._id,
      action: "invitation_revoked",
      resourceType: "invitations",
      resourceId: args.invitationId as string,
      severity: "info",
      details: {
        revokedEmail: invite.email,
      },
    });

    return { success: true };
  },
});
