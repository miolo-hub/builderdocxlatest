"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart,
  fmtCurrency,
  StackedBar,
  UnitStatusChart,
} from "@/components/portal/DashboardCharts";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import { PROJECT_STATUS_LABELS } from "@/lib/constants";
import type { UserRole } from "@/lib/rbac";

interface Metrics {
  projects: number;
  projectList: { id: string; name: string }[];
  units: {
    total: number;
    sold: number;
    reserved: number;
    available: number;
    blocked: number;
  };
  clients: number;
  dealsToday: number;
  revenue: { target: number; collected: number; pending: number };
  collectionPct: number;
  revenueByProject: {
    id: string;
    name: string;
    expectedRevenue: number;
    collected: number;
    yetToCollect: number;
    unitCounts: {
      total: number;
      available: number;
      reserved: number;
      sold: number;
      blocked: number;
    };
  }[];
  projectDetail: {
    id: string;
    name: string;
    expectedRevenue: number;
    collected: number;
    yetToCollect: number;
    unitCounts: {
      total: number;
      available: number;
      reserved: number;
      sold: number;
      blocked: number;
    };
    collectedBreakdown: {
      directPayments: number;
      bankLoan: number;
      bookingAdvance: number;
      total: number;
    };
  } | null;
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
    expectedRevenue: number;
    collected: number;
  }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    name: string;
    role: UserRole;
    builderName?: string;
  } | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [projectFilter, setProjectFilter] = useState("");

  const load = useCallback(async (project: string) => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const params = project ? `?project=${encodeURIComponent(project)}` : "";
    const dash = await fetch(`/api/dashboard${params}`);
    if (dash.ok) setMetrics((await dash.json()).metrics);
  }, [router]);

  useEffect(() => {
    void load(projectFilter);
  }, [load, projectFilter]);

  if (!user || !metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  const isAdmin = user.role === "super_admin";
  const detail = metrics.projectDetail;
  const showAllProjects = isAdmin && !projectFilter;
  function revenueHref(
    type: "expected" | "collected" | "pending",
    projectId?: string
  ) {
    const pid = projectId ?? projectFilter;
    const q = pid ? `&project=${encodeURIComponent(pid)}` : "";
    return `/portal/dashboard/revenue?type=${type}${q}`;
  }

  function RevenueCard({
    label,
    amount,
    type,
    amountClassName,
    compact,
  }: {
    label: string;
    amount: string;
    type: "expected" | "collected" | "pending";
    amountClassName: string;
    compact?: boolean;
  }) {
    return (
      <Link
        href={revenueHref(type)}
        className={`card block transition-colors hover:border-teal-400 hover:bg-teal-50/30 ${compact ? "p-4" : "p-5"}`}
      >
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${amountClassName}`}>{amount}</p>
        <p className="mt-2 text-xs font-medium text-teal-700">
          View client breakdown →
        </p>
      </Link>
    );
  }

  return (
    <VikrayaShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Management Dashboard</h1>
        {isAdmin && (
          <select
            className="input max-w-xs"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="">All projects — revenue split</option>
            {metrics.projectList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isAdmin && detail && (
        <>
          <h2 className="mb-4 text-lg font-semibold">{detail.name} — Revenue</h2>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <RevenueCard
              label="Expected revenue (sold flats)"
              amount={fmtCurrency(detail.expectedRevenue)}
              type="expected"
              amountClassName="text-[var(--brand)]"
            />
            <RevenueCard
              label="Collected so far"
              amount={fmtCurrency(detail.collected)}
              type="collected"
              amountClassName="text-green-700"
            />
            <RevenueCard
              label="Yet to collect"
              amount={fmtCurrency(detail.yetToCollect)}
              type="pending"
              amountClassName="text-amber-700"
            />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 font-semibold">Collection breakdown</h3>
              <StackedBar
                total={detail.collectedBreakdown.total}
                segments={[
                  {
                    label: "Direct payments",
                    value: detail.collectedBreakdown.directPayments,
                    color: "#0d9488",
                  },
                  {
                    label: "Booking advance",
                    value: detail.collectedBreakdown.bookingAdvance,
                    color: "#0891b2",
                  },
                  {
                    label: "Bank loan disbursed",
                    value: detail.collectedBreakdown.bankLoan,
                    color: "#6366f1",
                  },
                ]}
              />
            </div>
            <div className="card p-5">
              <h3 className="mb-4 font-semibold">Revenue vs collection</h3>
              <BarChart
                items={[
                  {
                    label: "Expected (sold)",
                    value: detail.expectedRevenue,
                    color: "#94a3b8",
                  },
                  {
                    label: "Collected",
                    value: detail.collected,
                    color: "#0d9488",
                  },
                  {
                    label: "Yet to collect",
                    value: detail.yetToCollect,
                    color: "#f59e0b",
                  },
                ]}
              />
            </div>
          </div>

          <div className="card mb-8 p-5">
            <h3 className="mb-4 font-semibold">Inventory by status</h3>
            <UnitStatusChart counts={detail.unitCounts} />
          </div>
        </>
      )}

      {showAllProjects && (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RevenueCard
              label="Expected revenue (all sold)"
              amount={fmtCurrency(metrics.revenue.target)}
              type="expected"
              amountClassName="text-[var(--brand)]"
              compact
            />
            <RevenueCard
              label="Collected"
              amount={fmtCurrency(metrics.revenue.collected)}
              type="collected"
              amountClassName="text-green-700"
              compact
            />
            <RevenueCard
              label="Yet to collect"
              amount={fmtCurrency(metrics.revenue.pending)}
              type="pending"
              amountClassName="text-amber-700"
              compact
            />
            <div className="card p-4">
              <p className="text-sm text-[var(--muted)]">Collection rate</p>
              <p className="mt-1 text-2xl font-bold text-[var(--brand)]">
                {metrics.collectionPct}%
              </p>
            </div>
          </div>

          <div className="card mb-8 p-5">
            <h3 className="mb-4 font-semibold">Revenue split by project</h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Select a project above for detailed breakdown, collection split, and inventory chart.
            </p>
            <BarChart
              items={metrics.revenueByProject.map((p, i) => ({
                label: p.name,
                value: p.expectedRevenue,
                color: ["#0d9488", "#0891b2", "#6366f1", "#8b5cf6", "#ec4899"][i % 5],
              }))}
            />
          </div>

          <div className="card mb-8 overflow-x-auto p-5">
            <h3 className="mb-4 font-semibold">Project revenue summary</h3>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-[var(--muted)]">
                  <th className="pb-2 pr-4">Project</th>
                  <th className="pb-2 pr-4">Expected</th>
                  <th className="pb-2 pr-4">Collected</th>
                  <th className="pb-2 pr-4">Pending</th>
                  <th className="pb-2">Sold units</th>
                </tr>
              </thead>
              <tbody>
                {metrics.revenueByProject.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        className="font-medium text-teal-700 hover:underline"
                        onClick={() => setProjectFilter(p.id)}
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={revenueHref("expected", p.id)}
                        className="text-teal-700 hover:underline"
                      >
                        {fmtCurrency(p.expectedRevenue)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={revenueHref("collected", p.id)}
                        className="text-teal-700 hover:underline"
                      >
                        {fmtCurrency(p.collected)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={revenueHref("pending", p.id)}
                        className="text-amber-700 hover:underline"
                      >
                        {fmtCurrency(p.yetToCollect)}
                      </Link>
                    </td>
                    <td className="py-2">
                      {p.unitCounts.sold}/{p.unitCounts.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isAdmin && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Units sold", value: `${metrics.units.sold}/${metrics.units.total}` },
            { label: "Available", value: metrics.units.available },
            { label: "Collected", value: fmtCurrency(metrics.revenue.collected) },
            { label: "Pending", value: fmtCurrency(metrics.revenue.pending) },
          ].map((c) => (
            <div key={c.label} className="card p-4">
              <p className="text-sm text-[var(--muted)]">{c.label}</p>
              <p className="text-2xl font-bold text-[var(--brand)]">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Projects</h2>
        {isAdmin && (
          <Link href="/portal/projects" className="text-sm text-teal-700 hover:underline">
            Manage inventory →
          </Link>
        )}
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {metrics.projectCards.map((p) => {
          const hideConstruction = p.status === "completed" || p.status === "handover";
          return (
            <Link
              key={p.id}
              href={`/portal/projects/${p.id}`}
              className="card block p-5 hover:border-teal-300"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="badge badge-customer">
                  {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {p.sold}/{p.totalUnits} sold ({p.soldPct}%) · Expected{" "}
                {fmtCurrency(p.expectedRevenue)}
              </p>
              {!hideConstruction && (
                <>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Construction {p.constructionPct}%
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-teal-600"
                      style={{ width: `${p.constructionPct}%` }}
                    />
                  </div>
                </>
              )}
            </Link>
          );
        })}
      </div>

      {!isAdmin && (
        <>
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
    </VikrayaShell>
  );
}
