"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS, type UserRole } from "@/lib/rbac";

const NAV = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/portal/projects", label: "Projects & Inventory", icon: "🏗️" },
  { href: "/portal/clients", label: "Clients", icon: "👥" },
  { href: "/portal/deals", label: "Deals", icon: "📝" },
  { href: "/portal/payments", label: "Payments", icon: "💰" },
  { href: "/portal/agents", label: "Agents & Commissions", icon: "🤝" },
  { href: "/portal/audit", label: "Activity Log", icon: "📋" },
  { href: "/simulator", label: "WhatsApp Simulator", icon: "💬" },
];

interface PropTrackShellProps {
  user: { name: string; role: UserRole; builderName?: string };
  children: React.ReactNode;
}

export function PropTrackShell({ user, children }: PropTrackShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-white lg:block">
        <div className="border-b border-[var(--border)] p-4">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
              PT
            </span>
            <div>
              <p className="font-bold text-[var(--brand)]">PropTrack CRM</p>
              <p className="text-xs text-[var(--muted)]">{user.builderName}</p>
            </div>
          </Link>
        </div>
        <nav className="space-y-0.5 p-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                pathname.startsWith(item.href)
                  ? "bg-teal-50 text-[var(--brand)]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--border)] bg-white px-4 py-3">
          <p className="text-sm font-medium lg:hidden">PropTrack CRM</p>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right text-sm">
              <p className="font-medium">{user.name}</p>
              <p className="text-xs text-[var(--muted)]">{ROLE_LABELS[user.role]}</p>
            </div>
            <button type="button" onClick={logout} className="btn-secondary text-sm">
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
