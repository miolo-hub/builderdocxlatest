"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import type { UserRole } from "@/lib/rbac";

type DealLoan = {
  expected: number;
  received: number;
  disbursedPercent: number;
  remainingPercent: number;
  isComplete: boolean;
};

type DealRow = {
  id: string;
  finalPrice: number;
  paymentStatus: string;
  client: { name: string };
  unit: { unitNumber: string; project: { name: string } };
  agent: { name: string } | null;
  loan: DealLoan | null;
};

export default function DealsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [projectFilter, setProjectFilter] = useState("");
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);
  const [deals, setDeals] = useState<DealRow[]>([]);

  const loadDeals = useCallback(async (project: string) => {
    const params = new URLSearchParams();
    if (project) params.set("project", project);
    const res = await fetch(`/api/deals?${params}`);
    if (res.ok) setDeals((await res.json()).deals);
  }, []);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        void fetch("/api/projects").then(async (res) => {
          if (res.ok) setProjectOptions((await res.json()).projects);
        });
        void loadDeals("");
      }
    })();
  }, [router, loadDeals]);

  useEffect(() => {
    void loadDeals(projectFilter);
  }, [projectFilter, loadDeals]);

  if (!user) return null;

  return (
    <VikrayaShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Deals</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          className="input max-w-[240px]"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="">All projects</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        {projectFilter && (
          <button
            type="button"
            className="btn-secondary text-sm"
            onClick={() => setProjectFilter("")}
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Loan pending</th>
              <th className="px-4 py-3">Agent</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--muted)]">
                  {projectFilter
                    ? `No deals for project “${projectFilter}”.`
                    : "No deals yet. Book a flat from a client profile to create one."}
                </td>
              </tr>
            ) : (
              deals.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3">{d.client.name}</td>
                  <td className="px-4 py-3">{d.unit.unitNumber}</td>
                  <td className="px-4 py-3">{d.unit.project.name}</td>
                  <td className="px-4 py-3">₹{d.finalPrice.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 capitalize">{d.paymentStatus.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3">
                    {d.loan ? (
                      d.loan.isComplete ? (
                        <span className="text-emerald-700">Loan fully disbursed</span>
                      ) : (
                        <span className="text-amber-800">
                          {d.loan.remainingPercent}% remaining
                          <span className="block text-xs text-[var(--muted)]">
                            ₹{d.loan.received.toLocaleString("en-IN")} of ₹
                            {d.loan.expected.toLocaleString("en-IN")} disbursed
                          </span>
                        </span>
                      )
                    ) : (
                      <span className="text-[var(--muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{d.agent?.name ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </VikrayaShell>
  );
}
