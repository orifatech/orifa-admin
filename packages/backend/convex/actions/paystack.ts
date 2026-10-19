"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { SUPPORTED_PAYSTACK_COUNTRIES, toMinorUnit } from "../lib/paystack";

export type InitializePaymentResult = {
  status: boolean;
  authorizationUrl?: string;
  accessCode?: string;
  reference?: string;
  converted?: boolean;
  convertedCurrency?: string;
  convertedAmount?: number;
};

export type VerifyPaymentResult = {
  verified: boolean;
  message: string;
  channel?: string;
  paidAt?: string;
  amount?: number;
  currency?: string;
};

export const initializePayment = action({
  args: {
    invoiceId: v.id("invoices"),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args): Promise<InitializePaymentResult> => {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key is not configured.");
    }

    const invoice: any = await ctx.runQuery(api.invoices.get, { invoiceId: args.invoiceId });
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const reference: string = invoice.paystackReference || `orifa_${invoice._id}_${Date.now()}`;
    const email: string = invoice.contactEmail || "billing@orifatech.com";

    // Attempt 1: Direct charge in invoice currency
    const requestedCurrency: string = invoice.currency;
    const requestedAmountInMinor: number = invoice.amountInMinor || toMinorUnit(invoice.amount);

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: requestedAmountInMinor,
        currency: requestedCurrency,
        reference,
        callback_url: args.callbackUrl,
        metadata: {
          invoiceId: invoice._id,
          organizationId: invoice.organizationId,
          invoiceNumber: invoice.invoiceNumber,
          originalCurrency: invoice.currency,
          originalAmount: invoice.amount,
        },
      }),
    });

    let resData: any = await paystackResponse.json();

    // If merchant account does not support the requested foreign currency (e.g. NGN-only merchant receiving USD/KES/GHS),
    // automatically fall back to NGN conversion so international cards can pay seamlessly!
    if (!resData.status && resData.code === "unsupported_currency") {
      console.warn(
        `[Paystack] Currency ${requestedCurrency} unsupported by merchant account. Converting to NGN for international card settlement.`
      );

      const countryConfig = Object.values(SUPPORTED_PAYSTACK_COUNTRIES).find(
        (c) => c.currency === requestedCurrency
      );
      const rate = countryConfig?.ngnExchangeRate || 1550;
      const convertedNgnAmount = Math.round(invoice.amount * rate);
      const convertedNgnMinor = toMinorUnit(convertedNgnAmount);

      const retryReference = `${reference}_ngn`;

      const fallbackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: convertedNgnMinor,
          currency: "NGN",
          reference: retryReference,
          callback_url: args.callbackUrl,
          metadata: {
            invoiceId: invoice._id,
            organizationId: invoice.organizationId,
            invoiceNumber: invoice.invoiceNumber,
            originalCurrency: invoice.currency,
            originalAmount: invoice.amount,
            convertedNgnAmount,
            appliedRate: rate,
          },
        }),
      });

      resData = await fallbackResponse.json();

      if (resData.status && resData.data) {
        await ctx.runMutation(api.invoices.updatePaystackDetails, {
          invoiceId: args.invoiceId,
          paystackReference: retryReference,
          paystackAccessCode: resData.data.access_code,
          paystackAuthorizationUrl: resData.data.authorization_url,
        });

        return {
          status: true,
          authorizationUrl: resData.data.authorization_url,
          accessCode: resData.data.access_code,
          reference: retryReference,
          converted: true,
          convertedCurrency: "NGN",
          convertedAmount: convertedNgnAmount,
        };
      }
    }

    if (!resData.status) {
      throw new Error(resData.message || "Failed to initialize Paystack transaction");
    }

    await ctx.runMutation(api.invoices.updatePaystackDetails, {
      invoiceId: args.invoiceId,
      paystackReference: reference,
      paystackAccessCode: resData.data.access_code,
      paystackAuthorizationUrl: resData.data.authorization_url,
    });

    return {
      status: true,
      authorizationUrl: resData.data.authorization_url,
      accessCode: resData.data.access_code,
      reference,
      converted: false,
    };
  },
});

export const verifyPayment = action({
  args: {
    reference: v.string(),
    invoiceId: v.optional(v.id("invoices")),
  },
  handler: async (ctx, args): Promise<VerifyPaymentResult> => {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key is not configured.");
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(args.reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const resData: any = await response.json();

    if (!resData.status || resData.data?.status !== "success") {
      return {
        verified: false,
        message: resData.message || "Payment has not been confirmed yet.",
      };
    }

    // Resolve invoice either via provided ID or paystackReference lookup
    let invoiceId = args.invoiceId;
    if (!invoiceId) {
      const inv: any = await ctx.runQuery(api.invoices.getByReference, { reference: args.reference });
      if (inv) invoiceId = inv._id;
    }

    if (invoiceId) {
      await ctx.runMutation(api.invoices.markPaid, {
        invoiceId,
        paystackReference: args.reference,
        paymentMethod: resData.data.channel || "Paystack Card",
      });
    }

    return {
      verified: true,
      message: "Payment successfully verified",
      channel: resData.data.channel,
      paidAt: resData.data.paid_at,
      amount: resData.data.amount,
      currency: resData.data.currency,
    };
  },
});
