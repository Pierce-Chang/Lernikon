"use client";

import { Check, Dices } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";

const PROOF_POINTS = [
  { text: "Nächste Woche dasselbe Thema, trotzdem frische Aufgaben" },
  {
    text: "Geschwister erhalten nie identische Blätter",
  },
  {
    text: "Kein Auswendiglernen der Lösungen vom letzten Mal",
  },
] as const;

const VARIANTS = {
  a: ["w-full", "w-3/4", "w-full", "w-5/6", "w-2/3"],
  b: ["w-5/6", "w-full", "w-3/4", "w-full", "w-3/4"],
  c: ["w-full", "w-2/3", "w-5/6", "w-full", "w-3/4"],
} as const;

type Variant = keyof typeof VARIANTS;

/** Mini fake-worksheet card: navy header strip, 5 stubbed task lines, footer wordmark. */
function SheetCard({ variant }: { variant: Variant }) {
  const lines = VARIANTS[variant];
  return (
    <div className="w-36 overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:w-40">
      <div className="bg-brand flex h-6 items-center px-2">
        <span className="text-[7px] font-medium tracking-wide text-white/60">
          lernikon.de
        </span>
      </div>
      <div className="flex flex-col gap-2 p-3 pb-2">
        {lines.map((w, i) => (
          <div key={i} className={`bg-brand/10 h-2 rounded-full ${w}`} />
        ))}
      </div>
      <div className="border-border/50 border-t px-2 py-1">
        <span className="text-muted-foreground text-[6px]">lernikon.de</span>
      </div>
    </div>
  );
}

const AccentLine = ({ className = "" }: { className?: string }) => (
  <div className={`bg-brand-accent h-1 w-10 rounded-full ${className}`} />
);

/** Highlights the "always fresh" differentiator with copy + a fanned card cluster. */
export function FresheSection() {
  return (
    <section className="border-y border-border bg-[#FAFAF7]">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-[2fr_3fr] lg:items-center">
          {/* Copy column */}
          <Reveal className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <Dices className="text-brand-accent mb-4 size-10" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Jedes Mal ein anderes Blatt
            </h2>
            <AccentLine className="mx-auto mt-3 lg:mx-0" />
            <p className="text-muted-foreground mt-4 text-base font-medium">
              Druckst du dasselbe Thema nochmal, kommen andere Aufgaben raus.
            </p>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              Ob dein Kind am Montag rechnet und am Wochenende nochmal übt, ob
              zwei Geschwister denselben Generator nutzen oder das Thema Wochen
              später wiederholt wird: jedes Blatt ist anders zusammengestellt.
              Kein Kind sieht dasselbe zweimal.
            </p>
            <ul className="mt-5 space-y-1.5">
              {PROOF_POINTS.map(({ text }) => (
                <li
                  key={text}
                  className="text-muted-foreground flex items-start gap-2 text-sm"
                >
                  <Check className="text-brand mt-0.5 size-4 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Card cluster column — relative container, cards absolutely positioned */}
          <div className="relative flex min-h-60 items-center justify-center">
            {/*
             * Each Reveal wraps an absolute div. The Reveal itself is also
             * absolute so the motion.div doesn't participate in block flow.
             * The centre card (b) is relative + z-10 to stay in-flow for
             * natural centring without a magic offset.
             */}
            <Reveal
              delay={0.05}
              className="absolute left-0 top-2 z-0 rotate-[-3deg] opacity-70"
            >
              <SheetCard variant="a" />
            </Reveal>
            <Reveal delay={0.15} className="relative z-10">
              <SheetCard variant="b" />
            </Reveal>
            <Reveal
              delay={0.25}
              className="absolute right-0 top-4 z-0 rotate-[2deg] opacity-60"
            >
              <SheetCard variant="c" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
