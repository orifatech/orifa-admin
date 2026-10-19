import { mutation, action } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { assertSuperAdmin } from "./lib/auth";

export const wipeAllDatabaseRecords = mutation({
  args: {},
  handler: async (ctx) => {
    // OWASP & Production Safety: Strictly restrict dangerous administrative reset operations
    await assertSuperAdmin(ctx);

    if (process.env.ALLOW_DATABASE_WIPE !== "true") {
      throw new Error(
        "Forbidden: Database wipe is disabled. Set ALLOW_DATABASE_WIPE='true' in environment variables to execute."
      );
    }

    const tables = [
      "stagedChanges",
      "mediaAssets",
      "blogPosts",
      "domainMonitors",
      "subscriptions",
      "emailLicenses",
      "vaultAuditLogs",
      "vaultCredentials",
      "projects",
      "invitations",
      "auditLogs",
      "organizations",
      "authSessions",
      "authAccounts",
      "authVerificationCodes",
      "authVerifiers",
      "authRateLimits",
      "authRefreshTokens",
      "users",
    ] as const;

    const deletionStats: Record<string, number> = {};

    for (const table of tables) {
      try {
        const records = await ctx.db.query(table as any).collect();
        deletionStats[table] = records.length;
        for (const record of records) {
          await ctx.db.delete(record._id);
        }
      } catch (err) {
        console.warn(`Could not clear table ${table}:`, err);
        deletionStats[table] = 0;
      }
    }

    return {
      success: true,
      deletionStats,
    };
  },
});

export const bootstrapSuperAdmin = action({
  args: {},
  handler: async (ctx) => {
    const email = "elero@orifatech.com";
    const password = process.env.INITIAL_SUPERADMIN_PASSWORD || "xqRGkd#*v95b4Yuvtju13$am&5u9rr@PUwpGh";
    const name = "Elero O";

    const result = await createAccount(ctx, {
      provider: "password",
      account: {
        id: email,
        secret: password,
      },
      profile: {
        name,
        email,
        role: "super_admin",
        createdAt: Date.now(),
      },
      shouldLinkViaEmail: false,
      shouldLinkViaPhone: false,
    });

    return {
      success: true,
      userId: result.user._id,
      accountId: result.account._id,
      email,
      name,
    };
  },
});
