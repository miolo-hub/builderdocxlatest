"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import type { UserRole } from "@/lib/rbac";

export default function AgentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [agents, setAgents] = useState<{
    name: string;
    phone: string;
    commissionRate: number;
    _count: { deals: number; commissions: number };
  }[]>([]);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        const res = await fetch("/api/agents");
        if (res.ok) setAgents((await res.json()).agents);
      }
    })();
  }, [router]);

  if (!user) return null;

  return (
    <VikrayaShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Agents & Commissions</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {agents.map((a, i) => (
          <div key={i} className="card p-5">
            <h2 className="font-semibold">{a.name}</h2>
            <p className="text-sm text-[var(--muted)]">{a.phone}</p>
            <p className="mt-2 text-sm">
              {a.commissionRate}% commission · {a._count.deals} deals
            </p>
          </div>
        ))}
      </div>
    </VikrayaShell>
  );
}
