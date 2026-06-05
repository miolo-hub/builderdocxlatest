export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-light)]">
      /// {children}
    </p>
  );
}

export function SectionHeading({
  title,
  description,
  align = "center",
}: {
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  const alignClass = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl";

  return (
    <div className={alignClass}>
      <h2
        className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl"
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-[var(--muted)]">{description}</p>
      )}
    </div>
  );
}
