"use client";

import { Reveal } from "@/components/motion/reveal";

const STATS = [
  { value: "19", label: "Themen" },
  { value: "3", label: "Fächer" },
  { value: "5", label: "Klassenstufen" },
  { value: "∞", label: "Aufgaben-Varianten" },
] as const;

/**
 * Horizontal band of four big Lexend-800 statistics.
 * Apple-style: the number is the statement, the label provides context.
 */
export function StatsBand() {
  return (
    <section
      aria-label="Lernikon auf einen Blick"
      className="border-y border-[#E5E7EB] bg-white"
    >
      <div className="mx-auto w-full max-w-[1280px] px-6 py-16">
        <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-4">
          {STATS.map(({ value, label }, i) => (
            <Reveal key={label} delay={i * 0.07} className="text-center">
              <p
                className="text-[clamp(3rem,6vw,5rem)] font-extrabold leading-none tracking-[-0.04em] text-[#1E4A7C]"
                aria-label={`${value} ${label}`}
              >
                {value}
              </p>
              <p className="mt-2 text-[0.9rem] font-medium tracking-[0.06em] text-[#6B7280] uppercase">
                {label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
