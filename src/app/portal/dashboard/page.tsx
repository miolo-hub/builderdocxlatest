"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { UserRole } from "@/lib/rbac";

interface Metrics {
  projects: number;
  units: { total: number; sold: number; reserved: number; available: number };
  clients: number;
  dealsToday: number;
  revenue: { target: number; collected: number; pending: number };
  payments: {
    todayCollections: number;
    dueThisWeek: number;
    overdueCount: number;
    overdueAmount: number;
  };
  leaderboard: { name: string; deals: number }[];
  projectCards: {
    id: string;
    name: string;
    status: string;
    constructionPct: number;
    soldPct: number;
    totalUnits: number;
    sold: number;
  }[];
}

function fmt(n: number) {
  return `₹${(n / 100000).toFixed(1)}L`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    role: UserRole;
    builderName?: string;
  } | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const dash = await fetch("/api/dashboard");
    if (dash.ok) setMetrics((await dash.json()).metrics);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  const isAdmin = user.role === "super_admin";

  return (
    <PropTrackShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Management Dashboard</h1>

      {metrics && isAdmin && (
        <Link
          href="/portal/projects"
          className="card mb-8 block p-8 transition hover:border-teal-400 hover:shadow-md"
        >
          <p className="text-sm font-medium text-[var(--muted)]">Projects & inventory</p>
          <p className="mt-2 text-5xl font-bold text-[var(--brand)]">{metrics.projects}</p>
          <p className="mt-2 text-sm text-teal-700">View all projects →</p>
        </Link>
      )}

      {metrics && !isAdmin && (
        <>
          {metrics.payments.overdueCount > 0 && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900">
              ⚠️ {metrics.payments.overdueCount} overdue installments —{" "}
              {fmt(metrics.payments.overdueAmount)} outstanding
            </div>
          )}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Units sold", value: `${metrics.units.sold}/${metrics.units.total}` },
              { label: "Available", value: metrics.units.available },
              { label: "Collected", value: fmt(metrics.revenue.collected) },
              { label: "Pending", value: fmt(metrics.revenue.pending) },
            ].map((c) => (
              <div key={c.label} className="card p-4">
                <p className="text-sm text-[var(--muted)]">{c.label}</p>
                <p className="text-2xl font-bold text-[var(--brand)]">{c.value}</p>
              </div>
            ))}
          </div>

          <h2 className="mb-4 font-semibold">Projects</h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {metrics.projectCards.map((p) => (
              <Link
                key={p.id}
                href={`/portal/projects/${p.id}`}
                className="card block p-5 hover:border-teal-300"
              >
                <div className="flex justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="badge badge-customer">{p.status}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {p.sold}/{p.totalUnits} sold ({p.soldPct}%) · Construction {p.constructionPct}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-600"
                    style={{ width: `${p.constructionPct}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>

          <h2 className="mb-4 font-semibold">Agent leaderboard</h2>
          <div className="card divide-y">
            {metrics.leaderboard.map((a, i) => (
              <div key={a.name} className="flex justify-between px-4 py-3 text-sm">
                <span>
                  {i + 1}. {a.name}
                </span>
                <span className="font-medium">{a.deals} deals</span>
              </div>
            ))}
          </div>
        </>
      )}
    </PropTrackShell>
  );
}
