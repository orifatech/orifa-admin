import Link from "next/link";
import Image from "next/image";
import { Globe, GitPullRequest, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 flex flex-col justify-between transition-colors font-sans">
      <div className="border-b border-gray-200/80 bg-white">
        <header className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 2xl:px-0 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/images/orifa-logo.png"
              alt="Orifa Technologies"
              width={140}
              height={40}
              priority
              className="h-8 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/signin"
              className="text-gray-600 hover:text-gray-900 text-xs font-semibold px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12 2xl:px-0 py-16 text-center space-y-10 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Agency Operations &amp; Client CMS Control Center</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 max-w-3xl mx-auto leading-tight">
            Client Web Platform &amp; Monitoring Hub
          </h1>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Unified administrative portal for client websites, domain and email monitoring, in-place visual content editing, and retainer subscriptions.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 text-left">
          <div className="p-6 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-3 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">
              Visual Editor &amp; Script Injection
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Clients edit website copy, buttons, and media directly with real-time postMessage preview and Git pull request automation.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-3 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">
              Automated Git Workflows
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Client edits generate staging pull requests or merge directly into production branches depending on contract tier.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-gray-200/80 shadow-xs space-y-3 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="font-bold text-gray-900 text-sm">
              Domain &amp; Credential Vault
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Automated WHOIS domain expiration alerts, email license tracking, and encrypted credential storage.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 px-6 py-4 flex md:justify-center text-xs text-gray-400 bg-white">
        <div>
          &copy; {new Date().getFullYear()} Orifa Technologies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
