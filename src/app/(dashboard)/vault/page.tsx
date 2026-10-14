"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  KeyRound,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  Building2,
  ExternalLink,
  Trash2,
  ShieldAlert,
  History,
  Lock,
} from "lucide-react";

export default function VaultPage() {
  const credentials = useQuery(api.vault.list, {});
  const organizations = useQuery(api.organizations.list);
  const addCredential = useMutation(api.vault.addCredential);
  const revealSecret = useMutation(api.vault.revealSecret);
  const deleteCredential = useMutation(api.vault.deleteCredential);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    organizationId: "",
    title: "",
    category: "hosting" as const,
    loginUsername: "",
    plainSecret: "",
    accessUrl: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reveal Secret State
  const [revealedCredId, setRevealedCredId] = useState<string | null>(null);
  const [revealedSecretText, setRevealedSecretText] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Audit Log State
  const [selectedAuditCredId, setSelectedAuditCredId] = useState<any>(null);
  const auditLogs = useQuery(
    api.vault.getAuditLogs,
    selectedAuditCredId ? { credentialId: selectedAuditCredId } : "skip"
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationId || !formData.title || !formData.plainSecret) return;

    try {
      setIsSubmitting(true);
      await addCredential({
        organizationId: formData.organizationId as any,
        title: formData.title,
        category: formData.category,
        loginUsername: formData.loginUsername,
        plainSecret: formData.plainSecret,
        accessUrl: formData.accessUrl || undefined,
        notes: formData.notes || undefined,
      });
      setIsAddModalOpen(false);
      setFormData({
        organizationId: "",
        title: "",
        category: "hosting",
        loginUsername: "",
        plainSecret: "",
        accessUrl: "",
        notes: "",
      });
    } catch (err: any) {
      alert("Error encrypting credential: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReveal = async (credId: any) => {
    try {
      setIsRevealing(true);
      setRevealedCredId(credId);
      const secret = await revealSecret({ credentialId: credId });
      setRevealedSecretText(secret);
    } catch (err: any) {
      alert("Error decrypting secret: " + err.message);
      setRevealedCredId(null);
    } finally {
      setIsRevealing(false);
    }
  };

  const closeReveal = () => {
    setRevealedCredId(null);
    setRevealedSecretText(null);
    setCopiedSecret(false);
  };

  const copySecret = () => {
    if (!revealedSecretText) return;
    navigator.clipboard.writeText(revealedSecretText);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleDelete = async (id: any, title: string) => {
    if (confirm(`Delete encrypted credential for "${title}"? This cannot be undone.`)) {
      await deleteCredential({ credentialId: id });
    }
  };

  const filtered = credentials?.filter((c) => {
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.loginUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.organizationName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-blue-500" />
            Encrypted Client Credential Vault
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Store cPanel, DNS registrar, hosting, and API keys encrypted with zero-knowledge AES-256-GCM.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Credential
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {["all", "hosting", "dns_registrar", "database", "api_service", "email_admin"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors capitalize whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            )
          )}
        </div>

        <input
          type="text"
          placeholder="Search credentials or clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 w-full sm:w-64"
        />
      </div>

      {/* Credentials Grid */}
      {filtered === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-zinc-900/40 border border-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 p-8">
          <KeyRound className="mx-auto h-12 w-12 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">No credentials found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Store passwords, cPanel access, or API secrets safely with hardware-grade AES-256-GCM encryption.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add First Credential
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cred) => (
            <div
              key={cred._id}
              className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between transition-all space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-100 text-base truncate">{cred.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <Building2 className="h-3 w-3 text-zinc-500" />
                      <span className="truncate">{cred.organizationName}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded border bg-zinc-800 text-zinc-300 border-zinc-700">
                    {cred.category.replace("_", " ")}
                  </span>
                </div>

                {/* Username & URL */}
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">Username</span>
                    <span className="font-mono text-zinc-200 font-medium">{cred.loginUsername}</span>
                  </div>
                  {cred.accessUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[11px]">Login URL</span>
                      <a
                        href={cred.accessUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                      >
                        <span className="truncate">{cred.accessUrl.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedAuditCredId(cred._id)}
                  className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 text-[11px]"
                  title="View Audit History"
                >
                  <History className="h-3.5 w-3.5" />
                  Audit Logs
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleReveal(cred._id)}
                    className="inline-flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Reveal Secret
                  </button>

                  <button
                    onClick={() => handleDelete(cred._id, cred.title)}
                    className="text-zinc-500 hover:text-rose-400 p-1.5 rounded transition-colors"
                    title="Delete Credential"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reveal Secret Modal */}
      {revealedCredId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                Decrypted Secret
              </h2>
              <button onClick={closeReveal} className="text-zinc-400 hover:text-zinc-200 text-sm">
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                This access has been logged in the audit trail for security compliance.
              </span>
            </div>

            {isRevealing ? (
              <div className="py-6 text-center text-xs text-zinc-400 animate-pulse">
                Decrypting with AES-256-GCM...
              </div>
            ) : (
              <div className="relative">
                <pre className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
                  {revealedSecretText}
                </pre>
                <button
                  onClick={copySecret}
                  className="absolute top-2.5 right-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 border border-zinc-700 transition-colors"
                >
                  {copiedSecret ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={closeReveal}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
              >
                Close &amp; Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {selectedAuditCredId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <History className="h-5 w-5 text-blue-400" />
                Access Audit Trail
              </h2>
              <button
                onClick={() => setSelectedAuditCredId(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditLogs === undefined ? (
                <div className="text-xs text-zinc-500 py-4 text-center">Loading audit logs...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-xs text-zinc-500 py-4 text-center">No audit history found.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-zinc-200 capitalize">
                        {log.action.replace("_", " ")}
                      </div>
                      <div className="text-[11px] text-zinc-500">{log.userName}</div>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedAuditCredId(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credential Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-400" />
                Store Encrypted Secret
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cPanel / MySQL"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="hosting">Hosting</option>
                    <option value="dns_registrar">DNS Registrar</option>
                    <option value="database">Database</option>
                    <option value="api_service">API Service</option>
                    <option value="email_admin">Email Admin</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Login Username / Email *
                </label>
                <input
                  type="text"
                  required
                  value={formData.loginUsername}
                  onChange={(e) => setFormData({ ...formData, loginUsername: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Secret / Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.plainSecret}
                  onChange={(e) => setFormData({ ...formData, plainSecret: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Access URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://cpanel.clientdomain.com"
                  value={formData.accessUrl}
                  onChange={(e) => setFormData({ ...formData, accessUrl: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {isSubmitting ? "Encrypting..." : "Encrypt & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
