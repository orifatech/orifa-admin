import Link from "next/link";
import { Globe, GitPullRequest, KeyRound, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      <div className=" border-b border-zinc-800/80 py-4">
        <header className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 2xl:px-0 flex items-center justify-between">
          <div className="">
            <span className="font-semibold text-zinc-100 tracking-tight text-lg">
              Orifa Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-zinc-400 hover:text-zinc-200 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-blue-600/30"
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
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Client Web Portal Management Platform
          </h1>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-200 text-sm">
              Live Visual Editor
            </h2>
            <p className="text-sm text-zinc-400 leading-normal">
              Edit website copy directly, change images and button labels on any
              page on your website.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-200 text-sm">
              Automated GitHub Pipeline
            </h2>
            <p className="text-sm text-zinc-400 leading-normal">
              Realtime changes generate PRs or merge to production instantly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-200 text-sm">
              Manage Domains & Credentials
            </h2>
            <p className="text-sm text-zinc-400 leading-normal">
              Manage domains expirations, monthly retainer MRR, and store
              credentials.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 px-6 py-4 flex md:justify-center text-xs text-zinc-500 gap-2">
        <div>
          &copy; {new Date().getFullYear()} Orifa Technologies. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}
