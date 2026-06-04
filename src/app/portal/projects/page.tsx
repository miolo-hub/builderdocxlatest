"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { UserRole } from "@/lib/rbac";

export default function ProjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string; location: string; status: string; constructionPct: number; _count: { units: number } }[]>([]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects((await res.json()).projects);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Projects & Inventory</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link key={p.id} href={`/portal/projects/${p.id}`} className="card block p-5 hover:border-teal-300">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-sm text-[var(--muted)]">{p.location}</p>
            <p className="mt-2 text-sm">
              {p._count.units} units · {p.constructionPct}% built · {p.status}
            </p>
          </Link>
        ))}
      </div>
    </PropTrackShell>
  );
}
