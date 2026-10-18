"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/projects");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: any = { email, password, flow };
      if (flow === "signUp") {
        payload.name = name || "Admin";
        payload.role = "super_admin";
      }

      await signIn("password", payload);
      router.push("/projects");
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 font-extrabold text-xl shadow-lg shadow-blue-500/20 text-white">
            O
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {flow === "signIn" ? "Sign in to Orifa Admin" : "Create Agency Account"}
          </h1>
          <p className="text-xs text-zinc-400">
            {flow === "signIn"
              ? "Access multi-tenant websites, Git pull requests, and agency operations"
              : "Register your master admin account powered by Convex Auth"}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-7 shadow-2xl backdrop-blur-sm space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {flow === "signUp" && (
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                />
                <Mail className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
                <Lock className="h-4 w-4 text-zinc-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-600/30"
            >
              <span>{isSubmitting ? "Authenticating..." : flow === "signIn" ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Toggle Flow */}
          <div className="pt-3 border-t border-zinc-800/80 text-center">
            <button
              type="button"
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
                setErrorMsg(null);
              }}
              className="text-xs text-zinc-400 hover:text-blue-400 transition-colors"
            >
              {flow === "signIn"
                ? "Need a new master account? Register here"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Security Footer Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
          <span>Encrypted sessions protected by Convex Auth</span>
        </div>
      </div>
    </div>
  );
}
