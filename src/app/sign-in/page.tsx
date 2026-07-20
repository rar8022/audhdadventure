"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignInCard() {
  const [loading, setLoading] = useState<"discord" | "guest" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const authFailed = searchParams.get("error") === "auth_failed";

  async function continueWithDiscord() {
    setLoading("discord");
    setError(null);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
    // On success the browser is redirected to Discord, so there's nothing
    // further to do here.
  }

  async function continueAsGuest() {
    setLoading("guest");
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(
        error.message +
          " (Anonymous sign-ins must be turned on in Supabase: Authentication -> Settings.)"
      );
      setLoading(null);
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <div className="mx-auto mt-10 max-w-md rounded-card border border-border bg-card p-6 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-ink">Welcome, traveler</h1>
      <p className="mt-2 text-sm text-muted">
        Sign in to start tracking your resources. Guest accounts are real —
        your data is saved — but they can&apos;t be recovered if you lose
        access to this browser, since nothing else identifies them.
      </p>

      {authFailed && (
        <p className="mt-3 rounded-lg bg-warn-bg p-2 text-sm text-warn">
          Sign-in didn&apos;t go through. Please try again.
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg bg-warn-bg p-2 text-sm text-warn">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={continueWithDiscord}
          disabled={loading !== null}
          className="rounded-lg bg-accent px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {loading === "discord" ? "Redirecting…" : "Continue with Discord"}
        </button>
        <button
          onClick={continueAsGuest}
          disabled={loading !== null}
          className="rounded-lg border border-border bg-card px-4 py-2.5 font-medium text-ink disabled:opacity-60"
        >
          {loading === "guest" ? "Setting up…" : "Continue as guest"}
        </button>
      </div>

      <p className="mt-5 text-xs text-muted">
        New here?{" "}
        <a href="/help" className="underline">
          See the Help &amp; tutorial
        </a>{" "}
        first.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInCard />
    </Suspense>
  );
}
