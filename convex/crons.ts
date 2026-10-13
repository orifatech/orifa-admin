import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const performDailyAudits = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 1000 * 60 * 60 * 24;

    // 1. Audit Domains
    const domains = await ctx.db.query("domainMonitors").collect();
    for (const d of domains) {
      const days = (d.expiresAt - now) / oneDay;
      const status = days < 0 ? "expired" : days <= 30 ? "expiring_soon" : "healthy";
      if (status !== d.status) {
        await ctx.db.patch(d._id, { status, lastCheckedAt: now });
      }
    }

    // 2. Audit Email Licenses
    const licenses = await ctx.db.query("emailLicenses").collect();
    for (const lic of licenses) {
      const days = (lic.renewalDate - now) / oneDay;
      const status = days < 0 ? "suspended" : days <= 14 ? "expiring_soon" : "active";
      if (status !== lic.status) {
        await ctx.db.patch(lic._id, { status });
      }
    }
  },
});

const crons = cronJobs();

// Run daily at midnight UTC
crons.daily(
  "daily-agency-audits",
  { hourUTC: 0, minuteUTC: 0 },
  internal.crons.performDailyAudits
);

export default crons;
