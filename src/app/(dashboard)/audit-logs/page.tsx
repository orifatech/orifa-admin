"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Clock,
  User,
  Building2,
  Filter,
} from "lucide-react";

interface AuditLogEntry {
  _id: Id<"auditLogs">;
  tenantId: Id<"organizations">;
  organizationName: string;
  actorId: Id<"users">;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  severity: "info" | "warning" | "critical";
  details?: Record<string, any>;
  timestamp: number;
}

export default function AuditLogsPage() {
  const viewer = useQuery(api.users.viewer);
  const organizations = useQuery(api.organizations.list);

  const [selectedOrgId, setSelectedOrgId] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const orgArg =
    selectedOrgId !== "all" ? (selectedOrgId as Id<"organizations">) : undefined;

  const logs = useQuery(api.auditLogs.list, {
    tenantId: orgArg,
    limit: 100,
  }) as AuditLogEntry[] | undefined;

  const isSuperAdmin = viewer?.role === "super_admin";

  const filteredLogs = logs?.filter((log: AuditLogEntry) => {
    if (severityFilter !== "all" && log.severity !== severityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Audit &amp; Security Logs
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Tamper-evident, tenant-isolated activity trail for OWASP security governance and incident auditing.
          </p>
        </div>

        {/* Severity filter pills */}
        <div className="flex items-center gap-2">
          {["all", "critical", "warning", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                severityFilter === sev
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Organization selector for Super Admin */}
      {isSuperAdmin && organizations && organizations.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs">
          <Filter className="h-4 w-4 text-zinc-400" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Tenant Filter:</span>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Tenant Workspaces</option>
            {organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Logs Table / List */}
      {filteredLogs === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20 p-8">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-200">
            No audit events found
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mt-1">
            Security and tenant operations will be immutably recorded here as actions take place.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredLogs.map((log) => {
            const isCritical = log.severity === "critical";
            const isWarning = log.severity === "warning";

            return (
              <div
                key={log._id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40 ${
                  isCritical ? "bg-red-50/40 dark:bg-red-950/20" : ""
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {isCritical ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    ) : (
                      <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {log.action.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-md border ${
                          isCritical
                            ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900"
                            : isWarning
                            ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900"
                        }`}
                      >
                        {log.severity}
                      </span>
                      {log.organizationName && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          <Building2 className="h-3 w-3" />
                          {log.organizationName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px] flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.actorName}
                      </span>
                      <span>•</span>
                      <span>Resource: {log.resourceType}</span>
                      {log.resourceId && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{log.resourceId}</span>
                        </>
                      )}
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="pt-1">
                        <pre className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-w-xl">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right sm:self-start">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
