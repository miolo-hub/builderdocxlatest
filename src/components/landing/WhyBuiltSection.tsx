import { AnimatedSection } from "./AnimatedSection";

const pains = [
  "Sales books a flat in one sheet — finance chases payments in another.",
  "Nobody knows which flats are actually free until someone calls the office.",
  "Buyers keep calling for receipts, agreements, and payment status.",
  "Site visits, tokens, and bookings get lost in WhatsApp groups.",
];

export function WhyBuiltSection() {
  return (
    <AnimatedSection className="landing-section-alt py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="landing-eyebrow mb-4">Sound familiar?</p>
        <h2 className="landing-section-title !text-3xl sm:!text-4xl">
          Most project teams still run on scattered tools.
        </h2>
        <ul className="mx-auto mt-10 grid max-w-xl gap-3 text-left sm:grid-cols-2">
          {pains.map((pain) => (
            <li
              key={pain}
              className="landing-glass rounded-xl px-4 py-3 text-sm leading-relaxed text-[var(--muted)]"
            >
              {pain}
            </li>
          ))}
        </ul>
      </div>
    </AnimatedSection>
  );
}
