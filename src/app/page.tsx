import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-white">
              BD
            </span>
            <span className="text-xl font-bold text-[var(--brand)]">BuilderDocs</span>
          </div>
          <nav className="flex gap-3 text-sm font-medium">
            <Link href="/architecture" className="text-slate-600 hover:text-[var(--brand)]">
              Architecture
            </Link>
            <Link href="/portal/login" className="btn-primary text-sm">
              Builder Portal
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-teal-700">
            Real estate document platform
          </p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Documents delivered over WhatsApp.
            <br />
            <span className="text-[var(--brand)]">Managed in one portal.</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-[var(--muted)]">
            Builders upload sale agreements, allotment letters, and receipts.
            Customers retrieve them on-demand via a verified WhatsApp bot — no
            emails, no office visits.
          </p>
        </div>

        <div className="mb-16 grid gap-6 sm:grid-cols-2">
          <Link
            href="/portal/login"
            className="card group p-8 transition hover:border-teal-300 hover:shadow-md"
          >
            <span className="mb-3 inline-block text-3xl">🏗️</span>
            <h2 className="mb-2 text-xl font-bold text-[var(--brand)] group-hover:underline">
              A) Builder Admin Portal
            </h2>
            <p className="text-[var(--muted)]">
              Role-based dashboard to search customers, upload and tag documents,
              set visibility, and view audit logs.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
              Open portal →
            </span>
          </Link>

          <Link
            href="/simulator"
            className="card group p-8 transition hover:border-teal-300 hover:shadow-md"
          >
            <span className="mb-3 inline-block text-3xl">💬</span>
            <h2 className="mb-2 text-xl font-bold text-[var(--brand)] group-hover:underline">
              B) WhatsApp Bot Simulator
            </h2>
            <p className="text-[var(--muted)]">
              Prototype the customer journey: OTP verification, document menu,
              PDF delivery with signed URLs.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-teal-700">
              Try simulator →
            </span>
          </Link>
        </div>

        <div className="card bg-gradient-to-br from-teal-900 to-slate-900 p-8 text-white">
          <h2 className="mb-4 text-xl font-bold">C) Working prototype</h2>
          <p className="mb-6 max-w-2xl text-teal-100">
            Both sides share the same data store. Upload a document in the portal,
            then fetch it in the WhatsApp simulator. Audit events are recorded for
            uploads, OTP verification, and downloads.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/architecture" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
              View architecture diagram
            </Link>
            <Link href="/portal/login" className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-slate-900 hover:bg-amber-400">
              Start demo
            </Link>
          </div>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            { title: "OTP verification", desc: "Mobile number verified before document access" },
            { title: "Signed URLs", desc: "Expiring download links for secure file delivery" },
            { title: "Audit trail", desc: "Who uploaded, who accessed, and when" },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <h3 className="font-semibold text-[var(--brand)]">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
