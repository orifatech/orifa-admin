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
      <div className="flex min-h-screen bg-[#f8f9fa] text-gray-900 transition-colors">
        <Suspense fallback={<aside className="w-[224px] bg-white border-r border-gray-200/80 shrink-0 h-screen sticky top-0" />}>
          <Sidebar />
        </Suspense>
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Suspense fallback={<div className="p-8 text-gray-500 text-sm">Loading workspace...</div>}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
