import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-white">
              PT
            </span>
            <span className="text-xl font-bold text-[var(--brand)]">PropTrack CRM</span>
          </div>
          <Link href="/portal/login" className="btn-primary text-sm">
            Open CRM
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Real estate CRM built for{" "}
          <span className="text-[var(--brand)]">how you actually sell.</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg text-[var(--muted)]">
          Inventory, payments, documents, WhatsApp automation, and agent commissions —
          on React, Node.js, PostgreSQL, JWT auth, and cloud storage.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <Link href="/portal/login" className="card p-8 hover:border-teal-300">
            <h2 className="text-xl font-bold text-[var(--brand)]">CRM Portal</h2>
            <p className="mt-2 text-[var(--muted)]">
              Projects, clients, deals, payments, agents, documents.
            </p>
          </Link>
          <Link href="/simulator" className="card p-8 hover:border-teal-300">
            <h2 className="text-xl font-bold text-[var(--brand)]">WhatsApp Simulator</h2>
            <p className="mt-2 text-[var(--muted)]">
              Client self-service: OTP, documents, payment schedule, construction updates.
            </p>
          </Link>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { t: "Inventory intelligence", d: "Unit grid with sold / reserved / available" },
            { t: "Payment engine", d: "Milestone schedules, overdue tracking, receipts" },
            { t: "Document hub", d: "R2 vault + WhatsApp delivery on demand" },
          ].map((f) => (
            <div key={f.t} className="card p-5">
              <h3 className="font-semibold text-[var(--brand)]">{f.t}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{f.d}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
