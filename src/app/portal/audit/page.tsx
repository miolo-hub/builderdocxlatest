"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PropTrackShell } from "@/components/portal/PropTrackShell";
import type { UserRole } from "@/lib/rbac";

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; role: UserRole; builderName?: string } | null>(null);
  const [logs, setLogs] = useState<{ description: string; type: string; actor: string; createdAt: string }[]>([]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch("/api/activity");
    if (res.ok) setLogs((await res.json()).activities);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) return null;

  return (
    <PropTrackShell user={user}>
      <h1 className="mb-6 text-2xl font-bold">Activity log</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Actor</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((a, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3 text-xs text-[var(--muted)]">
                  {new Date(a.createdAt).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{a.type}</td>
                <td className="px-4 py-3">{a.description}</td>
                <td className="px-4 py-3">{a.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <p className="p-6 text-center text-[var(--muted)]">No activity yet.</p>
        )}
      </div>
    </PropTrackShell>
  );
}
