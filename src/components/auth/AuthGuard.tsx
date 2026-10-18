"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { Loader2, ShieldCheck } from "lucide-react";

export function DashboardAuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  // While checking authentication state, render loading indicator
  // and prevent child components and their queries from executing.
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-500/20 text-white animate-pulse">
            O
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show redirecting state while Next.js routes to /signin
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <ShieldCheck className="h-8 w-8 text-blue-500 animate-pulse" />
          <p className="text-sm text-zinc-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
