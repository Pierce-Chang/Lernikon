import type { SVGProps } from "react";

/**
 * Open-book icon with "ABC" lettering on the inside pages.
 * Stroke-based to match lucide-react aesthetics (Calculator, Brain).
 * Sized to slot into the same 20x20 viewBox as before.
 * Use className to tint, e.g. text-[#DC2626].
 */
export function AbcIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="1em"
      height="1em"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/*
       * Open book shape:
       * - Horizontal base runs from x=1 to x=19 at y=16.
       * - Left page top curves outward: starts at spine top (10,5), arcs up and
       *   left to (1,7), then the left edge drops straight to the base corner (1,16).
       * - Right page mirrors: spine top (10,5), arcs up and right to (19,7),
       *   right edge drops to (19,16).
       * - Center spine: a short vertical line from (10,5) down to (10,16).
       * - The soft V at the top is the slight dip of (10,5) below the page corners.
       */}
      {/* Left page */}
      <path d="M10 5 Q5 4 1 7 L1 16 L10 16 Z" />
      {/* Right page */}
      <path d="M10 5 Q15 4 19 7 L19 16 L10 16 Z" />
      {/* Center spine */}
      <line x1={10} y1={5} x2={10} y2={16} />

      {/*
       * "ABC" text centered across the full spread, sitting in the middle of
       * the page area (y centre ~11). fontSize=5 keeps it comfortably inside.
       * fill="currentColor" so it inherits the same subject color.
       * stroke="none" so the letters are solid, not double-outlined.
       */}
      <text
        x={10}
        y={12}
        fontFamily="sans-serif"
        fontWeight={700}
        fontSize={5}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="currentColor"
        stroke="none"
        letterSpacing={0.3}
      >
        ABC
      </text>
    </svg>
  );
}
