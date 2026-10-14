import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Suspense fallback={<aside className="w-64 bg-zinc-900/50 border-r border-zinc-800" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Suspense fallback={<div className="p-8 text-zinc-400">Loading...</div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}
