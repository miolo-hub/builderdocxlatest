const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  reserved: "bg-amber-100 text-amber-800 border-amber-200",
  sold: "bg-slate-200 text-slate-700 border-slate-300",
  blocked: "bg-rose-100 text-rose-800 border-rose-200",
};

function MiniBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral";
}) {
  const tones = {
    success: "badge badge-customer",
    warning: "badge badge-internal",
    danger: "bg-rose-100 text-rose-800",
    neutral: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

export function HeroDashboardMockup() {
  const units = [
    ["sold", "sold", "reserved", "available"],
    ["sold", "blocked", "available", "available"],
    ["reserved", "sold", "sold", "available"],
  ];

  return (
    <div className="card overflow-hidden rounded-2xl p-4 text-left sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div>
          <p className="text-xs font-medium text-[var(--brand-light)]">Skyline Residences</p>
          <p className="text-sm font-bold text-[var(--brand)]">Project Overview — Phase 2</p>
        </div>
        <div className="flex gap-2 text-[10px]">
          <MiniBadge label="Tower A" tone="neutral" />
          <MiniBadge label="Tower B" tone="neutral" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--foreground)]">Unit grid — Floor 12</p>
            <div className="flex gap-2 text-[10px] text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Available
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-amber-400" /> Reserved
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-slate-400" /> Sold
              </span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {units.flatMap((row, ri) =>
              row.map((status, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className={`flex h-10 items-center justify-center rounded-md border text-[10px] font-semibold ${statusColors[status]}`}
                >
                  {12}
                  {String.fromCharCode(65 + ci)}
                  {ri + 1}
                </div>
              )),
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              Collection summary
            </p>
            <p className="mt-1 text-lg font-bold text-[var(--brand)]">₹18.4 Cr</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-[72%] rounded-full bg-[var(--brand-light)]" />
            </div>
            <p className="mt-1 text-[10px] text-[var(--muted)]">72% of milestone target</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
              Active bookings
            </p>
            {[
              { unit: "Tower B · 1402", name: "Priya Menon", amt: "₹42L token" },
              { unit: "Tower A · 905", name: "Rahul Kapoor", amt: "Agreement pending" },
            ].map((b) => (
              <div
                key={b.unit}
                className="flex items-center justify-between border-t border-[var(--border)] py-2 first:border-0 first:pt-0"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">{b.unit}</p>
                  <p className="text-[10px] text-[var(--muted)]">{b.name}</p>
                </div>
                <p className="text-[10px] font-medium text-[var(--brand-light)]">{b.amt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InventoryMockup() {
  const floors = [14, 13, 12, 11];
  const statuses = ["available", "reserved", "sold", "blocked"] as const;

  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select className="input w-auto py-1 text-xs">
          <option>Tower A — East Wing</option>
        </select>
        <select className="input w-auto py-1 text-xs">
          <option>All floors</option>
        </select>
        <MiniBadge label="248 units" tone="neutral" />
      </div>
      <div className="space-y-2">
        {floors.map((floor) => (
          <div key={floor} className="flex items-center gap-2">
            <span className="w-8 text-[10px] font-semibold text-[var(--muted)]">F{floor}</span>
            <div className="grid flex-1 grid-cols-8 gap-1">
              {Array.from({ length: 8 }, (_, i) => {
                const status = statuses[(floor + i) % 4];
                return (
                  <div
                    key={i}
                    className={`flex h-7 items-center justify-center rounded border text-[9px] font-bold ${statusColors[status]}`}
                  >
                    {floor}
                    {String(i + 1).padStart(2, "0")}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-[var(--muted)]">
        <span>Available: 86</span>
        <span>Reserved: 34</span>
        <span>Sold: 118</span>
        <span>Blocked: 10</span>
      </div>
    </div>
  );
}

export function BookingWorkflowMockup() {
  const stages = [
    { label: "Lead", done: true },
    { label: "Site visit", done: true },
    { label: "Token", done: true },
    { label: "Booking", active: true },
    { label: "Agreement", done: false },
  ];

  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
        {stages.map((stage, i) => (
          <div key={stage.label} className="flex items-center">
            <div
              className={`whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold ${
                stage.active
                  ? "bg-teal-50 text-[var(--brand)] ring-1 ring-teal-200"
                  : stage.done
                    ? "bg-slate-100 text-[var(--foreground)]"
                    : "bg-slate-50 text-[var(--muted)]"
              }`}
            >
              {stage.label}
            </div>
            {i < stages.length - 1 && (
              <div className={`mx-1 h-px w-6 ${stage.done ? "bg-[var(--brand-light)]" : "bg-[var(--border)]"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-bold text-[var(--foreground)]">Ananya Desai</p>
            <p className="text-xs text-[var(--muted)]">+91 98200 44102 · 3BHK preference</p>
          </div>
          <MiniBadge label="Site visit done" tone="success" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[var(--muted)]">Shortlisted unit</p>
            <p className="font-semibold text-[var(--foreground)]">Tower B · Unit 1204</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Token received</p>
            <p className="font-semibold text-[var(--brand)]">₹5,00,000 · 12 Mar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentTrackingMockup() {
  const rows = [
    { label: "Booking amount", due: "01 Jan 2025", amt: "₹10,00,000", status: "Paid", tone: "success" as const },
    { label: "Slab 1 — Foundation", due: "15 Mar 2025", amt: "₹18,50,000", status: "Paid", tone: "success" as const },
    { label: "Slab 2 — Structure", due: "20 Jun 2025", amt: "₹22,00,000", status: "Due in 12 days", tone: "warning" as const },
    { label: "Slab 3 — Finishing", due: "10 Sep 2025", amt: "₹15,00,000", status: "Upcoming", tone: "neutral" as const },
  ];

  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--muted)]">Customer · Vikram Shah</p>
          <p className="font-bold text-[var(--brand)]">Tower A · Unit 905 — Installment schedule</p>
        </div>
        <MiniBadge label="₹65L agreement value" tone="neutral" />
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-[58%] rounded-full bg-[var(--brand-light)]" />
      </div>
      <p className="mb-4 text-[10px] text-[var(--muted)]">₹28.5L collected of ₹49L due milestones</p>
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2 font-medium">Milestone</th>
              <th className="px-3 py-2 font-medium">Due</th>
              <th className="px-3 py-2 font-medium">Amount</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[var(--border)]">
                <td className="px-3 py-2.5 text-[var(--foreground)]">{row.label}</td>
                <td className="px-3 py-2.5 text-[var(--muted)]">{row.due}</td>
                <td className="px-3 py-2.5 font-semibold text-[var(--foreground)]">{row.amt}</td>
                <td className="px-3 py-2.5">
                  <MiniBadge label={row.status} tone={row.tone} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WhatsAppMockup() {
  const messages = [
    {
      from: "bot",
      text: "Reminder: Slab 2 payment of ₹22,00,000 is due on 20 Jun for Unit 905, Tower A.",
    },
    {
      from: "bot",
      text: "Construction update: Floor 12 finishing work completed. View photos in your portal.",
    },
    {
      from: "user",
      text: "Please share my payment receipt for March.",
    },
    {
      from: "bot",
      text: "Payment receipt — Mar 2025.pdf sent. Reply PORTAL for OTP access to all documents.",
    },
  ];

  return (
    <div className="mx-auto max-w-sm">
      <div className="card overflow-hidden rounded-2xl">
        <div
          className="flex items-center gap-2 px-4 py-3 text-white"
          style={{ background: "var(--whatsapp-header)" }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
            V
          </span>
          <div>
            <p className="text-sm font-semibold">Skyline Residences</p>
            <p className="text-[10px] text-white/80">Vikraya · Vikram Shah</p>
          </div>
        </div>
        <div className="space-y-2 p-3" style={{ background: "#ece5dd" }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[11px] leading-relaxed shadow-sm ${
                  msg.from === "user"
                    ? "rounded-tr-none text-[var(--foreground)]"
                    : "rounded-tl-none bg-white text-[var(--foreground)]"
                }`}
                style={msg.from === "user" ? { background: "var(--whatsapp-bubble)" } : undefined}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] bg-white px-3 py-2 text-[10px] text-[var(--muted)]">
          Automated reminders · Document delivery · OTP portal access
        </div>
      </div>
    </div>
  );
}

export function ClientPortalMockup() {
  return (
    <div className="mx-auto max-w-[280px]">
      <div className="card overflow-hidden rounded-[2rem] border-2 border-[var(--border)] p-1">
        <div className="rounded-[1.6rem] bg-[var(--background)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--brand)]">Vikraya Portal</p>
            <MiniBadge label="OTP verified" tone="success" />
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white p-3">
            <p className="text-[10px] text-[var(--muted)]">Your unit</p>
            <p className="font-bold text-[var(--foreground)]">Green Valley · Tower C · 804</p>
            <p className="mt-1 text-[10px] text-[var(--brand-light)]">3BHK · 1,450 sq.ft · East facing</p>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase text-[var(--muted)]">Payment timeline</p>
            {[
              { d: "Mar 2025", l: "Slab 1 paid", ok: true },
              { d: "Jun 2025", l: "Slab 2 due · ₹22L", ok: false },
            ].map((item) => (
              <div
                key={item.d}
                className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-2 py-2"
              >
                <span
                  className={`h-2 w-2 rounded-full ${item.ok ? "bg-emerald-500" : "bg-[var(--accent)]"}`}
                />
                <div>
                  <p className="text-[10px] font-semibold text-[var(--foreground)]">{item.l}</p>
                  <p className="text-[9px] text-[var(--muted)]">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-dashed border-[var(--border)] p-3">
            <p className="text-[10px] font-semibold text-[var(--muted)]">Documents</p>
            {["Allotment letter.pdf", "Payment receipt — Mar.pdf"].map((doc) => (
              <div
                key={doc}
                className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] text-[var(--foreground)]"
              >
                <span>{doc}</span>
                <span className="text-[var(--brand-light)]">↓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AgentManagementMockup() {
  const agents = [
    { name: "Karthik N.", bookings: 14, revenue: "₹8.2 Cr", commission: "₹12.4L" },
    { name: "Meera S.", bookings: 11, revenue: "₹6.1 Cr", commission: "₹9.8L" },
    { name: "Arjun P.", bookings: 9, revenue: "₹5.4 Cr", commission: "₹8.1L" },
  ];

  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <p className="mb-4 text-sm font-bold text-[var(--brand)]">Agent performance — Q2 2025</p>
      <div className="space-y-2">
        {agents.map((agent, i) => (
          <div
            key={agent.name}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-slate-50 p-3"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i === 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {i + 1}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">{agent.name}</p>
              <p className="text-[10px] text-[var(--muted)]">{agent.bookings} bookings closed</p>
            </div>
            <div className="text-right text-[10px]">
              <p className="font-semibold text-[var(--foreground)]">{agent.revenue}</p>
              <p className="text-[var(--brand)]">Comm. {agent.commission}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentHubMockup() {
  const folders = [
    {
      customer: "Vikram Shah · Unit 905",
      files: ["Sale agreement.pdf", "Token receipt.pdf", "NOC — bank.pdf"],
    },
    {
      customer: "Ananya Desai · Unit 1204",
      files: ["Booking form.pdf", "Allotment letter.pdf"],
    },
  ];

  return (
    <div className="card rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--brand)]">Skyline Residences — Document vault</p>
        <MiniBadge label="R2 encrypted" tone="neutral" />
      </div>
      <div className="space-y-3">
        {folders.map((folder) => (
          <div key={folder.customer} className="rounded-xl border border-[var(--border)] bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold text-[var(--brand-light)]">{folder.customer}</p>
            <div className="space-y-1">
              {folder.files.map((file) => (
                <div
                  key={file}
                  className="flex items-center justify-between rounded-lg bg-white px-2 py-1.5 text-[11px] text-[var(--foreground)]"
                >
                  <span>{file}</span>
                  <span className="text-[10px] text-[var(--muted)]">PDF · 248 KB</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FullDashboardMockup() {
  return (
    <div className="card overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-slate-50 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-400" />
          <span className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex-1 rounded-lg border border-[var(--border)] bg-white px-4 py-1 text-center text-[11px] text-[var(--muted)]">
          app.vikrayaos.com/dashboard
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs text-[var(--brand-light)]">Skyline Residences · Phase 2</p>
            <p className="text-xl font-bold text-[var(--brand)]">Project command center</p>
          </div>
          <div className="flex gap-4 text-center">
            {[
              { v: "512", l: "Total units" },
              { v: "68%", l: "Sold" },
              { v: "₹142Cr", l: "Collected" },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-lg font-bold text-[var(--brand)]">{s.v}</p>
                <p className="text-[10px] text-[var(--muted)]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Floor heat map — Tower A
            </p>
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: 24 }, (_, i) => {
                const s = ["sold", "reserved", "available", "sold"][i % 4];
                const fills: Record<string, string> = {
                  sold: "bg-slate-300",
                  reserved: "bg-amber-300",
                  available: "bg-emerald-300",
                  blocked: "bg-rose-300",
                };
                return <div key={i} className={`h-5 rounded-sm ${fills[s]}`} />;
              })}
            </div>
          </div>

          <div className="lg:col-span-4">
            <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Recent bookings
            </p>
            {[
              "1402 · Priya Menon · ₹42L",
              "905 · Rahul Kapoor · Token",
              "704 · Suresh Iyer · Site visit",
            ].map((b) => (
              <div
                key={b}
                className="mb-1.5 rounded-lg border border-[var(--border)] bg-slate-50 px-2 py-1.5 text-[11px] text-[var(--foreground)]"
              >
                {b}
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Payment dues
            </p>
            <div className="space-y-2">
              {[
                { d: "Jun 20", a: "₹22L", c: 3 },
                { d: "Jul 05", a: "₹8.5L", c: 7 },
              ].map((due) => (
                <div
                  key={due.d}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-slate-50 px-2 py-2 text-[11px]"
                >
                  <span className="text-[var(--muted)]">{due.d}</span>
                  <span className="font-semibold text-[var(--foreground)]">{due.a}</span>
                  <MiniBadge label={`${due.c} customers`} tone="warning" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="mb-2 text-[10px] font-semibold uppercase text-[var(--muted)]">
            Agent activity today
          </p>
          <div className="flex flex-wrap gap-2">
            {["Karthik: 2 site visits", "Meera: 1 booking", "Arjun: 4 follow-ups"].map((a) => (
              <span
                key={a}
                className="rounded-full border border-[var(--border)] bg-teal-50 px-3 py-1 text-[10px] text-[var(--brand)]"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
