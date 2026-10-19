import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";

async function getMasterCryptoKey(): Promise<CryptoKey> {
  const hex = process.env.VAULT_MASTER_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "VAULT_MASTER_KEY is not configured or is invalid. Please set a 64-character hex string (32 bytes)."
    );
  }
  const keyBytes = new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const { organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.organizationId,
      { resourceType: "vaultCredentials" }
    );

    let creds;
    if (isSuperAdmin) {
      if (organizationId) {
        creds = await ctx.db
          .query("vaultCredentials")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      } else {
        creds = await ctx.db.query("vaultCredentials").collect();
      }
    } else {
      if (!organizationId) return [];
      creds = await ctx.db
        .query("vaultCredentials")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();
    }

    return await Promise.all(
      creds.map(async (c) => {
        const org = await ctx.db.get(c.organizationId);
        return {
          _id: c._id,
          organizationId: c.organizationId,
          organizationName: org?.name ?? "Unknown",
          projectId: c.projectId,
          title: c.title,
          category: c.category,
          loginUsername: c.loginUsername,
          accessUrl: c.accessUrl,
          notes: c.notes,
          updatedAt: c.updatedAt,
        };
      })
    );
  },
});

export const getAuditLogs = query({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    const cred = await ctx.db.get(args.credentialId);
    if (!cred) return [];

    const { viewer, isSuperAdmin } = await assertTenantContext(
      ctx,
      cred.organizationId,
      { resourceType: "vaultCredentials", resourceId: args.credentialId as string }
    );

    // Only super_admin or client_admin can inspect audit logs
    if (!isSuperAdmin && viewer.role !== "client_admin") return [];

    const logs = await ctx.db
      .query("vaultAuditLogs")
      .withIndex("by_credential", (q) => q.eq("credentialId", args.credentialId))
      .order("desc")
      .take(20);

    return await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          userName: user?.name || user?.email || "Unknown User",
        };
      })
    );
  },
});

export const addCredential = mutation({
  args: {
    organizationId: v.id("organizations"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    category: v.union(
      v.literal("hosting"),
      v.literal("dns_registrar"),
      v.literal("database"),
      v.literal("api_service"),
      v.literal("email_admin"),
      v.literal("other")
    ),
    loginUsername: v.string(),
    plainSecret: v.string(),
    accessUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { viewer, isSuperAdmin } = await assertTenantContext(ctx, args.organizationId, {
      resourceType: "vaultCredentials",
    });

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Only administrators can store encrypted credentials.");
    }

    // Verify project belongs to organization if provided
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.organizationId !== args.organizationId) {
        throw new Error("Invalid project for this organization.");
      }
    }

    const key = await getMasterCryptoKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(args.plainSecret);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoded
    );

    const credentialId = await ctx.db.insert("vaultCredentials", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      title: args.title,
      category: args.category,
      loginUsername: args.loginUsername,
      encryptedSecret: bufferToBase64(cipherBuffer),
      iv: bufferToBase64(iv),
      authTag: "", // Included in AES-GCM buffer by Web Crypto API
      accessUrl: args.accessUrl,
      notes: args.notes,
      lastUpdatedBy: viewer._id,
      updatedAt: Date.now(),
    });

    await ctx.db.insert("vaultAuditLogs", {
      credentialId,
      userId: viewer._id,
      action: "created",
      timestamp: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: viewer._id,
      action: "vault_credential_created",
      resourceType: "vaultCredentials",
      resourceId: credentialId as string,
      severity: "info",
      details: {
        title: args.title,
        category: args.category,
      },
    });

    return credentialId;
  },
});

export const revealSecret = mutation({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    const cred = await ctx.db.get(args.credentialId);
    if (!cred) throw new Error("Credential not found.");

    const { viewer, isSuperAdmin } = await assertTenantContext(
      ctx,
      cred.organizationId,
      { resourceType: "vaultCredentials", resourceId: args.credentialId as string }
    );

    // OWASP Least Privilege: Only super admins and client admins can reveal credentials
    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: You do not have permissions to decrypt this secret.");
    }

    const key = await getMasterCryptoKey();
    const iv = base64ToUint8Array(cred.iv);
    const cipherBytes = base64ToUint8Array(cred.encryptedSecret);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      cipherBytes as unknown as BufferSource
    );

    const plainSecret = new TextDecoder().decode(decryptedBuffer);

    // Record audit log
    await ctx.db.insert("vaultAuditLogs", {
      credentialId: args.credentialId,
      userId: viewer._id,
      action: "viewed_secret",
      timestamp: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: cred.organizationId,
      actorId: viewer._id,
      action: "vault_secret_revealed",
      resourceType: "vaultCredentials",
      resourceId: args.credentialId as string,
      severity: "warning",
      details: {
        credentialTitle: cred.title,
      },
    });

    return plainSecret;
  },
});

export const deleteCredential = mutation({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    const cred = await ctx.db.get(args.credentialId);
    if (!cred) return;

    const { viewer, isSuperAdmin } = await assertTenantContext(
      ctx,
      cred.organizationId,
      { resourceType: "vaultCredentials", resourceId: args.credentialId as string }
    );

    if (!isSuperAdmin && viewer.role !== "client_admin") {
      throw new Error("Forbidden: Only administrators can delete credentials.");
    }

    await ctx.db.delete(args.credentialId);

    await logSecurityAudit(ctx, {
      tenantId: cred.organizationId,
      actorId: viewer._id,
      action: "vault_credential_deleted",
      resourceType: "vaultCredentials",
      resourceId: args.credentialId as string,
      severity: "warning",
      details: {
        credentialTitle: cred.title,
      },
    });
  },
});
