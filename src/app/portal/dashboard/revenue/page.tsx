"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { fmtCurrency } from "@/components/portal/DashboardCharts";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { ClientRevenueSplit } from "@/lib/dashboard";
import type { UserRole } from "@/lib/rbac";

type RevenueType = "expected" | "collected" | "pending";

const TITLES: Record<RevenueType, string> = {
  expected: "Expected revenue by client",
  collected: "Collected revenue by client",
  pending: "Yet to collect by client",
};

function DashboardRevenueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") as RevenueType) || "expected";
  const projectId = searchParams.get("project") ?? "";

  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(
    null
  );
  const [rows, setRows] = useState<ClientRevenueSplit[]>([]);
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);

    const params = projectId ? `?project=${encodeURIComponent(projectId)}` : "";
    const res = await fetch(`/api/dashboard${params}`);
    if (res.ok) {
      const { metrics } = await res.json();
      const list = projectId
        ? (metrics.projectDetail?.clientRevenue ?? [])
        : (metrics.clientRevenue ?? []);
      setRows(list);
      setProjectName(metrics.projectDetail?.name ?? "");
    }
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows;
    if (type === "expected") list = list.filter((r) => r.expected > 0);
    else if (type === "collected") list = list.filter((r) => r.collected > 0);
    else list = list.filter((r) => r.pending > 0);

    if (!q) return list;
    return list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.unit.toLowerCase().includes(q) ||
        r.clientId.toLowerCase().includes(q)
    );
  }, [rows, search, type]);

  const total = useMemo(() => {
    if (type === "expected") return filtered.reduce((s, r) => s + r.expected, 0);
    if (type === "collected") return filtered.reduce((s, r) => s + r.collected, 0);
    return filtered.reduce((s, r) => s + r.pending, 0);
  }, [filtered, type]);

  if (!user) return null;

  const backHref = projectId ? `/portal/dashboard?project=${projectId}` : "/portal/dashboard";

  return (
    <PropTrackShell user={user}>
      <Link href={backHref} className="mb-4 inline-block text-sm text-teal-700 hover:underline">
        ← Dashboard
      </Link>

      <h1 className="text-2xl font-bold">
        {projectName ? `${projectName} — ` : ""}
        {TITLES[type] ?? "Revenue by client"}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {type === "expected" && "Final deal prices and sold-unit values per client."}
        {type === "collected" && "Direct payments, booking advance, and bank loan per client."}
        {type === "pending" && "Expected minus collected — balance still due per client."}
      </p>

      <div className="my-6 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-md flex-1"
          placeholder="Search by client name or unit…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 text-sm">
          {(["expected", "collected", "pending"] as RevenueType[]).map((t) => (
            <Link
              key={t}
              href={`/portal/dashboard/revenue?type=${t}${projectId ? `&project=${projectId}` : ""}`}
              className={`rounded-full px-3 py-1 ${
                type === t
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {t === "expected" ? "Expected" : t === "collected" ? "Collected" : "Pending"}
            </Link>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-[var(--muted)]">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-[var(--muted)]">No matching clients.</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[var(--muted)]">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Unit</th>
                {type === "expected" && <th className="px-4 py-3 text-right">Expected</th>}
                {type === "collected" && (
                  <>
                    <th className="px-4 py-3 text-right">Direct</th>
                    <th className="px-4 py-3 text-right">Advance</th>
                    <th className="px-4 py-3 text-right">Bank loan</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </>
                )}
                {type === "pending" && (
                  <>
                    <th className="px-4 py-3 text-right">Expected</th>
                    <th className="px-4 py-3 text-right">Collected</th>
                    <th className="px-4 py-3 text-right">Pending</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.clientId} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/portal/clients/${r.clientId}`}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{r.unit}</td>
                  {type === "expected" && (
                    <td className="px-4 py-3 text-right font-medium">
                      {fmtCurrency(r.expected)}
                    </td>
                  )}
                  {type === "collected" && (
                    <>
                      <td className="px-4 py-3 text-right">{fmtCurrency(r.direct)}</td>
                      <td className="px-4 py-3 text-right">{fmtCurrency(r.advance)}</td>
                      <td className="px-4 py-3 text-right">{fmtCurrency(r.bankLoan)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {fmtCurrency(r.collected)}
                      </td>
                    </>
                  )}
                  {type === "pending" && (
                    <>
                      <td className="px-4 py-3 text-right">{fmtCurrency(r.expected)}</td>
                      <td className="px-4 py-3 text-right">{fmtCurrency(r.collected)}</td>
                      <td className="px-4 py-3 text-right font-medium text-amber-700">
                        {fmtCurrency(r.pending)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-semibold">
                <td className="px-4 py-3" colSpan={2}>
                  Total ({filtered.length} clients)
                </td>
                {type === "expected" && (
                  <td className="px-4 py-3 text-right">{fmtCurrency(total)}</td>
                )}
                {type === "collected" && (
                  <>
                    <td colSpan={3} />
                    <td className="px-4 py-3 text-right">{fmtCurrency(total)}</td>
                  </>
                )}
                {type === "pending" && (
                  <>
                    <td colSpan={2} />
                    <td className="px-4 py-3 text-right text-amber-700">{fmtCurrency(total)}</td>
                  </>
                )}
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </PropTrackShell>
  );
}

export default function DashboardRevenuePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          Loading…
        </div>
      }
    >
      <DashboardRevenueContent />
    </Suspense>
  );
}
