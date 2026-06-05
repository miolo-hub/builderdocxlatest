import { AnimatedSection } from "./AnimatedSection";
import { SectionHeading, SectionLabel } from "./SectionHeader";

const features = [
  {
    title: "Real-Time Inventory Management",
    desc: "Track every unit across towers and floors with a visual inventory grid designed for project sales.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    ),
  },
  {
    title: "Sales & Booking Workflow",
    desc: "Manage the complete customer journey from enquiry to agreement with connected unit and customer history.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
  {
    title: "Payment & Collection Tracking",
    desc: "Simplify collections with milestone-based schedules, overdue alerts, and customer-wise summaries.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
  },
  {
    title: "Built-In WhatsApp Communication",
    desc: "Keep buyers updated automatically with payment reminders, construction updates, and document sharing.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    ),
  },
  {
    title: "Customer Self-Service Portal",
    desc: "Give customers OTP-based access to payment schedules, documents, and construction progress.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
  },
  {
    title: "Centralized Document Hub",
    desc: "Store and organize agreements, receipts, allotment letters, and possession documents securely.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
  },
  {
    title: "Agent & Team Management",
    desc: "Track performance, bookings, revenue contribution, and commissions across your sales team.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    ),
  },
];

export function FeaturesGrid() {
  return (
    <AnimatedSection id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Feature Modules</SectionLabel>
          <SectionHeading
            title="Everything your real estate team needs — in one platform"
            description="Seven connected modules built for inventory, sales, collections, communication, documents, and team performance."
          />
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <AnimatedSection
              key={feature.title}
              delay={i * 60}
              className="landing-glass landing-glass-hover group rounded-2xl p-7"
            >
              <div className="landing-icon-box mb-5 h-11 w-11 transition group-hover:border-teal-300">
                <svg
                  className="h-5 w-5 text-[var(--brand-light)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[var(--brand)]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{feature.desc}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
