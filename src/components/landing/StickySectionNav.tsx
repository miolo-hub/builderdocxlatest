"use client";

import { useEffect, useState } from "react";

const sections = [
  { id: "features", label: "Overview" },
  { id: "inventory", label: "Flats" },
  { id: "sales", label: "Sales" },
  { id: "collections", label: "Payments" },
  { id: "buyers", label: "Buyers" },
  { id: "documents", label: "Papers" },
  { id: "dashboard", label: "Dashboard" },
];

export function StickySectionNav() {
  const [active, setActive] = useState<string>("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480);

      const offset = 120;
      let current = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = section.id;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <nav
      aria-label="Page sections"
      className="fixed left-1/2 top-[4.5rem] z-40 hidden -translate-x-1/2 rounded-full border border-[var(--border)] bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md lg:flex"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
            active === section.id
              ? "bg-[var(--brand)] text-white"
              : "text-[var(--muted)] hover:text-[var(--brand)]"
          }`}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
