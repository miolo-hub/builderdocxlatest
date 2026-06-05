"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddCustomerModal } from "@/components/portal/AddCustomerModal";
import { ClientStageSelect } from "@/components/portal/ClientStageSelect";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import { CLIENT_STAGE_LABELS, CLIENT_STAGES } from "@/lib/constants";
import { can, type UserRole } from "@/lib/rbac";

type ClientRow = {
  id: string;
  name: string;
  phone: string;
  unit: string | null;
  stage: string;
  projectName: string | null;
  linkedUnitId?: string | null;
};

export default function ClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [projectOptions, setProjectOptions] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const search = useCallback(async (q: string, stage: string, project: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (stage) params.set("stage", stage);
    if (project) params.set("project", project);
    const res = await fetch(`/api/clients?${params}`);
    if (res.ok) setClients((await res.json()).clients);
  }, []);

  useEffect(() => {
    void fetch("/api/auth/me").then(async (me) => {
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        void fetch("/api/projects").then(async (res) => {
          if (res.ok) setProjectOptions((await res.json()).projects);
        });
        void search("", "", "");
      }
    });
  }, [router, search]);

  useEffect(() => {
    const t = setTimeout(() => search(query, stageFilter, projectFilter), 200);
    return () => clearTimeout(t);
  }, [query, stageFilter, projectFilter, search]);

  if (!user) return null;

  const canEditStage = can(user.role, "clients.update_stage");
  const canAdd = can(user.role, "clients.manage");

  return (
    <VikrayaShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Clients</h1>
        {canAdd && (
          <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
            + Add client
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          className="input max-w-md flex-1 min-w-[200px]"
          placeholder="Search name, phone, flat, project…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input max-w-[200px]"
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
        <select
          className="input max-w-[180px]"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {CLIENT_STAGES.map((s) => (
            <option key={s} value={s}>
              {CLIENT_STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <AddCustomerModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => search(query, stageFilter, projectFilter)}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <div key={c.id} className="card p-5">
            <Link href={`/portal/clients/${c.id}`} className="block hover:text-[var(--brand)]">
              <h2 className="font-semibold">{c.name}</h2>
              <p className="text-sm text-[var(--muted)]">{c.phone}</p>
              {c.projectName && (
                <p className="mt-1 text-xs text-[var(--muted)]">{c.projectName}</p>
              )}
              {c.unit && (
                <p className="text-xs font-medium text-teal-800">Flat {c.unit}</p>
              )}
            </Link>
            <div
              className="mt-3"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <ClientStageSelect
                clientId={c.id}
                stage={c.stage}
                linkedUnitId={c.linkedUnitId}
                canEdit={canEditStage}
                compact
                onUpdated={() => search(query, stageFilter, projectFilter)}
              />
            </div>
          </div>
        ))}
      </div>
      {clients.length === 0 && (
        <p className="text-center text-[var(--muted)]">No clients match your filters.</p>
      )}
    </VikrayaShell>
  );
}
