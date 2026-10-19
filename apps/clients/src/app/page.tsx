"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useConvexAuth } from "convex/react";

export default function ClientLandingPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* Minimal Header */}
      <header className="h-16 px-6 sm:px-12 flex items-center justify-between border-b border-gray-200/80 bg-white">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/orifa-logo.png"
            alt="Orifa Technologies"
            width={140}
            height={40}
            priority
            className="h-8 w-auto object-contain"
          />
        </Link>
        <div>
          {!isLoading && (
            <Link
              href={isAuthenticated ? "/dashboard" : "/signin"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-emerald-700 bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-lg transition-colors"
            >
              <span>{isAuthenticated ? "Dashboard" : "Sign In"}</span>
              <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          )}
        </div>
      </header>

      {/* Minimal Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center max-w-xl mx-auto py-16">
        <div className="w-full bg-white border border-gray-200/80 rounded-2xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <Image
                src="/icon.png"
                alt="Orifa"
                width={48}
                height={48}
                priority
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Client Experience Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Monitor, Edit & Manage
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              Track domain & email expirations, edit website content in-place, and manage maintenance contracts.
            </p>
          </div>

          <div className="pt-2">
            {!isLoading && (
              <Link
                href={isAuthenticated ? "/dashboard" : "/signin"}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs hover:shadow-sm transition-all"
              >
                <span>{isAuthenticated ? "Open Dashboard" : "Sign In to Client Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="h-14 px-6 flex items-center justify-center text-[11px] text-gray-400 border-t border-gray-200/80 bg-white">
        &copy; {new Date().getFullYear()} Orifa Technologies. All rights reserved.
      </footer>
    </div>
  );
}
