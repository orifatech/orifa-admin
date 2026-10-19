"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@orifa/backend";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function AcceptInvitationPage() {
  const params = useParams();
  const token = (params?.token as string) || "";
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  const inviteStatus = useQuery(api.invitations.validate, token ? { token } : "skip");
  const acceptInvitation = useMutation(api.invitations.accept);

  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already logged in, one-click accept
  const handleAuthenticatedAccept = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await acceptInvitation({ token });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || "Failed to accept invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If new user, create account and accept
  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteStatus?.email) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const credentials: Record<string, string> = {
        email: inviteStatus.email,
        password,
      };
      if (name.trim()) {
        credentials.name = name.trim();
      }
      await signIn("password", {
        flow: "signUp",
        ...credentials,
      });

      await acceptInvitation({ token });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: unknown) {
      console.error("Invitation acceptance error:", err);
      const error = err as { message?: string };
      if (error.message?.includes("Account already exists") || error.message?.includes("already exists")) {
        setErrorMsg("An account with this email already exists. Please sign in first, then reload this invitation link.");
      } else {
        setErrorMsg(error.message || "Could not complete account setup. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (inviteStatus === undefined || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Verifying invitation security token...</p>
        </div>
      </div>
    );
  }

  if (!inviteStatus.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Invitation Expired or Invalid
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {inviteStatus.reason || "This invitation link is invalid, has expired, or has already been accepted. Contact your organization administrator to request a new invitation."}
          </p>
          <div className="pt-2">
            <Link
              href="/signin"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white transition-colors"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roleLabel =
    inviteStatus.role === "client_admin"
      ? "Client Administrator"
      : inviteStatus.role === "client_editor"
      ? "Client Content Editor"
      : inviteStatus.role;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 font-extrabold text-xl shadow-lg shadow-indigo-500/20 text-white">
            O
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Join {inviteStatus.organizationName}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You&apos;ve been invited to collaborate on the Orifa Client Portal.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Organization:
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {inviteStatus.organizationName}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Invited Email:
            </span>
            <span className="font-mono text-zinc-900 dark:text-zinc-100">
              {inviteStatus.email}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Assigned Role:
            </span>
            <span className="font-medium text-indigo-700 dark:text-indigo-300">
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="leading-snug">{errorMsg}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="font-medium">Invitation accepted! Redirecting to dashboard...</p>
            </div>
          )}

          {isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                You are currently signed in. Click below to accept the invitation and link your account to <span className="font-medium text-zinc-900 dark:text-zinc-200">{inviteStatus.organizationName}</span>.
              </p>
              <button
                onClick={handleAuthenticatedAccept}
                disabled={isSubmitting || success}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    Accept Invitation &amp; Join Workspace
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegisterAndAccept} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="email"
                    disabled
                    value={inviteStatus.email}
                    className="w-full pl-9 pr-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Set Secure Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || success}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm shadow-indigo-600/30 cursor-pointer pt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account &amp; accepting...
                  </>
                ) : (
                  <>
                    Create Account &amp; Accept Invitation
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Already have an account?{" "}
                  <Link href="/signin" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
