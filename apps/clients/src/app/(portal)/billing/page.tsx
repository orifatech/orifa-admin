"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@orifa/backend";
import {
  SUPPORTED_PAYSTACK_COUNTRIES,
  resolveCountryAndCurrency,
  formatCurrencyAmount,
  CountryCurrencyConfig,
} from "@orifa/backend";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Globe,
  Loader2,
  Receipt,
  FileCheck,
  X,
  Printer,
  ChevronRight,
} from "lucide-react";

export default function ClientBillingPage() {
  const searchParams = useSearchParams();
  const paymentRefFromUrl = searchParams.get("reference") || searchParams.get("trxref");

  const viewer = useQuery(api.users.viewer);
  const orgId = viewer?.organizationId;
  const organization = viewer?.organization;
  const subscriptions = useQuery(api.subscriptions.list, orgId ? { organizationId: orgId } : {}) || [];
  const invoices = useQuery(api.invoices.list, orgId ? { organizationId: orgId } : {}) || [];

  const initializePayment = useAction(api.actions.paystack.initializePayment);
  const verifyPayment = useAction(api.actions.paystack.verifyPayment);

  // Active Retainer Subscription
  const activeSub = subscriptions.find((s: any) => s.status === "active") || subscriptions[0];

  // Country & Currency State derived purely from organization or browser locale
  const selectedCountryCode = useMemo(() => {
    if (organization?.country && SUPPORTED_PAYSTACK_COUNTRIES[organization.country]) {
      return organization.country;
    }
    if (typeof window !== "undefined") {
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const detected = resolveCountryAndCurrency(undefined, tz);
        return detected.code;
      } catch {
        return "US";
      }
    }
    return "US";
  }, [organization?.country]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    reference?: string;
  } | null>(null);

  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  // Invoice Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const verifiedRef = useRef<string | null>(null);

  // Handle return from Paystack checkout (reference in URL)
  useEffect(() => {
    if (!paymentRefFromUrl || verifiedRef.current === paymentRefFromUrl) {
      return;
    }
    verifiedRef.current = paymentRefFromUrl;

    const runVerification = async () => {
      setIsVerifying(true);
      try {
        const res: any = await verifyPayment({ reference: paymentRefFromUrl });
        if (res.verified) {
          setVerificationResult({
            success: true,
            message: "Payment successfully verified! Your retainer is updated and receipt generated.",
            reference: paymentRefFromUrl,
          });
        } else {
          setVerificationResult({
            success: false,
            message: res.message || "Payment verification could not be completed.",
            reference: paymentRefFromUrl,
          });
        }
      } catch (err: any) {
        setVerificationResult({
          success: false,
          message: err.message || "An unexpected error occurred verifying your payment.",
          reference: paymentRefFromUrl,
        });
      } finally {
        setIsVerifying(false);
      }
    };

    void runVerification();
  }, [paymentRefFromUrl, verifyPayment]);

  const activeCountryConfig: CountryCurrencyConfig =
    SUPPORTED_PAYSTACK_COUNTRIES[selectedCountryCode] || SUPPORTED_PAYSTACK_COUNTRIES.US;

  const primaryColor = organization?.primaryColor || "#006e2b";

  // Launch Paystack Payment for a specific invoice
  const handlePayInvoice = async (invoiceId: any) => {
    setPayingInvoiceId(invoiceId);
    setPayError(null);

    try {
      const callbackUrl = `${window.location.origin}/billing`;
      const result = await initializePayment({
        invoiceId,
        callbackUrl,
      });

      if (result.status && result.authorizationUrl) {
        // Redirect to Paystack Checkout safely
        window.location.assign(result.authorizationUrl);
      } else {
        setPayError("Could not initialize Paystack checkout. Please try again.");
      }
    } catch (err: any) {
      setPayError(err.message || "Payment initialization failed.");
    } finally {
      setPayingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl font-sans">
      {/* 1. Header & Country Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Retainer &amp; Billing Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your monthly SLA maintenance contract, pay invoices with Paystack, and track receipts.
          </p>
        </div>

        {/* Read-Only Billing Jurisdiction Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
          <Globe className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold">{activeCountryConfig.flag} {activeCountryConfig.name}</span>
          <span className="text-gray-400">•</span>
          <span className="font-mono text-[11px] text-gray-500">{activeCountryConfig.currency}</span>
        </div>
      </div>

      {/* 2. Verification Alert Banner */}
      {isVerifying && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-800">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span>Verifying Paystack transaction reference: {paymentRefFromUrl}...</span>
        </div>
      )}

      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
            verificationResult.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {verificationResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{verificationResult.message}</p>
              {verificationResult.reference && (
                <p className="text-[11px] text-gray-600 mt-0.5 font-mono">
                  Paystack Reference: {verificationResult.reference}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {payError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between gap-3 text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{payError}</span>
          </div>
          <button onClick={() => setPayError(null)} className="text-red-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Retainer Plan & Pricing Card */}
      {activeSub && activeSub.status === "active" ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Active SLA Maintenance Contract
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                  <span>{activeCountryConfig.flag}</span>
                  <span>{activeCountryConfig.name}</span>
                </span>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeSub.planName || "Enterprise Maintenance & Code Support"}
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  Guarantees continuous uptime monitoring, weekly automated off-site backups, priority turnarounds
                  for visual changes, automated WHOIS domain renewal tracking, and dedicated engineering review.
                </p>
              </div>

              {/* SLA Inclusions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>24/7 Uptime &amp; Health Probes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant GitHub PR Automation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sharp WebP Image Pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Automated Domain &amp; SSL Renewal</span>
                </div>
              </div>
            </div>

            {/* Pricing & Checkout Column */}
            <div className="lg:border-l lg:border-gray-100 lg:pl-8 flex flex-col justify-between space-y-4">
              <div>
                <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Negotiated Monthly Retainer
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {formatCurrencyAmount(activeSub.monthlyFee, activeSub.currency)}
                  </span>
                  <span className="text-xs text-gray-500"> / month</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Next renewal date:{" "}
                  <span className="font-medium text-gray-700">
                    {activeSub.nextBillingDate
                      ? new Date(activeSub.nextBillingDate).toLocaleDateString()
                      : "1st of next month"}
                  </span>
                </p>
              </div>

              {/* Pay Pending Retainer Invoice Button */}
              {(() => {
                const pendingInvoice = invoices.find((inv: any) => inv.status === "pending");
                if (pendingInvoice) {
                  const isPayingThis = payingInvoiceId === pendingInvoice._id;

                  return (
                    <div className="space-y-2">
                      <button
                        onClick={() => handlePayInvoice(pendingInvoice._id)}
                        disabled={isPayingThis}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-xs hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {isPayingThis ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting to Paystack...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Pay {pendingInvoice.invoiceNumber} with Paystack</span>
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-gray-400 text-center">
                        Accepts local African debit/credit cards, USSD, and international cards.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">All invoices settled! Retainer is up to date.</span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              Pay-as-you-go Account
            </span>
            <h2 className="text-base font-bold text-gray-900">
              No Active Monthly SLA Maintenance Retainer
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your organization is currently on standard support. Dedicated 24/7 uptime monitoring, weekly automated backups, priority visual change reviews, and domain renewal protection are part of the Orifa SLA Retainer.
            </p>
          </div>

          <a
            href="mailto:support@orifatech.com?subject=Inquiry regarding SLA Maintenance Retainer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-semibold shadow-xs hover:opacity-90 shrink-0 cursor-pointer transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Inquire About Maintenance</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* 4. Invoices History Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Official Invoices &amp; Receipts</h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Review settled and upcoming invoices. Download tax-compliant VAT receipts for accounting.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
            {invoices.length} Total Invoices
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-gray-900">No invoices recorded yet</p>
            <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
              Your maintenance contract invoices will appear here once generated by the Orifa accounting team.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((inv: any) => {
              const isPaid = inv.status === "paid";
              const isPending = inv.status === "pending";
              const isPayingThis = payingInvoiceId === inv._id;

              return (
                <div
                  key={inv._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPaid
                          ? "bg-emerald-50 text-emerald-700"
                          : isPending
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {isPaid ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{inv.invoiceNumber}</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800"
                              : isPending
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isPaid ? "Paid" : isPending ? "Pending Payment" : inv.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span>{inv.description}</span>
                        <span>•</span>
                        <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                        {inv.paystackReference && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-gray-400">
                              Ref: {inv.paystackReference}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrencyAmount(inv.amount, inv.currency)}
                    </span>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          onClick={() => handlePayInvoice(inv._id)}
                          disabled={isPayingThis}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {isPayingThis ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Paying...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Now</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setViewingReceipt(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="View Official Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5 text-gray-500" />
                        <span className="hidden sm:inline">Receipt</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Printable Invoice Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Top Actions */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-gray-900">Tax Invoice / Receipt</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-8 space-y-6 text-xs bg-white">
              <div className="flex justify-between items-start border-b border-gray-100 pb-5">
                <div>
                  <div className="text-lg font-black tracking-tight text-gray-900">ORIFA TECHNOLOGIES</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Application Monitoring &amp; Engineering</div>
                  <div className="text-[10px] text-gray-400">billing@orifatech.com</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900">{viewingReceipt.invoiceNumber}</div>
                  <div className="text-[11px] text-gray-500">
                    Date: {new Date(viewingReceipt.createdAt).toLocaleDateString()}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        viewingReceipt.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {viewingReceipt.status === "paid" ? "SETTLED / PAID" : "PENDING PAYMENT"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BILLED TO</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    {organization?.name || "Client Organization"}
                  </div>
                  <div className="text-[11px] text-gray-500">{organization?.contactEmail}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    PAYMENT CHANNEL
                  </div>
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    {viewingReceipt.paymentMethod || "Paystack Gateway"}
                  </div>
                  {viewingReceipt.paystackReference && (
                    <div className="text-[10px] font-mono text-gray-500 truncate">
                      Ref: {viewingReceipt.paystackReference}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    <tr>
                      <td className="p-3 text-gray-900 font-medium">{viewingReceipt.description}</td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        {formatCurrencyAmount(viewingReceipt.amount, viewingReceipt.currency)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 border-t border-gray-100">
                    <tr>
                      <td className="p-3 font-bold text-gray-900">Total Due / Paid</td>
                      <td className="p-3 text-right font-extrabold text-sm text-gray-900">
                        {formatCurrencyAmount(viewingReceipt.amount, viewingReceipt.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Footer Note */}
              <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4">
                Thank you for your business. For any billing inquiries, reach out to billing@orifatech.com.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
