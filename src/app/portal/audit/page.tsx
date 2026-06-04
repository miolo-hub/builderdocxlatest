"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PortalNav } from "@/components/portal/PortalNav";

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorType: string;
  customerId?: string;
  documentId?: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

interface User {
  name: string;
  role: "admin" | "sales" | "document_manager";
  builderName?: string;
}

export default function AuditPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  const load = useCallback(async () => {
    const me = await fetch("/api/auth/me");
    if (!me.ok) {
      router.push("/portal/login");
      return;
    }
    setUser((await me.json()).user);
    const res = await fetch("/api/audit?limit=100");
    if (res.ok) {
      setAudit((await res.json()).audit);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <PortalNav user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">Audit log</h1>
        <p className="mb-6 text-[var(--muted)]">
          Uploads, logins, OTP events, downloads, and notifications
        </p>

        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--muted)]">
                    {new Date(a.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                  <td className="px-4 py-3">
                    {a.actor}
                    <span className="ml-1 text-xs text-[var(--muted)]">
                      ({a.actorType})
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden text-xs text-[var(--muted)] sm:table-cell">
                    {a.metadata
                      ? Object.entries(a.metadata)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {audit.length === 0 && (
            <p className="p-8 text-center text-[var(--muted)]">No audit entries.</p>
          )}
        </div>
      </main>
    </div>
  );
}
