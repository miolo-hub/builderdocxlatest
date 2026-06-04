"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { UserRole } from "@/lib/rbac";

export default function PaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [overdue, setOverdue] = useState<{
    amount: number;
    dueDate: string;
    deal: { client: { name: string }; unit: { unitNumber: string } };
  }[]>([]);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        const res = await fetch("/api/payments/overdue");
        if (res.ok) setOverdue((await res.json()).overdue);
      }
    })();
  }, [router]);

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Payments & Finance</h1>
      <h2 className="mb-4 font-semibold text-red-700">Overdue installments</h2>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Unit</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {overdue.map((o, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3">{o.deal.client.name}</td>
                <td className="px-4 py-3">{o.deal.unit.unitNumber}</td>
                <td className="px-4 py-3">{new Date(o.dueDate).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3">₹{o.amount.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {overdue.length === 0 && (
          <p className="p-6 text-center text-[var(--muted)]">No overdue payments 🎉</p>
        )}
      </div>
    </PropTrackShell>
  );
}
