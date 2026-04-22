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
    <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-2 text-sm font-medium tracking-[0.3em] text-white/40 uppercase">
            CMDR · Group
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Command Overlay
          </h1>
          <p className="mt-2 text-sm text-white/50">
            The operational layer your business is missing.
          </p>
        </div>

        {sent ? (
          /* ─── Magic link sent confirmation ─── */
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <svg
                className="h-6 w-6 text-emerald-400"
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
            <h2 className="text-lg font-semibold text-white">Check your email</h2>
            <p className="mt-2 text-sm text-white/60">
              We sent a magic link to{" "}
              <span className="font-medium text-white/80">{email}</span>. Click
              it to sign in.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="mt-6 text-sm font-medium text-white/40 transition-colors hover:text-white/60"
            >
              Use a different email
            </button>
          </div>
        ) : (
          /* ─── Login form ─── */
          <form
            onSubmit={handleLogin}
            className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm"
          >
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-white/70"
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
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 focus:ring-1 focus:ring-white/20"
            />

            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="mt-4 w-full rounded-lg bg-[#E67E22] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#d35400] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>

            <p className="mt-4 text-center text-xs text-white/30">
              No password needed. We'll email you a secure link.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
