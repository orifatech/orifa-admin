"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Mail,
  Plus,
  Building2,
  Trash2,
} from "lucide-react";

export default function LicensesPage() {
  const licenses = useQuery(api.emailLicenses.list, {});
  const organizations = useQuery(api.organizations.list);
  const addLicense = useMutation(api.emailLicenses.add);
  const deleteLicense = useMutation(api.emailLicenses.deleteLicense);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: "",
    provider: "google_workspace" as const,
    adminEmail: "",
    seatCount: 5,
    costPerSeat: 7.2,
    currency: "USD",
    renewalDate: "",
    paymentCardLast4: "4242",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.adminEmail) return;

    try {
      setIsSubmitting(true);
      await addLicense({
        organizationId: formData.organizationId as any,
        provider: formData.provider,
        adminEmail: formData.adminEmail.trim(),
        seatCount: Number(formData.seatCount),
        costPerSeat: Number(formData.costPerSeat),
        currency: formData.currency,
        renewalDate: new Date(formData.renewalDate).getTime(),
        paymentCardLast4: formData.paymentCardLast4 || undefined,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Error adding email license: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any, email: string) => {
    if (confirm(`Remove license record for ${email}?`)) {
      await deleteLicense({ licenseId: id });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Mail className="h-6 w-6 text-blue-500" />
            Email &amp; Workspace Licenses
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Centrally manage Google Workspace, Microsoft 365, and Zoho seat counts and renewals.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Workspace
        </button>
      </div>

      {/* Licenses Table */}
      {licenses === undefined ? (
        <div className="h-64 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse" />
      ) : licenses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20 p-8 shadow-xs">
          <Mail className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">No workspace licenses recorded</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Track your clients&apos; Google Workspace or M365 email seats and renewal cycles.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add First Workspace
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-950/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Client Org</th>
                <th className="px-5 py-3 font-semibold">Provider</th>
                <th className="px-5 py-3 font-semibold">Admin Email</th>
                <th className="px-5 py-3 font-semibold">Seat Count</th>
                <th className="px-5 py-3 font-semibold">Monthly Total</th>
                <th className="px-5 py-3 font-semibold">Renewal Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/80">
              {licenses.map((lic) => (
                <tr key={lic._id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{lic.organizationName}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="capitalize font-medium text-zinc-800 dark:text-zinc-200">
                      {lic.provider.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-zinc-600 dark:text-zinc-300">{lic.adminEmail}</td>
                  <td className="px-5 py-3.5 font-mono text-zinc-800 dark:text-zinc-200">
                    {lic.seatCount} seat{lic.seatCount > 1 ? "s" : ""}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${lic.totalMonthlyCost?.toFixed(2)}{" "}
                    <span className="text-[10px] text-zinc-500">/mo</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-zinc-800 dark:text-zinc-200">
                      {new Date(lic.renewalDate).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {lic.daysToRenewal} days left
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        lic.status === "active"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                          : lic.status === "expiring_soon"
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                          : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                      }`}
                    >
                      {lic.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(lic._id, lic.adminEmail)}
                      className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                Add Workspace License
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Client Organization *
                </label>
                <select
                  required
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select client...</option>
                  {organizations?.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Provider</label>
                  <select
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="google_workspace">Google Workspace</option>
                    <option value="microsoft_365">Microsoft 365</option>
                    <option value="zoho">Zoho Mail</option>
                    <option value="cpanel_imap">cPanel IMAP</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Seat Count *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.seatCount}
                    onChange={(e) => setFormData({ ...formData, seatCount: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Primary Admin Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@clientdomain.com"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Cost per Seat ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formData.costPerSeat}
                    onChange={(e) => setFormData({ ...formData, costPerSeat: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Renewal Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Add License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
