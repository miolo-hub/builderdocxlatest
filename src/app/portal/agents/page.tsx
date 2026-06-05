"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddAgentModal } from "@/components/portal/AddAgentModal";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import { can, type UserRole } from "@/lib/rbac";

type AgentRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  commissionRate: number;
  _count: { deals: number; commissions: number };
};

export default function AgentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/agents");
    if (res.ok) setAgents((await res.json()).agents);
  }, []);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        await load();
      }
    })();
  }, [router, load]);

  if (!user) return null;

  const canManage = can(user.role, "agents.manage");

  return (
    <PropTrackShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Manage sales agents and track deals linked to each agent.
          </p>
        </div>
        {canManage && (
          <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
            + Add agent
          </button>
        )}
      </div>

      <AddAgentModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => void load()}
      />

      {agents.length === 0 ? (
        <p className="text-[var(--muted)]">
          No agents yet.{canManage ? " Add your first sales agent to assign clients and deals." : ""}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <div key={a.id} className="card p-5">
              <h2 className="font-semibold">{a.name}</h2>
              <p className="text-sm text-[var(--muted)]">{a.phone}</p>
              {a.email && <p className="text-sm text-[var(--muted)]">{a.email}</p>}
              <p className="mt-2 text-sm">
                {a.commissionRate}% commission · {a._count.deals} deal
                {a._count.deals === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </div>
      )}
    </PropTrackShell>
  );
}
