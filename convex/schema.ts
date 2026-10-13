import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // ==========================================
  // 1. TENANCY & USERS
  // ==========================================
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    contactEmail: v.string(),
    phone: v.optional(v.string()),
    billingStatus: v.union(v.literal("active"), v.literal("past_due"), v.literal("free")),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    
    // Orifa Tenancy Fields
    organizationId: v.optional(v.id("organizations")), // null for Orifa super_admin
    role: v.union(v.literal("super_admin"), v.literal("client_admin"), v.literal("client_editor")),
    createdAt: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("by_org", ["organizationId"]),

  // ==========================================
  // 2. PROJECTS (CLIENT WEBSITES)
  // ==========================================
  projects: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    productionUrl: v.string(),
    stagingUrl: v.optional(v.string()),
    framework: v.union(v.literal("astro"), v.literal("nextjs"), v.literal("react")),
    
    // GitHub Repository Configuration for Pull Requests
    githubRepoOwner: v.string(),
    githubRepoName: v.string(),
    githubDefaultBranch: v.string(), // e.g. "main" or "updates"
    contentRootPath: v.string(),     // e.g. "src/content"
    
    // In-Place Editor Access Key
    editorSecretToken: v.string(),
    createdAt: v.number(),
  }).index("by_org", ["organizationId"]),

  // ==========================================
  // 3. CHANGE STAGING & DIFF QUEUE
  // ==========================================
  stagedChanges: defineTable({
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    authorId: v.id("users"),
    
    // Target File in Codebase
    targetFile: v.string(),     // e.g. "src/content/home.json" or "src/content/blog/post.md"
    contentKey: v.string(),     // e.g. "hero.title" or "body"
    contentType: v.union(v.literal("text"), v.literal("html"), v.literal("image"), v.literal("link")),
    
    originalValue: v.string(),
    proposedValue: v.string(),
    
    status: v.union(
      v.literal("draft"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("pr_created"),
      v.literal("merged"),
      v.literal("rejected")
    ),
    reviewerFeedback: v.optional(v.string()),
    batchName: v.optional(v.string()), // e.g. "Spring Refresh 2026"
    
    // GitHub PR Automation Reference
    pullRequestUrl: v.optional(v.string()),
    pullRequestNumber: v.optional(v.number()),
    branchName: v.optional(v.string()),
    committedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId", "status"])
    .index("by_org", ["organizationId"]),

  // ==========================================
  // 4. MEDIA ASSETS (STAGED WEBP)
  // ==========================================
  mediaAssets: defineTable({
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    originalName: v.string(),
    optimizedName: v.string(),      // e.g. "hero-banner.webp"
    mimeType: v.string(),
    sizeBytes: v.number(),
    storageId: v.id("_storage"),    // Convex storage reference
    repoDestinationPath: v.string(),// e.g. "public/images/uploads/hero-banner.webp"
    isCommitted: v.boolean(),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),

  // ==========================================
  // 5. BLOG ARTICLES
  // ==========================================
  blogPosts: defineTable({
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    markdownContent: v.string(),
    coverImageStorageId: v.optional(v.id("_storage")),
    coverImageUrl: v.optional(v.string()),
    author: v.string(),
    category: v.string(),
    tags: v.array(v.string()),
    seoTitle: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    
    status: v.union(v.literal("draft"), v.literal("pending_review"), v.literal("pr_created"), v.literal("published")),
    pullRequestUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    authorId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId", "slug"])
    .index("by_status", ["projectId", "status"]),

  // ==========================================
  // 6. AGENCY OPS: DOMAIN MONITORS
  // ==========================================
  domainMonitors: defineTable({
    organizationId: v.id("organizations"),
    projectId: v.optional(v.id("projects")),
    domainName: v.string(),         // e.g. "clientcompany.com"
    registrar: v.optional(v.string()), // e.g. "Namecheap", "Cloudflare"
    expiresAt: v.number(),          // Timestamp
    lastCheckedAt: v.number(),
    autoRenewStatus: v.boolean(),
    status: v.union(v.literal("healthy"), v.literal("expiring_soon"), v.literal("expired")),
    notes: v.optional(v.string()),
  }).index("by_expiry", ["expiresAt"]),

  // ==========================================
  // 7. AGENCY OPS: SUBSCRIPTIONS & RETAINERS
  // ==========================================
  subscriptions: defineTable({
    organizationId: v.id("organizations"),
    planName: v.string(),           // e.g. "Monthly Maintenance & Content Updates"
    monthlyFee: v.number(),         // Amount in minor units or integer (e.g. 50000)
    currency: v.string(),           // e.g. "USD", "NGN", "GBP"
    billingCycle: v.union(v.literal("monthly"), v.literal("quarterly"), v.literal("annual"), v.literal("ad_hoc")),
    billingDayOfMonth: v.number(),  // 1 to 31
    nextBillingDate: v.number(),
    status: v.union(v.literal("active"), v.literal("overdue"), v.literal("cancelled"), v.literal("not_applicable")),
    paymentMethod: v.string(),      // e.g. "Wire Transfer", "Stripe", "Paystack"
    notes: v.optional(v.string()),
  }).index("by_org", ["organizationId"]),

  // ==========================================
  // 8. AGENCY OPS: EMAIL WORKSPACE LICENSES
  // ==========================================
  emailLicenses: defineTable({
    organizationId: v.id("organizations"),
    provider: v.union(v.literal("google_workspace"), v.literal("microsoft_365"), v.literal("zoho"), v.literal("cpanel_imap"), v.literal("other")),
    adminEmail: v.string(),
    seatCount: v.number(),
    costPerSeat: v.number(),
    currency: v.string(),
    renewalDate: v.number(),
    paymentCardLast4: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("expiring_soon"), v.literal("suspended")),
  }).index("by_org", ["organizationId"]),

  // ==========================================
  // 9. AGENCY OPS: ENCRYPTED CREDENTIAL VAULT
  // ==========================================
  vaultCredentials: defineTable({
    organizationId: v.id("organizations"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),              // e.g. "Cloudflare DNS Admin", "cPanel Database User"
    category: v.union(v.literal("hosting"), v.literal("dns_registrar"), v.literal("database"), v.literal("api_service"), v.literal("email_admin"), v.literal("other")),
    loginUsername: v.string(),
    
    // AES-256-GCM Encrypted Payload
    encryptedSecret: v.string(),    // Ciphertext (Base64)
    iv: v.string(),                 // Initialization Vector (Base64)
    authTag: v.string(),            // Authentication Tag (Base64)
    
    accessUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    lastUpdatedBy: v.id("users"),
    updatedAt: v.number(),
  }).index("by_org", ["organizationId"]),

  vaultAuditLogs: defineTable({
    credentialId: v.id("vaultCredentials"),
    userId: v.id("users"),
    action: v.union(v.literal("viewed_secret"), v.literal("updated"), v.literal("created"), v.literal("deleted")),
    timestamp: v.number(),
  }).index("by_credential", ["credentialId"]),
});
