"use client";

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function BarChart({
  items,
  maxValue,
}: {
  items: { label: string; value: number; color: string }[];
  maxValue?: number;
}) {
  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span>{item.label}</span>
            <span className="font-medium">{fmt(item.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (item.value / max) * 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StackedBar({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const sum = segments.reduce((s, x) => s + x.value, 0) || total || 1;
  return (
    <div>
      <div className="mb-2 flex h-8 overflow-hidden rounded-lg">
        {segments.map((seg) =>
          seg.value > 0 ? (
            <div
              key={seg.label}
              className="h-full transition-all"
              style={{
                width: `${(seg.value / sum) * 100}%`,
                backgroundColor: seg.color,
              }}
              title={`${seg.label}: ${fmt(seg.value)}`}
            />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {segments.map((seg) => (
          <span key={seg.label} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            {seg.label}: {fmt(seg.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function UnitStatusChart({
  counts,
}: {
  counts: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    blocked: number;
  };
}) {
  const items = [
    { label: "Available", value: counts.available, color: "#22c55e" },
    { label: "Reserved", value: counts.reserved, color: "#eab308" },
    { label: "Sold", value: counts.sold, color: "#ef4444" },
    { label: "Blocked", value: counts.blocked, color: "#64748b" },
  ];
  return (
    <div>
      <p className="mb-3 text-sm text-[var(--muted)]">
        {counts.total} total units
      </p>
      <StackedBar segments={items} total={counts.total} />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: i.color }}>
              {i.value}
            </p>
            <p className="text-xs text-[var(--muted)]">{i.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export { fmt as fmtCurrency };
