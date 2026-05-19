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

/**
 * Founder-tweakable layout variables for the demo mockup.
 * All values in pixels. `mobile` applies below 640 px, `desktop` at 640 px and
 * above (Tailwind sm breakpoint). One file change here is enough — no Tailwind
 * class hunting needed.
 */
const DEMO_LAYOUT = {
  // Font size for the problem text (LHS operands + "= ___" RHS)
  problemFontSize: { mobile: 14, desktop: 18 },

  // Gold badge that carries the problem number
  badgeSize:     { mobile: 16, desktop: 20 },
  badgeFontSize: { mobile: 8,  desktop: 9 },

  // Fixed width of the LHS column before "=" — tuned per range so "=" signs
  // stay vertically aligned within each grid column
  lhsWidth: {
    "10":  { mobile: 48, desktop: 80 },
    "20":  { mobile: 56, desktop: 96 },
    "100": { mobile: 56, desktop: 96 },
  } as Record<DemoRange, { mobile: number; desktop: number }>,

  // Column gap and row gap BETWEEN the two columns of problems in the grid
  gap: {
    x: { mobile: 12, desktop: 18 },
    y: { mobile: 8,  desktop: 12 },
  },

  // Inner gap WITHIN a single problem: Badge | LHS | RHS
  badgeGap: { mobile: 12, desktop: 18 },

  // Vertical padding (top + bottom) of the problems body area
  bodyPadding: { mobile: 24, desktop: 32 },

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
  --demo-lhs-10: ${DEMO_LAYOUT.lhsWidth["10"].mobile}px;
  --demo-lhs-20: ${DEMO_LAYOUT.lhsWidth["20"].mobile}px;
  --demo-lhs-100: ${DEMO_LAYOUT.lhsWidth["100"].mobile}px;
  --demo-gap-x: ${DEMO_LAYOUT.gap.x.mobile}px;
  --demo-gap-y: ${DEMO_LAYOUT.gap.y.mobile}px;
  --demo-badge-gap: ${DEMO_LAYOUT.badgeGap.mobile}px;
  --demo-body-py: ${DEMO_LAYOUT.bodyPadding.mobile}px;
  --demo-grid-max: ${DEMO_LAYOUT.gridMaxWidth.mobile}px;
}
@media (min-width: 640px) {
  .demo-mockup-tune {
    --demo-fs: ${DEMO_LAYOUT.problemFontSize.desktop}px;
    --demo-badge: ${DEMO_LAYOUT.badgeSize.desktop}px;
    --demo-badge-fs: ${DEMO_LAYOUT.badgeFontSize.desktop}px;
    --demo-lhs-10: ${DEMO_LAYOUT.lhsWidth["10"].desktop}px;
    --demo-lhs-20: ${DEMO_LAYOUT.lhsWidth["20"].desktop}px;
    --demo-lhs-100: ${DEMO_LAYOUT.lhsWidth["100"].desktop}px;
    --demo-gap-x: ${DEMO_LAYOUT.gap.x.desktop}px;
    --demo-gap-y: ${DEMO_LAYOUT.gap.y.desktop}px;
    --demo-badge-gap: ${DEMO_LAYOUT.badgeGap.desktop}px;
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
    "9 - 3 = ___",
    "8 - 5 = ___",
    "7 - 4 = ___",
    "10 - 6 = ___",
    "6 - 2 = ___",
    "9 - 7 = ___",
    "5 - 3 = ___",
    "8 - 1 = ___",
    "10 - 4 = ___",
    "7 - 5 = ___",
  ],
  "10-gemischt": [
    "3 + 5 = ___",
    "1 + 8 = ___",
    "9 - 4 = ___",
    "4 + 6 = ___",
    "7 - 3 = ___",
    "10 - 2 = ___",
    "2 + 7 = ___",
    "8 - 5 = ___",
    "5 + 4 = ___",
    "6 - 1 = ___",
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
    "17 - 8 = ___",
    "14 - 6 = ___",
    "19 - 11 = ___",
    "12 - 5 = ___",
    "20 - 7 = ___",
    "15 - 9 = ___",
    "18 - 4 = ___",
    "11 - 3 = ___",
    "16 - 8 = ___",
    "13 - 7 = ___",
  ],
  "20-gemischt": [
    "17 - 5 = ___",
    "8 + 9 = ___",
    "11 + 6 = ___",
    "14 - 8 = ___",
    "20 - 12 = ___",
    "5 + 13 = ___",
    "16 - 7 = ___",
    "9 + 10 = ___",
    "7 + 12 = ___",
    "18 - 9 = ___",
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
    "87 - 34 = ___",
    "73 - 28 = ___",
    "95 - 47 = ___",
    "64 - 19 = ___",
    "81 - 55 = ___",
    "70 - 36 = ___",
    "92 - 48 = ___",
    "55 - 27 = ___",
    "78 - 43 = ___",
    "69 - 31 = ___",
  ],
  "100-gemischt": [
    "42 + 35 = ___",
    "78 - 29 = ___",
    "61 + 24 = ___",
    "17 + 68 = ___",
    "85 - 47 = ___",
    "55 + 39 = ___",
    "93 - 38 = ___",
    "72 - 54 = ___",
    "28 + 63 = ___",
    "90 - 45 = ___",
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
    <div className="demo-mockup-tune relative flex aspect-[210/297] w-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-lg">
      <style>{DEMO_CSS}</style>

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
      <div
        className="relative flex flex-1 flex-col justify-between px-5"
        style={{
          paddingTop: "var(--demo-body-py)",
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
            className="mx-auto grid grid-cols-2"
            style={{
              maxWidth: "var(--demo-grid-max)",
              columnGap: "var(--demo-gap-x)",
              rowGap: "var(--demo-gap-y)",
            }}
          >
            {problems.map((problem, i) => {
              // Split each problem into "LHS" and "RHS" around the equals sign
              // so the LHS can sit right-aligned in a fixed-width column. That
              // keeps all "=" signs vertically aligned per grid-column without
              // pushing the LHS away from the badge.
              const [lhs, rhs] = problem.split(" = ");
              return (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ gap: "var(--demo-badge-gap)" }}
                >
                  {/* Gold number badge */}
                  <span
                    className="flex shrink-0 items-center justify-center rounded-full bg-brand-accent font-bold text-brand"
                    style={{
                      width: "var(--demo-badge)",
                      height: "var(--demo-badge)",
                      fontSize: "var(--demo-badge-fs)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="font-playwrite text-right tabular-nums text-foreground"
                    style={{
                      width: `var(--demo-lhs-${range})`,
                      fontSize: "var(--demo-fs)",
                    }}
                  >
                    {lhs}
                  </span>
                  <span
                    className="font-playwrite tabular-nums text-foreground"
                    style={{ fontSize: "var(--demo-fs)" }}
                  >
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
