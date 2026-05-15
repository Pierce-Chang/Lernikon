import type { SVGProps } from "react";

/**
 * Inline SVG icon that renders the literal letters "A B C".
 * Sized to match lucide-react icons (20x20 viewBox, currentColor fill).
 * Use className / style to tint with a subject color, e.g. text-[#DC2626].
 */
export function AbcIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      width="1em"
      height="1em"
      aria-hidden="true"
      fill="currentColor"
      {...props}
    >
      <text
        x="0"
        y="14"
        fontFamily="sans-serif"
        fontWeight="700"
        fontSize="8"
        letterSpacing="0.5"
      >
        ABC
      </text>
    </svg>
  );
}
