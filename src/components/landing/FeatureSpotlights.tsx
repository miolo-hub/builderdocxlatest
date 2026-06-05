import { AnimatedSection } from "./AnimatedSection";
import {
  AgentManagementMockup,
  BookingWorkflowMockup,
  ClientPortalMockup,
  DocumentHubMockup,
  PaymentTrackingMockup,
  WhatsAppMockup,
} from "./mockups";

type Spotlight = {
  id: string;
  featureNum: number;
  label: string;
  title: string;
  description: string;
  points: string[];
  mockup: React.ReactNode;
  reverse?: boolean;
};

const spotlights: Spotlight[] = [
  {
    id: "sales",
    featureNum: 2,
    label: "Sales & bookings",
    title: "Track every buyer from first call to flat booking.",
    description:
      "When a family visits the site, takes token money, or signs the agreement — it all stays on one buyer card, linked to the exact flat.",
    points: [
      "Log site visits and follow-ups",
      "Record token and booking amounts",
      "See which stage each buyer is at",
    ],
    mockup: <BookingWorkflowMockup />,
  },
  {
    id: "collections",
    featureNum: 3,
    label: "Payment collection",
    title: "Know who paid, who is due, and send receipts instantly.",
    description:
      "Set payment plans tied to construction stages. Finance sees overdue buyers at a glance — no more calling through old Excel lists.",
    points: [
      "Slab-wise due dates (foundation, structure, finishing…)",
      "Overdue list with buyer names and amounts",
      "Auto-generate payment receipts",
    ],
    mockup: <PaymentTrackingMockup />,
    reverse: true,
  },
  {
    id: "buyers",
    featureNum: 4,
    label: "Buyer updates",
    title: "Buyers get updates on WhatsApp — and check details themselves.",
    description:
      "Send payment reminders and documents on WhatsApp. Buyers also log in with OTP to see their flat, dues, and download papers — fewer calls to your office.",
    points: [
      "WhatsApp payment due reminders",
      "Construction progress photos",
      "Buyer portal with OTP login",
    ],
    mockup: (
      <div className="grid gap-4">
        <WhatsAppMockup />
        <ClientPortalMockup />
      </div>
    ),
  },
  {
    id: "documents",
    featureNum: 5,
    label: "Documents",
    title: "All agreements and receipts — filed per buyer, ready to send.",
    description:
      "Sale agreement, allotment letter, payment receipt, NOC — stored safely under each buyer's flat. Pull any document in seconds.",
    points: [
      "Organised by project and flat number",
      "Send to buyer via portal or WhatsApp",
      "Secure cloud storage",
    ],
    mockup: <DocumentHubMockup />,
    reverse: true,
  },
  {
    id: "agents",
    featureNum: 6,
    label: "Sales team",
    title: "See which agent sold how many flats — and commission owed.",
    description:
      "Track bookings and revenue per sales person. Know who is closing deals and what commission is due at month end.",
    points: [
      "Agent-wise booking count",
      "Revenue contribution per agent",
      "Commission calculation on deal value",
    ],
    mockup: <AgentManagementMockup />,
  },
];

export function FeatureSpotlights() {
  return (
    <div className="landing-section-alt space-y-0 divide-y divide-[var(--border)]">
      {spotlights.map((spotlight, i) => (
        <AnimatedSection key={spotlight.id} delay={i * 40} className="scroll-mt-28 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-14 ${
                spotlight.reverse ? "lg:[direction:rtl]" : ""
              }`}
            >
              <div className={`${spotlight.reverse ? "lg:[direction:ltr]" : ""}`}>
                <p className="landing-eyebrow mb-3">
                  Feature {spotlight.featureNum} · {spotlight.label}
                </p>
                <h3 className="landing-section-title text-left !text-2xl sm:!text-3xl">
                  {spotlight.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-[var(--muted)]">
                  {spotlight.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {spotlight.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm text-[var(--foreground)]">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`relative ${spotlight.reverse ? "lg:[direction:ltr]" : ""}`}>
                <div className="absolute -inset-3 rounded-2xl bg-teal-50/50 blur-xl" />
                <div className="relative">{spotlight.mockup}</div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      ))}
    </div>
  );
}
