"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AddProjectModal } from "@/components/portal/AddProjectModal";
import { ProjectProgressEditor } from "@/components/portal/ProjectProgressEditor";
import { VikrayaShell } from "@/components/portal/VikrayaShell";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/constants";
import { can, type UserRole } from "@/lib/rbac";

type ProjectRow = {
  id: string;
  name: string;
  location: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string;
  constructionPct: number;
  _count: { units: number };
  unitCounts: {
    available: number;
    reserved: number;
    sold: number;
    blocked: number;
  };
};

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Delete project "${name}" and all its units? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? "Could not delete project");
      return;
    }
    void load(query, statusFilter);
  }

  if (!user) return null;

  const canAdd = can(user.role, "projects.manage");
  const canEditProgress = can(user.role, "projects.manage");
  const canDelete = can(user.role, "projects.delete");

  return (
    <VikrayaShell user={user}>
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
            <div key={p.id} className="card relative p-5">
              <Link href={`/portal/projects/${p.id}`} className="block hover:border-teal-300">
                <div className="flex items-start gap-3 pr-16">
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-contain bg-white"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="text-sm text-[var(--muted)]">{p.location || "—"}</p>
                    {p.websiteUrl && (
                      <p className="mt-0.5 truncate text-xs text-teal-700">{p.websiteUrl}</p>
                    )}
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      <strong>{p._count.units}</strong> units · 🟢 {p.unitCounts.available} avail · 🟡{" "}
                      {p.unitCounts.reserved} reserved · 🔴 {p.unitCounts.sold} sold · ⚫{" "}
                      {p.unitCounts.blocked} blocked
                    </p>
                  </div>
                </div>
              </Link>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <ProjectProgressEditor
                  projectId={p.id}
                  status={p.status}
                  constructionPct={p.constructionPct}
                  canEdit={canEditProgress}
                  compact
                  onUpdated={() => load(query, statusFilter)}
                />
              </div>
              {canDelete && (
                <button
                  type="button"
                  className="absolute right-4 top-4 text-xs text-red-600 hover:underline disabled:opacity-50"
                  disabled={deletingId === p.id}
                  onClick={(e) => {
                    e.preventDefault();
                    void deleteProject(p.id, p.name);
                  }}
                >
                  {deletingId === p.id ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </VikrayaShell>
  );
}
