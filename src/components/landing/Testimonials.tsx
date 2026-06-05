import { AnimatedSection } from "./AnimatedSection";
import { SectionHeading, SectionLabel } from "./SectionHeader";

const testimonials = [
  {
    quote:
      "We were chasing slab payments across three projects with separate Excel files. Vikraya gave our finance team one overdue dashboard — collections improved 23% in the first quarter.",
    name: "Rajesh Krishnan",
    role: "VP Finance",
    company: "Regional Developer, South India",
    initials: "RK",
    stars: 5,
  },
  {
    quote:
      "Our sales team used to double-book units because inventory lived in a shared Google Sheet. The tower-wise grid ended that overnight. Agents finally trust what they see on screen.",
    name: "Sneha Reddy",
    role: "Head of Sales",
    company: "Mid-size Builder, Hyderabad",
    initials: "SR",
    stars: 5,
  },
  {
    quote:
      "Commission tracking was a monthly nightmare. Now every booking is attributed to an agent with revenue and commission calculated automatically. My sales heads actually use the dashboard daily.",
    name: "Arun Mehta",
    role: "Director — Operations",
    company: "Multi-project Developer, Pune",
    initials: "AM",
    stars: 5,
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} className="h-4 w-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <AnimatedSection className="landing-section-alt py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <SectionLabel>Reviews</SectionLabel>
          <SectionHeading
            title="Client stories"
            description="Transactional success from developers, sales heads, and finance teams running projects on Vikraya."
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <AnimatedSection
              key={t.name}
              delay={i * 80}
              className="landing-glass landing-glass-hover flex flex-col rounded-2xl p-7"
            >
              <Stars count={t.stars} />
              <blockquote className="mt-5 flex-1 text-sm leading-relaxed text-[var(--foreground)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand)] text-sm font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{t.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {t.role} · {t.company}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
