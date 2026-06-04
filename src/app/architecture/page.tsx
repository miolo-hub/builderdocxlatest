import Link from "next/link";

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-bold text-[var(--brand)]">
            ← BuilderDocs
          </Link>
          <div className="flex gap-3 text-sm">
            <Link href="/portal/login" className="text-teal-700 hover:underline">
              Portal
            </Link>
            <Link href="/simulator" className="text-teal-700 hover:underline">
              Simulator
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="mb-2 text-3xl font-bold">System architecture</h1>
        <p className="mb-8 text-[var(--muted)]">
          BuilderDocs — two-sided document platform for real estate builders
        </p>

        <div className="card mb-8 overflow-x-auto p-6">
          <pre className="text-xs leading-tight text-slate-700 sm:text-sm">
{`┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUILDERDOCS PLATFORM                               │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────┐                    ┌──────────────────────────────┐
  │  BUILDER ADMIN       │                    │  CUSTOMER CHANNEL             │
  │  PORTAL (Web)        │                    │                               │
  │  ─────────────────   │                    │  ┌─────────┐   ┌──────────┐  │
  │  • Login / RBAC      │                    │  │ WhatsApp│   │ Simulator │  │
  │  • Search customers  │                    │  │ Business│   │ (prototype)│  │
  │  • Upload + tag docs │                    │  │ API     │   └─────┬────┘  │
  │  • Visibility flags  │                    │  │ Meta /  │         │        │
  │  • Audit log view    │                    │  │ Twilio  │         │        │
  └──────────┬───────────┘                    │  └────┬────┘         │        │
             │                                └───────┼──────────────┼────────┘
             │                                        │              │
             └────────────────┬───────────────────────┴──────────────┘
                              ▼
              ┌───────────────────────────────────────────┐
              │              NEXT.JS API LAYER             │
              │  /api/auth  /api/customers  /api/documents │
              │  /api/audit /api/bot/message /api/files    │
              └───────────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         ▼                            ▼                            ▼
  ┌─────────────┐            ┌─────────────────┐          ┌─────────────────┐
  │ Auth & RBAC │            │ Document Service │          │ Bot Engine       │
  │ Session     │            │ Upload, tag,     │          │ OTP verify       │
  │ admin/sales │            │ visibility       │          │ Menu + doc match │
  │ doc_manager │            │ notify trigger   │          │ Signed URL gen   │
  └─────────────┘            └────────┬────────┘          └─────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
           ┌─────────────────┐                 ┌─────────────────────┐
           │ Data Store       │                 │ Cloudflare R2        │
           │ (JSON / DB)      │                 │ S3-compatible API    │
           │ customers, docs, │                 │ + app HMAC signed URLs│
           │ audit entries    │                 │ for customer download │
           └─────────────────┘                 └─────────────────────┘`}
          </pre>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Customer identity",
              items: [
                "Phone matched to customer record",
                "OTP before document list (stored on builder record)",
                "Session state per phone in bot engine",
              ],
            },
            {
              title: "Document lifecycle",
              items: [
                "Upload via portal with type + visibility",
                "customer vs internal-only flags",
                "WhatsApp notification audit on upload",
              ],
            },
            {
              title: "Security",
              items: [
                "HTTP-only session cookies for portal",
                "HMAC signed URLs with expiry",
                "Role-based portal access",
              ],
            },
            {
              title: "Production path",
              items: [
                "Replace JSON store with PostgreSQL",
                "R2 configured (documents); optional R2 public domain",
                "Meta WhatsApp webhooks → bot API",
              ],
            },
          ].map((s) => (
            <div key={s.title} className="card p-5">
              <h2 className="font-semibold text-[var(--brand)]">{s.title}</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
                {s.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <div className="card p-6">
          <h2 className="mb-4 font-semibold">Data flow — document download</h2>
          <ol className="space-y-3 text-sm text-[var(--muted)]">
            <li>
              <strong className="text-slate-800">1.</strong> Customer selects
              document in WhatsApp → Bot engine validates OTP session
            </li>
            <li>
              <strong className="text-slate-800">2.</strong> API generates signed
              URL (path + expiry + HMAC)
            </li>
            <li>
              <strong className="text-slate-800">3.</strong> Customer opens link →
              /api/files/download verifies signature → streams file
            </li>
            <li>
              <strong className="text-slate-800">4.</strong> Audit entry:
              document.accessed / document.downloaded
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
