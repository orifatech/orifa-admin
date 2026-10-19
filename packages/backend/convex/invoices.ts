import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { assertSuperAdmin } from "./lib/auth";
import { assertTenantContext, logSecurityAudit } from "./lib/tenant";
import { toMinorUnit } from "./lib/paystack";

export const list = query({
  args: { organizationId: v.optional(v.id("organizations")) },
  handler: async (ctx, args) => {
    const { organizationId, isSuperAdmin } = await assertTenantContext(
      ctx,
      args.organizationId,
      { resourceType: "invoices" }
    );

    let invoices;
    if (isSuperAdmin) {
      if (organizationId) {
        invoices = await ctx.db
          .query("invoices")
          .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
          .collect();
      } else {
        invoices = await ctx.db.query("invoices").collect();
      }
    } else {
      if (!organizationId) return [];
      invoices = await ctx.db
        .query("invoices")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();
    }

    // Enrich with organization names
    return await Promise.all(
      invoices.map(async (inv) => {
        const org = await ctx.db.get(inv.organizationId);
        return {
          ...inv,
          organizationName: org?.name ?? "Unknown Organization",
          organizationSlug: org?.slug,
        };
      })
    );
  },
});

export const get = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) return null;

    await assertTenantContext(ctx, invoice.organizationId, {
      resourceType: "invoices",
      resourceId: args.invoiceId as string,
    });

    const org = await ctx.db.get(invoice.organizationId);
    return {
      ...invoice,
      organizationName: org?.name ?? "Unknown Organization",
      contactEmail: org?.contactEmail,
    };
  },
});

export const getByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_reference", (q) => q.eq("paystackReference", args.reference))
      .first();
  },
});


export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    subscriptionId: v.optional(v.id("subscriptions")),
    invoiceNumber: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(), // "NGN", "GHS", "KES", "ZAR", "USD"
    dueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);

    const amountInMinor = toMinorUnit(args.amount);

    const invoiceId = await ctx.db.insert("invoices", {
      organizationId: args.organizationId,
      subscriptionId: args.subscriptionId,
      invoiceNumber: args.invoiceNumber,
      description: args.description,
      amount: args.amount,
      amountInMinor,
      currency: args.currency,
      status: "pending",
      dueDate: args.dueDate,
      paymentMethod: "Paystack",
      notes: args.notes,
      createdAt: Date.now(),
    });

    await logSecurityAudit(ctx, {
      tenantId: args.organizationId,
      actorId: admin._id,
      action: "invoice_created",
      resourceType: "invoices",
      resourceId: invoiceId as string,
      severity: "info",
      details: {
        invoiceNumber: args.invoiceNumber,
        amount: args.amount,
        currency: args.currency,
      },
    });

    return invoiceId;
  },
});

export const updatePaystackDetails = mutation({
  args: {
    invoiceId: v.id("invoices"),
    paystackReference: v.string(),
    paystackAccessCode: v.optional(v.string()),
    paystackAuthorizationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    await ctx.db.patch(args.invoiceId, {
      paystackReference: args.paystackReference,
      paystackAccessCode: args.paystackAccessCode,
      paystackAuthorizationUrl: args.paystackAuthorizationUrl,
    });
  },
});

export const markPaid = mutation({
  args: {
    invoiceId: v.id("invoices"),
    paymentMethod: v.optional(v.string()),
    paystackReference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    const now = Date.now();
    await ctx.db.patch(args.invoiceId, {
      status: "paid",
      paidAt: now,
      paymentMethod: args.paymentMethod ?? "Paystack",
      paystackReference: args.paystackReference ?? invoice.paystackReference,
    });

    // If this invoice was associated with a subscription, advance subscription to active
    if (invoice.subscriptionId) {
      const sub = await ctx.db.get(invoice.subscriptionId);
      if (sub) {
        const nextBilling = new Date();
        nextBilling.setMonth(nextBilling.getMonth() + 1);
        await ctx.db.patch(invoice.subscriptionId, {
          status: "active",
          nextBillingDate: nextBilling.getTime(),
        });
      }
    }

    await logSecurityAudit(ctx, {
      tenantId: invoice.organizationId,
      action: "invoice_paid",
      resourceType: "invoices",
      resourceId: invoice._id as string,
      severity: "info",
      details: {
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency,
        paystackReference: args.paystackReference,
      },
    });
  },
});

export const deleteInvoice = mutation({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    const admin = await assertSuperAdmin(ctx);
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    await ctx.db.delete(args.invoiceId);

    await logSecurityAudit(ctx, {
      tenantId: invoice.organizationId,
      actorId: admin._id,
      action: "invoice_deleted",
      resourceType: "invoices",
      resourceId: args.invoiceId as string,
      severity: "warning",
      details: {
        invoiceNumber: invoice.invoiceNumber,
      },
    });
  },
});
