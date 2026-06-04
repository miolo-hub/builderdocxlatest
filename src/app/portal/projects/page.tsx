"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddProjectModal } from "@/components/portal/AddProjectModal";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/constants";
import { can, type UserRole } from "@/lib/rbac";

type ProjectRow = {
  id: string;
  name: string;
  location: string;
  status: string;
  constructionPct: number;
  _count: { units: number };
};

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async (q: string, status: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/projects?${params}`);
    if (res.ok) setProjects((await res.json()).projects);
  }, []);

  useEffect(() => {
    void fetch("/api/auth/me").then(async (me) => {
      if (!me.ok) router.push("/portal/login");
      else {
        setUser((await me.json()).user);
        void load("", "");
      }
    });
  }, [router, load]);

  useEffect(() => {
    const t = setTimeout(() => load(query, statusFilter), 200);
    return () => clearTimeout(t);
  }, [query, statusFilter, load]);

  if (!user) return null;

  const canAdd = can(user.role, "projects.manage");

  return (
    <PropTrackShell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Projects & Inventory</h1>
        {canAdd && (
          <button type="button" className="btn-primary" onClick={() => setShowAdd(true)}>
            + Add project
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          className="input max-w-md flex-1 min-w-[200px]"
          placeholder="Search by name, location, type…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input max-w-[180px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROJECT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <AddProjectModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => load(query, statusFilter)}
      />

      {projects.length === 0 ? (
        <p className="text-[var(--muted)]">No projects match your search.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/portal/projects/${p.id}`}
              className="card block p-5 hover:border-teal-300"
            >
              <h2 className="font-semibold">{p.name}</h2>
              <p className="text-sm text-[var(--muted)]">{p.location || "—"}</p>
              <p className="mt-2 text-sm">
                {p._count.units} units · {p.constructionPct}% built ·{" "}
                {PROJECT_STATUS_LABELS[p.status] ?? p.status}
              </p>
            </Link>
          ))}
        </div>
      )}
    </PropTrackShell>
  );
}
