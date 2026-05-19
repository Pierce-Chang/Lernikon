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

const ANSWER_LINE = "____";

/**
 * Founder-tweakable layout variables for the demo mockup.
 * All values in pixels. `mobile` applies below 640 px, `desktop` at 640 px and
 * above (Tailwind sm breakpoint). One file change here is enough — no Tailwind
 * class hunting needed.
 */
const DEMO_LAYOUT = {
  // Font size for the problem text
  problemFontSize: { mobile: 14, desktop: 18 },

  // Gold badge that carries the problem number
  badgeSize: { mobile: 16, desktop: 20 },
  badgeFontSize: { mobile: 8, desktop: 9 },

  // Column gap and row gap BETWEEN the two columns of problems in the grid
  gap: {
    x: { mobile: 12, desktop: 28 },
    y: { mobile: 8, desktop: 12 },
  },

  // Inner gap WITHIN a single problem: Badge | equation
  problemGap: { mobile: 6, desktop: 9 },

  // Vertical padding (top + bottom) of the problems body area
  bodyPadding: { mobile: 24, desktop: 55 },

  // Max width of the two-column problem grid
  gridMaxWidth: { mobile: 280, desktop: 384 },
} as const;

/** CSS custom properties injected via a <style> tag so the layout constants
 *  above drive every responsive measurement in a single place. */
const DEMO_CSS = `
.demo-mockup-tune {
  --demo-fs: ${DEMO_LAYOUT.problemFontSize.mobile}px;
  --demo-badge: ${DEMO_LAYOUT.badgeSize.mobile}px;
  --demo-badge-fs: ${DEMO_LAYOUT.badgeFontSize.mobile}px;
  --demo-gap-x: ${DEMO_LAYOUT.gap.x.mobile}px;
  --demo-gap-y: ${DEMO_LAYOUT.gap.y.mobile}px;
  --demo-problem-gap: ${DEMO_LAYOUT.problemGap.mobile}px;
  --demo-body-py: ${DEMO_LAYOUT.bodyPadding.mobile}px;
  --demo-grid-max: ${DEMO_LAYOUT.gridMaxWidth.mobile}px;
}
@media (min-width: 640px) {
  .demo-mockup-tune {
    --demo-fs: ${DEMO_LAYOUT.problemFontSize.desktop}px;
    --demo-badge: ${DEMO_LAYOUT.badgeSize.desktop}px;
    --demo-badge-fs: ${DEMO_LAYOUT.badgeFontSize.desktop}px;
    --demo-gap-x: ${DEMO_LAYOUT.gap.x.desktop}px;
    --demo-gap-y: ${DEMO_LAYOUT.gap.y.desktop}px;
    --demo-problem-gap: ${DEMO_LAYOUT.problemGap.desktop}px;
    --demo-body-py: ${DEMO_LAYOUT.bodyPadding.desktop}px;
    --demo-grid-max: ${DEMO_LAYOUT.gridMaxWidth.desktop}px;
  }
}
`;

// Hardcoded problem strings per bucket. Each list has 10 unique problems
// (matches the real "count: 10" option in the Lernikon math generator).
// Addition: both operands and result within range max.
// Subtraction: minuend <= range max, subtrahend < minuend (never negative).
// Mixed: 5 plus + 5 minus in asymmetric order so the 2-col grid looks like
// an actually-generated mix.
const MOCK_PROBLEMS: Record<`${DemoRange}-${DemoOperation}`, string[]> = {
  "10-plus": [
    "2 + 3 = ______",
    "1 + 7 = ______",
    "4 + 5 = ______",
    "3 + 6 = ______",
    "5 + 4 = ______",
    "2 + 8 = ______",
    "6 + 3 = ______",
    "1 + 9 = ______",
    "4 + 4 = ______",
    "7 + 2 = ______",
  ],
  "10-minus": [
    "9 - 3 = ______",
    "8 - 5 = ______",
    "7 - 4 = ______",
    "10 - 6 = ______",
    "6 - 2 = ______",
    "9 - 7 = ______",
    "5 - 3 = ______",
    "8 - 1 = ______",
    "10 - 4 = ______",
    "7 - 5 = ______",
  ],
  "10-gemischt": [
    "3 + 5 = ______",
    "1 + 8 = ______",
    "9 - 4 = ______",
    "4 + 6 = ______",
    "7 - 3 = ______",
    "10 - 2 = ______",
    "2 + 7 = ______",
    "8 - 5 = ______",
    "5 + 4 = ______",
    "6 - 1 = ______",
  ],
  "20-plus": [
    "7 + 8 = ______",
    "11 + 5 = ______",
    "4 + 13 = ______",
    "9 + 9 = ______",
    "6 + 14 = ______",
    "12 + 7 = ______",
    "3 + 16 = ______",
    "8 + 11 = ______",
    "15 + 4 = ______",
    "10 + 9 = ______",
  ],
  "20-minus": [
    "17 - 8 = ______",
    "14 - 6 = ______",
    "19 - 11 = ______",
    "12 - 5 = ______",
    "20 - 7 = ______",
    "15 - 9 = ______",
    "18 - 4 = ______",
    "11 - 3 = ______",
    "16 - 8 = ______",
    "13 - 7 = ______",
  ],
  "20-gemischt": [
    "17 - 5 = ______",
    "8 + 9 = ______",
    "11 + 6 = ______",
    "14 - 8 = ______",
    "20 - 12 = ______",
    "5 + 13 = ______",
    "16 - 7 = ______",
    "9 + 10 = ______",
    "7 + 12 = ______",
    "18 - 9 = ______",
  ],
  "100-plus": [
    "23 + 45 = ______",
    "57 + 38 = ______",
    "14 + 71 = ______",
    "62 + 29 = ______",
    "35 + 54 = ______",
    "48 + 47 = ______",
    "11 + 84 = ______",
    "66 + 27 = ______",
    "39 + 51 = ______",
    "72 + 23 = ______",
  ],
  "100-minus": [
    "87 - 34 = ______",
    "73 - 28 = ______",
    "95 - 47 = ______",
    "64 - 19 = ______",
    "81 - 55 = ______",
    "70 - 36 = ______",
    "92 - 48 = ______",
    "55 - 27 = ______",
    "78 - 43 = ______",
    "69 - 31 = ______",
  ],
  "100-gemischt": [
    "42 + 35 = ______",
    "78 - 29 = ______",
    "61 + 24 = ______",
    "17 + 68 = ______",
    "85 - 47 = ______",
    "55 + 39 = ______",
    "93 - 38 = ______",
    "72 - 54 = ______",
    "28 + 63 = ______",
    "90 - 45 = ______",
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
    <div className="demo-mockup-tune border-border relative flex aspect-[210/297] w-full flex-col overflow-hidden rounded-2xl border bg-white shadow-lg">
      <style>{DEMO_CSS}</style>

      {/* Top navy accent strip — matches the real PDF */}
      <div className="bg-brand h-1.5 w-full" />

      {/* Header: brand+title left, child meta right */}
      <div className="border-border relative border-b px-5 pt-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Brand + title block */}
          <div>
            <div className="text-brand text-[9px] font-bold tracking-[0.15em] uppercase">
              Lernikon
            </div>
            <div className="text-muted-foreground text-[9px]">lernikon.de</div>
            <h3 className="text-foreground mt-2 text-lg leading-tight font-bold">Übungsblatt</h3>
            <p className="text-brand mt-0.5 text-[11px] font-semibold">
              {OPERATION_SUBTITLE[operation]} · Zahlenraum {RANGE_LABEL[range]}
            </p>
          </div>

          {/* Meta column: NAME + KLASSE */}
          <div className="text-right">
            <div className="text-muted-foreground text-[9px] tracking-wider uppercase">Name</div>
            <div className="text-foreground text-sm font-bold">{DEMO_CHILD_NAME}</div>
            <div className="text-muted-foreground mt-1.5 text-[9px] tracking-wider uppercase">
              Klasse
            </div>
            <div className="text-foreground text-sm font-bold">1. Klasse</div>
          </div>
        </div>
      </div>

      {/* Problems grid with crossfade on key change. flex-1 so it absorbs
          the remaining height inside the A4-ratio card. */}
      <div
        className="relative flex flex-1 flex-col justify-between px-5"
        style={{
          paddingBottom: "var(--demo-body-py)",
        }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-auto grid w-full flex-1 grid-cols-2 items-center"
            style={{
              maxWidth: "var(--demo-grid-max)",
              columnGap: "var(--demo-gap-x)",
              rowGap: "var(--demo-gap-y)",
              gridTemplateRows: "repeat(5, minmax(0, 1fr))",
            }}
          >
            {problems.map((problem, i) => {
              const displayProblem = problem.replace("___", ANSWER_LINE);

              return (
                <div
                  key={i}
                  className="flex min-w-0 items-center"
                  style={{ gap: "var(--demo-problem-gap)" }}
                >
                  {/* Gold number badge */}
                  <span
                    className="bg-brand-accent text-brand flex shrink-0 items-center justify-center rounded-full font-bold"
                    style={{
                      width: "var(--demo-badge)",
                      height: "var(--demo-badge)",
                      fontSize: "var(--demo-badge-fs)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="font-playwrite text-foreground min-w-0 whitespace-nowrap tabular-nums"
                    style={{ fontSize: "var(--demo-fs)" }}
                  >
                    {displayProblem}
                  </span>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Theme decoration: rocket bottom-right of the worksheet */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 bottom-2 text-3xl select-none"
        >
          🚀
        </span>
      </div>

      {/* Card footer */}
      <div className="border-border flex items-center justify-between border-t px-5 py-2">
        <span className="text-brand text-xs font-semibold">Lernikon</span>
        <span className="bg-brand-accent/20 text-brand-accent rounded-full px-2.5 py-0.5 text-[10px] font-medium">
          Demo-Ansicht
        </span>
      </div>
    </div>
  );
}
