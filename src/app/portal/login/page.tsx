"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DemoAccount {
  email: string;
  name: string;
  role: string;
}

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [onVercel, setOnVercel] = useState(false);

  useEffect(() => {
    setOnVercel(window.location.hostname.includes("vercel.app"));
    void fetch("/api/auth/demo-accounts")
      .then((res) => res.json())
      .then((data) => {
        const accounts = (data.accounts ?? []) as DemoAccount[];
        setDemoAccounts(accounts);
        if (accounts.length > 0) {
          setEmail((prev) => prev || accounts[0].email);
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      router.push("/portal/dashboard");
    } catch {
      setError("Cannot reach server. Check deployment or run npm run dev.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-100 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-white">
          PT
        </span>
        <span className="text-xl font-bold text-[var(--brand)]">PropTrack CRM</span>
      </Link>
      <div className="card w-full max-w-md p-8">
        <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
        {onVercel && (
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Vercel: set DATABASE_URL + JWT_SECRET in env vars. Check{" "}
            <a href="/api/health" className="underline" target="_blank" rel="noreferrer">
              /api/health
            </a>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {demoAccounts.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-xs text-[var(--muted)]">
              Portal users from database (passwords from seed / README):
            </p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs"
                  onClick={() => setEmail(a.email)}
                  title={a.name}
                >
                  {a.role}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
