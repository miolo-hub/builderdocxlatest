import { AnimatedSection } from "./AnimatedSection";
import { SectionHeading, SectionLabel } from "./SectionHeader";

const services = [
  {
    num: "01",
    title: "Live Inventory Control",
    desc: "Real-time unit grids across towers and floors — prevent double bookings with instant sold, reserved, and blocked status.",
  },
  {
    num: "02",
    title: "Sales Pipeline",
    desc: "Structured lead-to-agreement workflow with site visits, token receipts, unit assignment, and connected customer history.",
  },
  {
    num: "03",
    title: "Collections Shield",
    desc: "Milestone-based payment schedules with overdue dashboards, slab reminders, and instant receipt generation on every collection.",
  },
  {
    num: "04",
    title: "Document Stack",
    desc: "Project-specific agreement templates, allotment letters, receipts, and possession documents — generated and stored per customer.",
  },
  {
    num: "05",
    title: "Central Dashboard",
    desc: "One command center for sold percentage, revenue collected, active bookings, payment dues, and agent activity across projects.",
  },
  {
    num: "06",
    title: "Customer Engine",
    desc: "WhatsApp payment reminders, construction updates, document delivery, and OTP-based portal access for every buyer.",
  },
];

export function CoreServicesSection() {
  return (
    <AnimatedSection className="landing-section-alt py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Core Services</SectionLabel>
          <SectionHeading
            title="Designed for efficient real estate operations"
            description="Modular architecture built to accelerate every project sale — from first enquiry to final collection."
          />
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <AnimatedSection
              key={service.num}
              delay={i * 50}
              className="landing-glass landing-glass-hover group rounded-2xl p-6"
            >
              <span className="font-mono text-2xl font-bold text-[var(--brand-light)]/40 transition group-hover:text-[var(--brand-light)]">
                {service.num}
              </span>
              <h3 className="mt-3 text-lg font-bold text-[var(--brand)]">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{service.desc}</p>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
