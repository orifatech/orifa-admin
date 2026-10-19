"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@orifa/backend";
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Search,
  Server,
  Globe,
  Mail,
  Database,
  Cpu,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";

type CredentialCategory =
  | "all"
  | "hosting"
  | "dns_registrar"
  | "database"
  | "api_service"
  | "email_admin"
  | "other";

const CATEGORY_META: Record<
  Exclude<CredentialCategory, "all">,
  { label: string; icon: React.ElementType; color: string }
> = {
  dns_registrar: {
    label: "DNS & Registrar",
    icon: Globe,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  hosting: {
    label: "Hosting & Server",
    icon: Server,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  email_admin: {
    label: "Email Admin",
    icon: Mail,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  database: {
    label: "Database",
    icon: Database,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  api_service: {
    label: "API Service",
    icon: Cpu,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  other: {
    label: "Other Key",
    icon: KeyRound,
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

export default function ClientVaultPage() {
  const viewer = useQuery(api.users.viewer);
  const orgId = viewer?.organizationId;
  const organization = viewer?.organization;
  const credentials = useQuery(api.vault.list, orgId ? { organizationId: orgId } : {}) || [];

  const revealSecretMutation = useMutation(api.vault.revealSecret);
  const addCredentialMutation = useMutation(api.vault.addCredential);

  const [selectedCategory, setSelectedCategory] = useState<CredentialCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reveal secret state tracking per credential ID
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [isRevealing, setIsRevealing] = useState<Record<string, boolean>>({});

  // Add Credential Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    category: "hosting" as Exclude<CredentialCategory, "all">,
    loginUsername: "",
    plainSecret: "",
    accessUrl: "",
    notes: "",
  });

  const primaryColor = organization?.primaryColor || "#006e2b";

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRevealSecret = async (credentialId: any) => {
    // If already revealed, toggle off
    if (revealedSecrets[credentialId]) {
      setRevealedSecrets((prev) => {
        const next = { ...prev };
        delete next[credentialId];
        return next;
      });
      return;
    }

    setIsRevealing((prev) => ({ ...prev, [credentialId]: true }));
    try {
      const plaintext = await revealSecretMutation({ credentialId });
      setRevealedSecrets((prev) => ({
        ...prev,
        [credentialId]: plaintext,
      }));

      // Automatically hide password after 45 seconds for security
      setTimeout(() => {
        setRevealedSecrets((prev) => {
          const next = { ...prev };
          delete next[credentialId];
          return next;
        });
      }, 45000);
    } catch (err: any) {
      alert(err.message || "Failed to decrypt password.");
    } finally {
      setIsRevealing((prev) => ({ ...prev, [credentialId]: false }));
    }
  };

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    setIsSubmitting(true);
    try {
      await addCredentialMutation({
        organizationId: orgId,
        title: addForm.title,
        category: addForm.category,
        loginUsername: addForm.loginUsername,
        plainSecret: addForm.plainSecret,
        accessUrl: addForm.accessUrl || undefined,
        notes: addForm.notes || undefined,
      });

      setIsAddModalOpen(false);
      setAddForm({
        title: "",
        category: "hosting",
        loginUsername: "",
        plainSecret: "",
        accessUrl: "",
        notes: "",
      });
    } catch (err: any) {
      alert(err.message || "Could not save credential.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCredentials = credentials.filter((c: any) => {
    const matchesCategory =
      selectedCategory === "all" || c.category === selectedCategory;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.loginUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.accessUrl && c.accessUrl.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Security Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900">
                Shared Secure Vault
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Lock className="w-2.5 h-2.5" />
                AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Encrypted credentials shared between your team and Orifa Technologies engineers.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-opacity cursor-pointer shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Credential</span>
        </button>
      </div>

      {/* Security Audit Log Notice */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-amber-900 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="leading-relaxed">
          <strong className="font-semibold">Security Policy:</strong> Every secret reveal event is cryptographically audited with your account ID, timestamp, and device fingerprint.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80 hover:bg-gray-50"
            }`}
          >
            All Items ({credentials.length})
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = credentials.filter((c: any) => c.category === key).length;
            const isSelected = selectedCategory === key;
            const IconComponent = meta.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as CredentialCategory)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80 hover:bg-gray-50"
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span>{meta.label}</span>
                {count > 0 && (
                  <span
                    className={`ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logins or URLs..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200/80 bg-white text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Credentials Grid */}
      {filteredCredentials.length === 0 ? (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mt-3">
            No credentials found
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "No vault items match your query. Try clearing the search."
              : "No shared credentials are saved for this organization yet. Click 'Add Credential' to store your first login."}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Initial Item</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCredentials.map((cred: any) => {
            const meta =
              CATEGORY_META[cred.category as Exclude<CredentialCategory, "all">] ||
              CATEGORY_META.other;
            const CategoryIcon = meta.icon;
            const isRevealed = Boolean(revealedSecrets[cred._id]);
            const plaintext = revealedSecrets[cred._id];
            const loading = Boolean(isRevealing[cred._id]);

            return (
              <div
                key={cred._id}
                className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: `${primaryColor}10`,
                          borderColor: `${primaryColor}25`,
                          color: primaryColor,
                        }}
                      >
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 line-clamp-1">
                          {cred.title}
                        </h3>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border mt-0.5 ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    {cred.accessUrl && (
                      <a
                        href={cred.accessUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-50 transition-colors"
                        title="Open Login URL"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Username / Identifier */}
                  <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-2.5">
                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                      Username / Email
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs font-mono font-medium text-gray-800 truncate">
                        {cred.loginUsername}
                      </span>
                      <button
                        onClick={() => handleCopy(cred.loginUsername, `user-${cred._id}`)}
                        className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors cursor-pointer"
                        title="Copy username"
                      >
                        {copiedField === `user-${cred._id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Secret Password / Key Area */}
                  <div className="bg-gray-50/70 border border-gray-200/60 rounded-xl p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                        Password / Secret
                      </span>
                      {isRevealed && (
                        <span className="text-[10px] text-amber-600 font-medium animate-pulse">
                          Auto-hiding in 45s
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-xs font-mono font-medium text-gray-800 truncate">
                        {isRevealed ? plaintext : "••••••••••••••••"}
                      </span>

                      <div className="flex items-center gap-1">
                        {isRevealed && plaintext && (
                          <button
                            onClick={() => handleCopy(plaintext, `pass-${cred._id}`)}
                            className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedField === `pass-${cred._id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleRevealSecret(cred._id)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-gray-700 hover:text-gray-900 bg-white border border-gray-200/90 shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                          ) : isRevealed ? (
                            <>
                              <EyeOff className="w-3 h-3 text-gray-500" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 text-gray-500" />
                              <span>Reveal</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes if available */}
                  {cred.notes && (
                    <p className="text-[11px] text-gray-500 italic bg-white px-2 py-1 rounded border border-gray-100 line-clamp-2">
                      &quot;{cred.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Card Footer: Metadata */}
                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                  <span>AES-256 encrypted</span>
                  <span>
                    Updated {new Date(cred.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Credential Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `${primaryColor}15`,
                    color: primaryColor,
                  }}
                >
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Add Secure Credential
                  </h2>
                  <p className="text-[11px] text-gray-500">
                    Will be encrypted using the vault master key.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. AWS Production Console or Namecheap"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={addForm.category}
                  onChange={(e) =>
                    setAddForm((prev) => ({
                      ...prev,
                      category: e.target.value as Exclude<CredentialCategory, "all">,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                >
                  <option value="dns_registrar">DNS & Domain Registrar (Namecheap, GoDaddy)</option>
                  <option value="hosting">Web Hosting & Server (Vercel, AWS, Hetzner)</option>
                  <option value="email_admin">Email Admin (Google Workspace, M365)</option>
                  <option value="database">Database & Cloud Storage</option>
                  <option value="api_service">API Key & Webhook Secret</option>
                  <option value="other">Other Service</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Username / Login Email *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.loginUsername}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, loginUsername: e.target.value }))
                  }
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password / Secret Key *
                </label>
                <input
                  type="password"
                  required
                  value={addForm.plainSecret}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, plainSecret: e.target.value }))
                  }
                  placeholder="Enter secret to encrypt"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Access URL (Optional)
                </label>
                <input
                  type="url"
                  value={addForm.accessUrl}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, accessUrl: e.target.value }))
                  }
                  placeholder="https://dash.domain.com/login"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="e.g. 2FA is set to the primary executive phone"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>Encrypt & Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
