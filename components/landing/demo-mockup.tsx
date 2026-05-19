"use client";

import { AnimatePresence, motion } from "framer-motion";

/** Allowed range values for the demo mockup. */
export type DemoRange = "10" | "20" | "100";

/** Allowed operation values for the demo mockup. */
export type DemoOperation = "plus" | "minus" | "gemischt";

/** Props for DemoMockup. */
interface DemoMockupProps {
  range: DemoRange;
  operation: DemoOperation;
}

/** Example child name shown in the mockup. Vorschule/Klasse 1 aged-name. */
const DEMO_CHILD_NAME = "Mia";

const OPERATION_SUBTITLE: Record<DemoOperation, string> = {
  plus: "Addition",
  minus: "Subtraktion",
  gemischt: "Gemischt",
};

const RANGE_LABEL: Record<DemoRange, string> = {
  "10": "1 bis 10",
  "20": "1 bis 20",
  "100": "1 bis 100",
};

// Width of the LHS-column, tuned per range so the "=" signs stay vertically
// aligned. Responsive: narrower on mobile, wider on sm+ to match text-lg.
const LHS_COL_CLASS: Record<DemoRange, string> = {
  "10": "w-12 sm:w-20",
  "20": "w-14 sm:w-24",
  "100": "w-14 sm:w-24",
};

// Hardcoded problem strings per bucket. Each list has 10 unique problems
// (matches the real "count: 10" option in the Lernikon math generator).
// Addition: both operands and result within range max.
// Subtraction: minuend <= range max, subtrahend < minuend (never negative).
// Mixed: 5 plus + 5 minus in asymmetric order so the 2-col grid looks like
// an actually-generated mix.
const MOCK_PROBLEMS: Record<`${DemoRange}-${DemoOperation}`, string[]> = {
  "10-plus": [
    "2 + 3 = ___",
    "1 + 7 = ___",
    "4 + 5 = ___",
    "3 + 6 = ___",
    "5 + 4 = ___",
    "2 + 8 = ___",
    "6 + 3 = ___",
    "1 + 9 = ___",
    "4 + 4 = ___",
    "7 + 2 = ___",
  ],
  "10-minus": [
    "9 − 3 = ___",
    "8 − 5 = ___",
    "7 − 4 = ___",
    "10 − 6 = ___",
    "6 − 2 = ___",
    "9 − 7 = ___",
    "5 − 3 = ___",
    "8 − 1 = ___",
    "10 − 4 = ___",
    "7 − 5 = ___",
  ],
  "10-gemischt": [
    "3 + 5 = ___",
    "1 + 8 = ___",
    "9 − 4 = ___",
    "4 + 6 = ___",
    "7 − 3 = ___",
    "10 − 2 = ___",
    "2 + 7 = ___",
    "8 − 5 = ___",
    "5 + 4 = ___",
    "6 − 1 = ___",
  ],
  "20-plus": [
    "7 + 8 = ___",
    "11 + 5 = ___",
    "4 + 13 = ___",
    "9 + 9 = ___",
    "6 + 14 = ___",
    "12 + 7 = ___",
    "3 + 16 = ___",
    "8 + 11 = ___",
    "15 + 4 = ___",
    "10 + 9 = ___",
  ],
  "20-minus": [
    "17 − 8 = ___",
    "14 − 6 = ___",
    "19 − 11 = ___",
    "12 − 5 = ___",
    "20 − 7 = ___",
    "15 − 9 = ___",
    "18 − 4 = ___",
    "11 − 3 = ___",
    "16 − 8 = ___",
    "13 − 7 = ___",
  ],
  "20-gemischt": [
    "17 − 5 = ___",
    "8 + 9 = ___",
    "11 + 6 = ___",
    "14 − 8 = ___",
    "20 − 12 = ___",
    "5 + 13 = ___",
    "16 − 7 = ___",
    "9 + 10 = ___",
    "7 + 12 = ___",
    "18 − 9 = ___",
  ],
  "100-plus": [
    "23 + 45 = ___",
    "57 + 38 = ___",
    "14 + 71 = ___",
    "62 + 29 = ___",
    "35 + 54 = ___",
    "48 + 47 = ___",
    "11 + 84 = ___",
    "66 + 27 = ___",
    "39 + 51 = ___",
    "72 + 23 = ___",
  ],
  "100-minus": [
    "87 − 34 = ___",
    "73 − 28 = ___",
    "95 − 47 = ___",
    "64 − 19 = ___",
    "81 − 55 = ___",
    "70 − 36 = ___",
    "92 − 48 = ___",
    "55 − 27 = ___",
    "78 − 43 = ___",
    "69 − 31 = ___",
  ],
  "100-gemischt": [
    "42 + 35 = ___",
    "78 − 29 = ___",
    "61 + 24 = ___",
    "17 + 68 = ___",
    "85 − 47 = ___",
    "55 + 39 = ___",
    "93 − 38 = ___",
    "72 − 54 = ___",
    "28 + 63 = ___",
    "90 − 45 = ___",
  ],
};

/**
 * Pure presentational mockup of a worksheet card.
 * Switches problem list when range or operation props change.
 */
export function DemoMockup({ range, operation }: DemoMockupProps) {
  const key = `${range}-${operation}` as const;
  const problems = MOCK_PROBLEMS[key];

  return (
    // A4 portrait aspect ratio (210:297) so the mockup never goes landscape
    // regardless of viewport width.
    <div className="relative flex aspect-[210/297] w-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      {/* Top navy accent strip — matches the real PDF */}
      <div className="bg-brand h-1.5 w-full" />

      {/* Header: brand+title left, child meta right */}
      <div className="relative border-b border-border px-5 pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Brand + title block */}
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-brand">
              Lernikon
            </div>
            <div className="text-[9px] text-muted-foreground">lernikon.de</div>
            <h3 className="mt-2 text-lg font-bold leading-tight text-foreground">
              Übungsblatt
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-brand">
              {OPERATION_SUBTITLE[operation]} · Zahlenraum {RANGE_LABEL[range]}
            </p>
          </div>

          {/* Meta column: NAME + KLASSE */}
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              Name
            </div>
            <div className="text-sm font-bold text-foreground">{DEMO_CHILD_NAME}</div>
            <div className="mt-1.5 text-[9px] uppercase tracking-wider text-muted-foreground">
              Klasse
            </div>
            <div className="text-sm font-bold text-foreground">1. Klasse</div>
          </div>
        </div>
      </div>

      {/* Problems grid with crossfade on key change. flex-1 so it absorbs
          the remaining height inside the A4-ratio card. justify-between
          distributes the 5 rows evenly across the full body height. */}
      <div className="relative flex flex-1 flex-col justify-between px-5 py-6 sm:py-8">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto grid max-w-[280px] grid-cols-2 gap-x-3 gap-y-2 sm:max-w-sm sm:gap-x-7 sm:gap-y-3"
          >
            {problems.map((problem, i) => {
              // Split each problem into "LHS" and "RHS" around the equals sign
              // so the LHS can sit right-aligned in a fixed-width column. That
              // keeps all "=" signs vertically aligned per grid-column without
              // pushing the LHS away from the badge.
              const [lhs, rhs] = problem.split(" = ");
              return (
                <div key={i} className="flex items-center gap-2">
                  {/* Gold number badge */}
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-brand-accent text-[8px] font-bold text-brand sm:size-5 sm:text-[9px]">
                    {i + 1}
                  </span>
                  <span
                    className={`${LHS_COL_CLASS[range]} font-playwrite text-right text-sm tabular-nums text-foreground sm:text-lg`}
                  >
                    {lhs}
                  </span>
                  <span className="font-playwrite text-sm tabular-nums text-foreground sm:text-lg">
                    = {rhs}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Theme decoration: rocket bottom-right of the worksheet */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-2 right-3 select-none text-3xl"
        >
          🚀
        </span>
      </div>

      {/* Card footer */}
      <div className="flex items-center justify-between border-t border-border px-5 py-2">
        <span className="text-xs font-semibold text-brand">Lernikon</span>
        <span className="rounded-full bg-brand-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-brand-accent">
          Demo-Ansicht
        </span>
      </div>
    </div>
  );
}
