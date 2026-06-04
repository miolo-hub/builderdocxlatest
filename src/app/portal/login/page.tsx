"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEMO_ACCOUNTS = [
  { email: "admin@prestige.demo", password: "admin123", role: "Admin" },
  { email: "sales@prestige.demo", password: "sales123", role: "Sales" },
  { email: "docs@prestige.demo", password: "docs123", role: "Document Manager" },
];

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("docs@prestige.demo");
  const [password, setPassword] = useState("docs123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid email or password");
      return;
    }
    router.push("/portal/dashboard");
  }

  function quickLogin(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-100 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-[var(--brand)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-white">
          BD
        </span>
        <span className="text-xl font-bold">BuilderDocs</span>
      </Link>

      <div className="card w-full max-w-md p-8">
        <h1 className="mb-1 text-2xl font-bold">Builder Portal</h1>
        <p className="mb-6 text-sm text-[var(--muted)]">Prestige Estates — sign in</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Email</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Password</span>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-xs font-medium text-[var(--muted)]">Demo accounts</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => quickLogin(a)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200"
              >
                {a.role}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Link href="/simulator" className="mt-6 text-sm text-teal-700 hover:underline">
        → Try WhatsApp simulator
      </Link>
    </div>
  );
}
