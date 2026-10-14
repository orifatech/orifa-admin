import Link from "next/link";
import {
  Globe,
  GitPullRequest,
  Clock,
  KeyRound,
  FileText,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            O
          </div>
          <span className="font-semibold text-zinc-100 tracking-tight text-sm">
            Orifa Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-600/30"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-16 text-center space-y-10 flex-1 flex flex-col justify-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/40 text-blue-400 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Multi-Tenant Agency Web Platform &bull; Built with Convex &amp; Next.js</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Client Visual CMS meets{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Git Pull Requests
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Empower your clients to make in-place visual edits on Astro, Next.js, and React websites without breaking your codebase. Automatically convert media to WebP, review side-by-side diffs, and deploy via GitHub Pull Requests.
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5"
          >
            <span>Go to Admin Portal</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-200 text-sm">Live Visual Editor</h2>
            <p className="text-xs text-zinc-400 leading-normal">
              Clients point and edit copy directly on the page. Drop images to automatically convert to optimized <code className="text-blue-400 font-mono">.webp</code>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-200 text-sm">GitHub PR Engine</h2>
            <p className="text-xs text-zinc-400 leading-normal">
              Never let unreviewed edits break production. Changes queue into a diff review and generate clean GitHub branches and Pull Requests.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-200 text-sm">Agency Operations Hub</h2>
            <p className="text-xs text-zinc-400 leading-normal">
              Track client domain expirations, Google/M365 workspace seats, monthly retainer MRR, and store credentials in an AES-256 encrypted vault.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Multi-tenant client data isolation &amp; Convex Auth protection</span>
        </div>
        <div>&copy; {new Date().getFullYear()} Orifa Technologies. All rights reserved.</div>
      </footer>
    </div>
  );
}
