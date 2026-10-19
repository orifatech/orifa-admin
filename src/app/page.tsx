import Link from "next/link";
import { Globe, GitPullRequest, KeyRound, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between transition-colors">
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 py-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
        <header className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 2xl:px-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              O
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-lg">
              Orifa Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/signin"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-sm px-3 py-1.5 transition-colors"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-blue-700 dark:text-blue-400">
            Agency Visual CMS & Operations
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-3xl mx-auto leading-tight">
            Client Web Portal Management Platform
          </h1>
          <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Unified control center for agency websites, in-place visual content editing, automated Git pipelines, and infrastructure monitors.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs dark:shadow-none space-y-3 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Globe className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
              Live Visual Editor
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
              Edit website copy directly, change images and button labels on any page on your website.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs dark:shadow-none space-y-3 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
              Automated GitHub Pipeline
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
              Realtime changes generate PRs or merge to production branches instantly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 shadow-xs dark:shadow-none space-y-3 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-200 text-sm">
              Manage Domains & Credentials
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-normal">
              Manage domain expirations, monthly retainer MRR, and store encrypted credentials.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-4 flex md:justify-center text-xs text-zinc-500 gap-2 bg-white/40 dark:bg-transparent">
        <div>
          &copy; {new Date().getFullYear()} Orifa Technologies. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
