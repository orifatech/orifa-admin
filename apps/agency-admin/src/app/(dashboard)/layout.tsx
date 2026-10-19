import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardAuthGuard } from "@/components/auth/AuthGuard";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuthGuard>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        <Suspense fallback={<aside className="w-64 bg-white dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-8 text-zinc-500 dark:text-zinc-400 text-sm">Loading workspace...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
