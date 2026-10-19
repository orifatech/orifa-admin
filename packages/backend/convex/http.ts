import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Paystack Webhook Handler
http.route({
  path: "/paystack-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    const signature = request.headers.get("x-paystack-signature");
    const rawBody = await request.text();

    if (!paystackSecretKey) {
      console.error("[Paystack Webhook] Missing PAYSTACK_SECRET_KEY");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify HMAC-SHA512 signature using Web Crypto API
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(paystackSecretKey),
        { name: "HMAC", hash: "SHA-512" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(rawBody));
      const calculatedHex = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (calculatedHex !== signature) {
        console.warn("[Paystack Webhook] Invalid signature match");
        return new Response("Invalid signature", { status: 400 });
      }

      const event = JSON.parse(rawBody);

      if (event.event === "charge.success") {
        const reference = event.data?.reference;
        if (reference) {
          const invoice = await ctx.runQuery(api.invoices.getByReference, { reference });
          if (invoice && invoice.status !== "paid") {
            await ctx.runMutation(api.invoices.markPaid, {
              invoiceId: invoice._id,
              paystackReference: reference,
              paymentMethod: event.data?.channel || "Paystack",
            });
            console.log(`[Paystack Webhook] Invoice ${invoice.invoiceNumber} successfully marked as paid.`);
          }
        }
      }

      return new Response("Webhook received successfully", { status: 200 });
    } catch (err: any) {
      console.error("[Paystack Webhook Error]", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

export default http;
