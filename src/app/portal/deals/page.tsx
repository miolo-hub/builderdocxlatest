"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { UserRole } from "@/lib/rbac";

export default function DealsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [deals, setDeals] = useState<{
    id: string;
    finalPrice: number;
    paymentStatus: string;
    client: { name: string };
    unit: { unitNumber: string; project: { name: string } };
    agent: { name: string } | null;
  }[]>([]);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        const res = await fetch("/api/deals");
        if (res.ok) setDeals((await res.json()).deals);
      }
    })();
  }, [router]);

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Deals</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Agent</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">{d.client.name}</td>
                <td className="px-4 py-3">
                  {d.unit.unitNumber} — {d.unit.project.name}
                </td>
                <td className="px-4 py-3">₹{d.finalPrice.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{d.paymentStatus}</td>
                <td className="px-4 py-3">{d.agent?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PropTrackShell>
  );
}
