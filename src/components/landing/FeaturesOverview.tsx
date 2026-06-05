import { AnimatedSection } from "./AnimatedSection";

export const realEstateFeatures = [
  {
    id: "inventory",
    icon: "🏢",
    title: "See which flats are free",
    plain: "Open a colour-coded grid by tower and floor. Green means available, amber means reserved, grey means sold — no wrong bookings.",
    anchor: "#inventory",
  },
  {
    id: "sales",
    icon: "🤝",
    title: "Track buyers step by step",
    plain: "From first enquiry and site visit to token money and final agreement — every buyer linked to the exact flat they want.",
    anchor: "#sales",
  },
  {
    id: "collections",
    icon: "💰",
    title: "Know who paid and who hasn't",
    plain: "Construction-linked payment plans with due dates, overdue alerts, and instant receipts when money comes in.",
    anchor: "#collections",
  },
  {
    id: "whatsapp",
    icon: "💬",
    title: "WhatsApp reminders on autopilot",
    plain: "Send payment due alerts, construction updates, and documents to buyers — without typing the same message 50 times.",
    anchor: "#buyers",
  },
  {
    id: "portal",
    icon: "📱",
    title: "Buyers check details themselves",
    plain: "Customers log in with OTP to see their flat, payment history, and download agreement copies — fewer phone calls to your team.",
    anchor: "#buyers",
  },
  {
    id: "documents",
    icon: "📄",
    title: "All papers in one safe place",
    plain: "Sale agreements, allotment letters, receipts, and NOCs — filed per buyer and flat, ready to send in one click.",
    anchor: "#documents",
  },
  {
    id: "agents",
    icon: "📊",
    title: "See which agent sold what",
    plain: "Bookings, revenue, and commission per sales person — so you know who is performing and what is owed.",
    anchor: "#dashboard",
  },
  {
    id: "dashboard",
    icon: "📈",
    title: "One screen for the whole project",
    plain: "Sold flats, money collected, pending dues, and recent bookings — visible together for developers and managers.",
    anchor: "#dashboard",
  },
];

export function FeaturesOverview() {
  return (
    <AnimatedSection id="features" className="scroll-mt-28 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="landing-eyebrow mb-4">What you get</p>
          <h2 className="landing-section-title">
            Everything to run a real estate project — in simple terms
          </h2>
          <p className="landing-body mx-auto mt-5">
            No technical jargon. Just the day-to-day jobs your sales, finance, and
            operations teams already do — made easier.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {realEstateFeatures.map((feature, index) => (
            <a
              key={feature.id}
              href={feature.anchor}
              className="landing-glass landing-glass-hover group flex flex-col rounded-2xl p-5 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>
                  {feature.icon}
                </span>
                <span className="font-mono text-xs font-bold text-[var(--brand-light)]/50 group-hover:text-[var(--brand-light)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold leading-snug text-[var(--brand)]">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--muted)]">
                {feature.plain}
              </p>
              <span className="mt-4 text-xs font-semibold text-[var(--brand-light)] opacity-0 transition group-hover:opacity-100">
                See how →
              </span>
            </a>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
