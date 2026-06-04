"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/constants";

interface PortalNavProps {
  user: {
    name: string;
    role: keyof typeof ROLE_LABELS;
    builderName?: string;
  };
}

export function PortalNav({ user }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/portal/dashboard", label: "Customers" },
    { href: "/portal/audit", label: "Audit Log" },
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
  }

  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
              BD
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--brand)]">BuilderDocs</p>
              <p className="text-xs text-[var(--muted)]">{user.builderName}</p>
            </div>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname.startsWith(l.href)
                    ? "bg-teal-50 text-[var(--brand)]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-[var(--muted)]">{ROLE_LABELS[user.role]}</p>
          </div>
          <button type="button" onClick={logout} className="btn-secondary text-sm">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
