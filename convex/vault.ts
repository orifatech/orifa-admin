import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin, getViewerOrThrow } from "./lib/auth";

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
    const viewer = await getViewerOrThrow(ctx);

    let creds;
    const targetOrgId = args.organizationId;
    if (viewer.role === "super_admin") {
      if (targetOrgId) {
        creds = await ctx.db
          .query("vaultCredentials")
          .withIndex("by_org", (q) => q.eq("organizationId", targetOrgId))
          .collect();
      } else {
        creds = await ctx.db.query("vaultCredentials").collect();
      }
    } else {
      const viewerOrgId = viewer.organizationId;
      if (!viewerOrgId) return [];
      creds = await ctx.db
        .query("vaultCredentials")
        .withIndex("by_org", (q) => q.eq("organizationId", viewerOrgId))
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
    await assertSuperAdmin(ctx);

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
    const viewer = await getViewerOrThrow(ctx);

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

    return credentialId;
  },
});

export const revealSecret = mutation({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const cred = await ctx.db.get(args.credentialId);
    if (!cred) throw new Error("Credential not found.");

    if (viewer.role !== "super_admin" && viewer.organizationId !== cred.organizationId) {
      throw new Error("Forbidden: You do not have access to view this secret.");
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

    return plainSecret;
  },
});

export const deleteCredential = mutation({
  args: { credentialId: v.id("vaultCredentials") },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const cred = await ctx.db.get(args.credentialId);
    if (!cred) return;

    if (viewer.role !== "super_admin") {
      throw new Error("Only super administrators can delete credentials.");
    }

    await ctx.db.delete(args.credentialId);
  },
});
