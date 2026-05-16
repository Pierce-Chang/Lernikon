"use client";

import { useEffect, useState } from "react";
import { Check, Dices, Calculator, Book, Brain } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { SUBJECT_COLOR_HEX, SUBJECT_LABELS } from "@/lib/worksheet/topics";
import type { SubjectId } from "@/lib/worksheet/topics";
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

/** Curated addition/subtraction problems (Unicode minus U+2212, double-underscore gap). */
const MATHE_PROBLEMS: readonly (readonly string[])[] = [
  ["3 + 5 = __", "9 − 4 = __", "7 + 2 = __"],
  ["12 − 5 = __", "4 + 7 = __", "11 − 3 = __"],
  ["8 + 6 = __", "13 − 7 = __", "5 + 9 = __"],
  ["6 + 4 = __", "10 − 6 = __", "7 + 8 = __"],
  ["11 − 4 = __", "3 + 9 = __", "14 − 8 = __"],
  ["9 + 7 = __", "12 − 7 = __", "6 + 5 = __"],
] as const;

/** Letters cycled on the Schreiblernlineatur card: uppercase then lowercase pairs. */
const DEUTSCH_LETTERS = ["A", "a", "B", "b", "C", "c", "D", "d"] as const;

/** Pattern rows: 4 shapes shown, the 5th (?) is the blank to complete. */
const DENKEN_PATTERNS: readonly (readonly string[])[] = [
  ["●", "▲", "●", "▲"],
  ["■", "●", "■", "●"],
  ["▲", "■", "▲", "■"],
  ["●", "●", "▲", "●"],
  ["▲", "▲", "■", "▲"],
  ["■", "▲", "●", "■"],
] as const;

type SubjectKey = Extract<SubjectId, "mathe" | "deutsch" | "denken">;

const SUBJECT_ICON: Record<SubjectKey, LucideIcon> = {
  mathe: Calculator,
  deutsch: Book,
  denken: Brain,
};

/** Three math problems stacked vertically. */
function MatheBody({ tickIndex }: { tickIndex: number }) {
  const problems = MATHE_PROBLEMS[tickIndex % MATHE_PROBLEMS.length];
  return (
    <div className="flex h-20 flex-col items-center justify-center gap-2 p-3 sm:h-24">
      {problems.map((line, i) => (
        <div
          key={i}
          className="text-sm tabular-nums text-foreground/80 font-mono leading-tight"
        >
          {line}
        </div>
      ))}
    </div>
  );
}

/** Single letter on a three-line Schreiblernlineatur. */
function DeutschBody({
  tickIndex,
  color,
}: {
  tickIndex: number;
  color: string;
}) {
  // ─── Lineatur tuning knobs ───────────────────────────────────────────────
  // Vertical positions of the three Schreiblernlineatur lines, as percentage
  // from the top of the body container. Move these to shift line spacing.
  const OBERLINIE_TOP = "25%";
  const MITTELLINIE_TOP = "50%";
  const GRUNDLINIE_TOP = "75%";

  // Letter rendering. Tailwind class for font-size; opacity for ghost-trace
  // feel; vertical nudge in px (negative = up, positive = down) lets you
  // align the letter baseline on the Grundlinie without rewriting layout.
  const LETTER_FONT_CLASS = "text-4xl";
  const LETTER_OPACITY = 0.65;
  const LETTER_Y_OFFSET_PX = 0;

  // Lineatur line color tint. Hex alpha suffix on the subject color.
  // Common values: 28 (~16%), 40 (~25%), 66 (~40%), 99 (~60%).
  const LINE_TINT_ALPHA = "40";
  // ─────────────────────────────────────────────────────────────────────────

  const letter = DEUTSCH_LETTERS[tickIndex % DEUTSCH_LETTERS.length];
  const lineTint = `${color}${LINE_TINT_ALPHA}`;

  return (
    <div className="relative flex h-20 items-center justify-center overflow-hidden sm:h-24">
      <div
        className="absolute left-0 right-0"
        style={{ top: OBERLINIE_TOP, height: 1, backgroundColor: lineTint }}
      />
      <div
        className="absolute left-0 right-0"
        style={{
          top: MITTELLINIE_TOP,
          height: 1,
          backgroundImage: `repeating-linear-gradient(to right, ${lineTint} 0, ${lineTint} 4px, transparent 4px, transparent 8px)`,
        }}
      />
      <div
        className="absolute left-0 right-0"
        style={{ top: GRUNDLINIE_TOP, height: 1, backgroundColor: lineTint }}
      />
      <span
        className={`relative ${LETTER_FONT_CLASS} leading-none`}
        style={{
          color,
          opacity: LETTER_OPACITY,
          transform: `translateY(${LETTER_Y_OFFSET_PX}px)`,
        }}
      >
        {letter}
      </span>
    </div>
  );
}

/** Four shapes in a row followed by a bordered ? box. */
function DenkenBody({
  tickIndex,
  color,
}: {
  tickIndex: number;
  color: string;
}) {
  const shapes = DENKEN_PATTERNS[tickIndex % DENKEN_PATTERNS.length];
  return (
    <div className="flex h-20 items-center justify-center gap-1.5 p-3 sm:h-24">
      {shapes.map((shape, i) => (
        <span
          key={i}
          className="text-xl leading-none"
          style={{ color }}
        >
          {shape}
        </span>
      ))}
      {/* ? box */}
      <div
        className="flex h-5 w-5 items-center justify-center rounded border text-[10px] leading-none"
        style={{ borderColor: color, color }}
      >
        ?
      </div>
    </div>
  );
}

interface CardBodyProps {
  subject: SubjectKey;
  tickIndex: number;
  color: string;
}

/** Dispatches to the subject-specific body component. */
function CardBody({ subject, tickIndex, color }: CardBodyProps) {
  if (subject === "mathe") return <MatheBody tickIndex={tickIndex} />;
  if (subject === "deutsch")
    return <DeutschBody tickIndex={tickIndex} color={color} />;
  return <DenkenBody tickIndex={tickIndex} color={color} />;
}

interface SheetCardProps {
  subject: SubjectKey;
  tickIndex: number;
  reducedMotion: boolean;
}

/** Mini fake-worksheet card with subject-colored header and cycling subject content. */
function SheetCard({ subject, tickIndex, reducedMotion }: SheetCardProps) {
  const color = SUBJECT_COLOR_HEX[subject],
    label = SUBJECT_LABELS[subject],
    Icon = SUBJECT_ICON[subject];

  const body = (
    <CardBody subject={subject} tickIndex={tickIndex} color={color} />
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

      {/* Cycling subject body — cross-fade between variations */}
      {reducedMotion ? (
        body
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={tickIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {body}
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
  const [tickIndex, setTickIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setTickIndex((prev) => prev + 1);
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
                tickIndex={tickIndex}
                reducedMotion={prefersReducedMotion}
              />
            </Reveal>
            <Reveal delay={0.15} className="relative z-10">
              <SheetCard
                subject="deutsch"
                tickIndex={tickIndex}
                reducedMotion={prefersReducedMotion}
              />
            </Reveal>
            <Reveal
              delay={0.25}
              className="absolute right-0 top-4 z-0 rotate-[2deg] opacity-60"
            >
              <SheetCard
                subject="denken"
                tickIndex={tickIndex}
                reducedMotion={prefersReducedMotion}
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
