import { useState } from "react";
import { supabase } from "@/lib/supabase";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-10 text-center">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            ⬛ CMDR · Group
          </div>
          <h1 className="font-display text-4xl font-bold uppercase tracking-[0.08em] text-foreground">
            Command Overlay
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The operational layer your business is missing.
          </p>
        </div>

        {sent ? (
          /* ─── Magic link sent confirmation ─── */
          <div className="rounded-md border border-border bg-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md border border-primary/40 bg-secondary">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h2 className="font-display text-xl font-bold uppercase tracking-[0.06em] text-foreground">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a secure link to{" "}
              <span className="font-medium text-foreground">{email}</span>. Click
              it to sign in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ─── Login form ─── */
          <form
            onSubmit={handleLogin}
            className="rounded-md border border-border bg-card p-8"
          >
            <label
              htmlFor="email"
              className="mb-2 block font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary/60 focus:ring-1 focus:ring-primary/40"
            />

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-4 w-full rounded-md bg-primary px-4 py-3 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>

            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/70">
              No password needed — we'll email you a secure link
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
