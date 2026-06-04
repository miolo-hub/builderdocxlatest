import Link from "next/link";
import { WhatsAppChat } from "@/components/simulator/WhatsAppChat";

export default function SimulatorPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-[var(--border)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-[var(--brand)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-xs font-bold text-white">
              BD
            </span>
            <span className="font-bold">BuilderDocs</span>
          </Link>
          <div className="flex gap-3 text-sm">
            <Link href="/portal/login" className="text-teal-700 hover:underline">
              Builder Portal
            </Link>
            <Link href="/architecture" className="text-slate-600 hover:underline">
              Architecture
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">WhatsApp Bot Simulator</h1>
          <p className="mt-2 text-[var(--muted)]">
            Prototype customer flows — same backend as production WhatsApp Business API
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <WhatsAppChat />

          <div className="space-y-4 text-sm">
            <div className="card p-5">
              <h2 className="font-semibold text-[var(--brand)]">Sample flow</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-[var(--muted)]">
                <li>Customer sends <strong>Hi</strong></li>
                <li>Bot shows menu: Documents / Payment / Team</li>
                <li>Customer picks <strong>1</strong> (My Documents)</li>
                <li>OTP sent to registered mobile — enter <strong>482916</strong></li>
                <li>Bot lists customer-accessible documents</li>
                <li>Customer requests <strong>Sale Agreement</strong> → PDF via signed URL</li>
              </ol>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-[var(--brand)]">Production integration</h2>
              <p className="mt-2 text-[var(--muted)]">
                Replace this simulator with Meta Cloud API or Twilio webhooks pointing to{" "}
                <code className="rounded bg-slate-100 px-1">/api/bot/message</code>.
                OTP would be sent via SMS/WhatsApp template; files served from S3/GCS with
                the same signed-URL pattern.
              </p>
            </div>
            <div className="card border-amber-200 bg-amber-50 p-5">
              <p className="font-medium text-amber-900">Try end-to-end</p>
              <p className="mt-1 text-amber-800">
                Upload a new document in the{" "}
                <Link href="/portal/login" className="underline">
                  Builder Portal
                </Link>{" "}
                for Vikram Patel, then request it here after OTP.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
