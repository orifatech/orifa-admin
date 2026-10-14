"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Trash2,
  Calendar,
  Building2,
} from "lucide-react";

export default function DomainsPage() {
  const domains = useQuery(api.domains.list, {});
  const organizations = useQuery(api.organizations.list);
  const addDomain = useMutation(api.domains.add);
  const deleteDomain = useMutation(api.domains.deleteDomain);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: "",
    domainName: "",
    registrar: "Cloudflare",
    expiresAtDate: "",
    autoRenewStatus: true,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.domainName) return;

    try {
      setIsSubmitting(true);
      const expiresAt = new Date(formData.expiresAtDate).getTime();
      await addDomain({
        organizationId: formData.organizationId as any,
        domainName: formData.domainName.toLowerCase().trim(),
        registrar: formData.registrar,
        expiresAt,
        autoRenewStatus: formData.autoRenewStatus,
        notes: formData.notes || undefined,
      });
      setIsModalOpen(false);
      setFormData({
        organizationId: "",
        domainName: "",
        registrar: "Cloudflare",
        expiresAtDate: "",
        autoRenewStatus: true,
        notes: "",
      });
    } catch (err: any) {
      alert("Error adding domain: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (domainId: any, name: string) => {
    if (confirm(`Remove monitor for ${name}?`)) {
      await deleteDomain({ domainId });
    }
  };

  const expiringSoonCount = domains?.filter((d) => d.status === "expiring_soon").length || 0;
  const expiredCount = domains?.filter((d) => d.status === "expired").length || 0;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Clock className="h-6 w-6 text-blue-500" />
            Client Domain Expiration Monitors
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Track registrar expiration dates and prevent costly accidental client domain dropouts.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Domain
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400">Total Monitored</div>
            <div className="text-2xl font-bold text-zinc-100 mt-1">{domains?.length || 0}</div>
          </div>
          <CheckCircle2 className="h-8 w-8 text-blue-500/80" />
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-400">Expiring Within 30 Days</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">{expiringSoonCount}</div>
          </div>
          <AlertTriangle className="h-8 w-8 text-amber-500/80" />
        </div>

        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400">Expired / Critical</div>
            <div className="text-2xl font-bold text-rose-300 mt-1">{expiredCount}</div>
          </div>
          <XCircle className="h-8 w-8 text-rose-500/80" />
        </div>
      </div>

      {/* Domains Table */}
      {domains === undefined ? (
        <div className="h-64 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse" />
      ) : domains.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <Clock className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No domains monitored</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Add your clients&apos; domain names to receive automatic warnings before they expire.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Domain
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950/60 text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-800">
              <tr>
                <th className="px-5 py-3 font-semibold">Domain Name</th>
                <th className="px-5 py-3 font-semibold">Client Org</th>
                <th className="px-5 py-3 font-semibold">Registrar</th>
                <th className="px-5 py-3 font-semibold">Expiration Date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Auto-Renew</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {domains.map((domain) => (
                <tr key={domain._id} className="hover:bg-zinc-850/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-zinc-100 flex items-center gap-2">
                    <span className="font-mono text-blue-400 font-semibold">{domain.domainName}</span>
                    <a
                      href={`https://${domain.domainName}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300">{domain.organizationName}</td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-[11px]">{domain.registrar || "—"}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-mono text-zinc-200">
                      {new Date(domain.expiresAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {domain.daysRemaining > 0
                        ? `${domain.daysRemaining} days left`
                        : `${Math.abs(domain.daysRemaining)} days ago`}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${
                        domain.status === "healthy"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : domain.status === "expiring_soon"
                          ? "bg-amber-950/60 text-amber-400 border-amber-800/40"
                          : "bg-rose-950/60 text-rose-400 border-rose-800/40"
                      }`}
                    >
                      {domain.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[11px] font-medium ${
                        domain.autoRenewStatus ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      {domain.autoRenewStatus ? "Enabled" : "Manual"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(domain._id, domain.domainName)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Delete Monitor"
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

      {/* Add Domain Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Add Monitored Domain
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Client Organization *
                </label>
                <select
                  required
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select client...</option>
                  {organizations?.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Domain Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-agency.com"
                  value={formData.domainName}
                  onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Registrar</label>
                  <input
                    type="text"
                    value={formData.registrar}
                    onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiresAtDate}
                    onChange={(e) => setFormData({ ...formData, expiresAtDate: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={formData.autoRenewStatus}
                  onChange={(e) => setFormData({ ...formData, autoRenewStatus: e.target.checked })}
                  className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="autoRenew" className="text-xs text-zinc-300 cursor-pointer">
                  Auto-renew enabled at registrar
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {isSubmitting ? "Saving..." : "Add Domain Monitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
