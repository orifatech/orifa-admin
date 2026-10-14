import { mutation } from "./_generated/server";

export const seedSampleData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Check or create Orifa Technologies Org
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", "orifatech"))
      .first();

    if (!org) {
      const orgId = await ctx.db.insert("organizations", {
        name: "Orifa Technologies",
        slug: "orifatech",
        contactEmail: "admin@orifatech.com",
        phone: "+1 (555) 019-2834",
        billingStatus: "active",
        createdAt: Date.now(),
      });
      org = await ctx.db.get(orgId);
    }

    if (!org) throw new Error("Failed to create org.");

    // 2. Check or create sample project
    const orgProjects = await ctx.db
      .query("projects")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();

    let project = orgProjects.find((p) => p.name === "Orifatech Official Site") ?? null;

    if (!project) {
      const projectId = await ctx.db.insert("projects", {
        organizationId: org._id,
        name: "Orifatech Official Site",
        productionUrl: "https://orifatech.com",
        framework: "astro",
        githubRepoOwner: "elero-obaitan",
        githubRepoName: "orifatech",
        githubDefaultBranch: "main",
        contentRootPath: "src/content",
        editorSecretToken: "orifa_sec_" + Math.random().toString(36).slice(2, 10),
        createdAt: Date.now(),
      });
      project = await ctx.db.get(projectId);
    }

    if (!project) throw new Error("Failed to create project.");

    // 3. Create sample staged changes if none exist
    const existingChanges = await ctx.db
      .query("stagedChanges")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();

    if (existingChanges.length === 0) {
      await ctx.db.insert("stagedChanges", {
        projectId: project._id,
        organizationId: org._id,
        contentKey: "hero.headline",
        targetFile: "src/content/site-copy.json",
        originalValue: "Modern Engineering for Bold Ideas",
        proposedValue: "Next-Gen Software Development & Scalable Cloud Solutions",
        contentType: "text",
        status: "pending_review",
        createdAt: Date.now(),
      });

      await ctx.db.insert("stagedChanges", {
        projectId: project._id,
        organizationId: org._id,
        contentKey: "cta.buttonText",
        targetFile: "src/content/site-copy.json",
        originalValue: "Get in touch",
        proposedValue: "Book Discovery Call",
        contentType: "text",
        status: "pending_review",
        createdAt: Date.now(),
      });
    }

    // 4. Sample Domain
    const existingDomains = await ctx.db
      .query("domainMonitors")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();

    if (existingDomains.length === 0) {
      await ctx.db.insert("domainMonitors", {
        organizationId: org._id,
        projectId: project._id,
        domainName: "orifatech.com",
        registrar: "Cloudflare",
        expiresAt: Date.now() + 290 * 24 * 60 * 60 * 1000, // 290 days
        lastCheckedAt: Date.now(),
        autoRenewStatus: true,
        status: "healthy",
        notes: "Primary agency domain",
      });
    }

    // 5. Sample Retainer Subscription
    const existingSubs = await ctx.db
      .query("subscriptions")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();

    if (existingSubs.length === 0) {
      await ctx.db.insert("subscriptions", {
        organizationId: org._id,
        planName: "Monthly Full-Stack Retainer & Cloud Ops",
        monthlyFee: 1500,
        currency: "USD",
        billingCycle: "monthly",
        billingDayOfMonth: 1,
        status: "active",
        paymentMethod: "Wire Transfer",
        nextBillingDate: Date.now() + 20 * 24 * 60 * 60 * 1000,
      });
    }

    // 6. Sample Google Workspace License
    const existingLicenses = await ctx.db
      .query("emailLicenses")
      .withIndex("by_org", (q) => q.eq("organizationId", org._id))
      .collect();

    if (existingLicenses.length === 0) {
      await ctx.db.insert("emailLicenses", {
        organizationId: org._id,
        provider: "google_workspace",
        adminEmail: "admin@orifatech.com",
        seatCount: 6,
        costPerSeat: 7.2,
        currency: "USD",
        renewalDate: Date.now() + 14 * 24 * 60 * 60 * 1000,
        paymentCardLast4: "4242",
        status: "active",
      });
    }

    return {
      success: true,
      orgId: org._id,
      projectId: project._id,
    };
  },
});
