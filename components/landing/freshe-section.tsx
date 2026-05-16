"use client";

import { useEffect, useState } from "react";
import { Check, Dices, Calculator, Book, Brain } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { SUBJECT_COLOR_HEX, SUBJECT_LABELS } from "@/lib/worksheet/topics";
import type { LucideIcon } from "lucide-react";

const PROOF_POINTS = [
  { text: "Nächste Woche dasselbe Thema, trotzdem frische Aufgaben" },
  {
    text: "Geschwister erhalten nie identische Blätter",
  },
  {
    text: "Kein Auswendiglernen der Lösungen vom letzten Mal",
  },
] as const;

type SubjectKey = "mathe" | "deutsch" | "denken";

/** Width-class variants per subject. Three variations cycle in sequence. */
const VARIATIONS: Record<SubjectKey, readonly (readonly string[])[]> = {
  // Mathe = short, uniform "equation" widths
  mathe: [
    ["w-2/3", "w-3/5", "w-2/3", "w-1/2", "w-3/5"],
    ["w-3/5", "w-1/2", "w-2/3", "w-3/5", "w-1/2"],
    ["w-1/2", "w-2/3", "w-3/5", "w-2/3", "w-3/5"],
  ],
  // Deutsch = longer, variable "word/sentence" widths
  deutsch: [
    ["w-full", "w-3/4", "w-full", "w-5/6", "w-2/3"],
    ["w-5/6", "w-full", "w-3/4", "w-full", "w-3/4"],
    ["w-full", "w-2/3", "w-5/6", "w-full", "w-3/4"],
  ],
  // Denken = very uniform "pattern row" widths
  denken: [
    ["w-3/4", "w-3/4", "w-3/4", "w-3/4", "w-3/4"],
    ["w-4/5", "w-4/5", "w-4/5", "w-4/5", "w-4/5"],
    ["w-2/3", "w-2/3", "w-2/3", "w-2/3", "w-2/3"],
  ],
} as const;

const SUBJECT_ICON: Record<SubjectKey, LucideIcon> = {
  mathe: Calculator,
  deutsch: Book,
  denken: Brain,
};

interface SheetCardProps {
  subject: SubjectKey;
  variationIndex: number;
  reducedMotion: boolean;
}

/** Mini fake-worksheet card with subject-colored header and cycling task lines. */
function SheetCard({ subject, variationIndex, reducedMotion }: SheetCardProps) {
  const color = SUBJECT_COLOR_HEX[subject],
    label = SUBJECT_LABELS[subject],
    Icon = SUBJECT_ICON[subject],
    lines = VARIATIONS[subject][variationIndex],
    // Hex + "1A" = 10% opacity variant of the subject color
    lineBg = `${color}1A`;

  const linesContent = (
    <div className="flex flex-col gap-2 p-3 pb-2">
      {lines.map((w, i) => (
        <div
          key={i}
          className={`h-2 rounded-full ${w}`}
          style={{ backgroundColor: lineBg }}
        />
      ))}
    </div>
  );

  return (
    <div className="w-36 overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:w-40">
      {/* Subject-colored header */}
      <div
        className="flex h-6 items-center gap-1 px-2"
        style={{ backgroundColor: color }}
      >
        <Icon className="size-2.5 text-white" />
        <span className="text-[7px] font-medium tracking-wide text-white">
          {label}
        </span>
      </div>

      {/* Cycling task lines — cross-fade between variations */}
      {reducedMotion ? (
        linesContent
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={variationIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {linesContent}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Footer strip — unchanged */}
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
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [variationIndex, setVariationIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setVariationIndex((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

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
              <SheetCard
                subject="mathe"
                variationIndex={variationIndex}
                reducedMotion={prefersReducedMotion}
              />
            </Reveal>
            <Reveal delay={0.15} className="relative z-10">
              <SheetCard
                subject="deutsch"
                variationIndex={variationIndex}
                reducedMotion={prefersReducedMotion}
              />
            </Reveal>
            <Reveal
              delay={0.25}
              className="absolute right-0 top-4 z-0 rotate-[2deg] opacity-60"
            >
              <SheetCard
                subject="denken"
                variationIndex={variationIndex}
                reducedMotion={prefersReducedMotion}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
