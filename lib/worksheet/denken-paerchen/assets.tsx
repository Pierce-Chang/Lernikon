/**
 * SVG assets for the Pärchen-Such worksheet (denken-paerchen).
 * Each component renders inside a React-PDF Svg at a standardised
 * 0 0 100 100 viewBox so all 10 objects are interchangeable at the
 * same rendered size.
 *
 * Variants:
 *   color     — fully coloured, navy stroke 2
 *   shadow    — solid dark silhouette #1F2937, no outline details
 *   leftHalf  — only the left half visible (x < 50), clipped
 *   rightHalf — only the right half visible (x > 50), clipped
 *
 * ClipPath strategy: all objects use a <ClipPath> rect for half-variants
 * rather than hand-split paths. This guarantees a crisp vertical cut at
 * x=50 regardless of how complex the path geometry is.
 *
 * [decision] ClipPath used for every object (not per-object selection):
 * uniform approach avoids subtle off-by-one seams at the symmetry axis
 * when paths are composed of multiple sub-shapes. Trade-off: very slightly
 * more markup, but zero risk of gap at x=50.
 */

import { Circle, ClipPath, Defs, G, Path, Polygon, Rect, Svg } from "@react-pdf/renderer";
import type { ReactElement } from "react";

// ── Shared palette (verbindlich per spec) ─────────────────────────────────────
const C = {
  outline: "#1E4A7C",
  gold: "#F4B942",
  red: "#DC2626",
  green: "#16A34A",
  blue: "#3B82F6",
  pink: "#F5A8C8",
  yellow: "#FACC15",
  brown: "#A16207",
  lightBlue: "#BFDBFE",
  shadow: "#1F2937",
  white: "#FFFFFF",
} as const;

const SW = 2; // standard stroke width (numeric)

// ── Variant type ──────────────────────────────────────────────────────────────

export type PaerchenVariant = "color" | "shadow" | "leftHalf" | "rightHalf";

// ── ClipPath IDs — must be unique within a single PDF document.
// We suffix with the object id so multiple instances on a page don't collide.
const leftId = (id: string) => `pl-${id}`;
const rightId = (id: string) => `pr-${id}`;

/**
 * Wraps content in a Svg + Defs + two ClipPath rects.
 * For color/shadow variants, clipId is undefined and no clip is applied.
 */
const SvgWrapper = ({
  id,
  size,
  variant,
  children,
}: {
  id: string;
  size: number;
  variant: PaerchenVariant;
  children: ReactElement | ReactElement[];
}): ReactElement => {
  const clipId = variant === "leftHalf" ? leftId(id) : variant === "rightHalf" ? rightId(id) : undefined;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <ClipPath id={leftId(id)}>
          <Rect x={0} y={0} width={50} height={100} />
        </ClipPath>
        <ClipPath id={rightId(id)}>
          <Rect x={50} y={0} width={50} height={100} />
        </ClipPath>
      </Defs>
      {clipId ? (
        <G clipPath={`url(#${clipId})`}>{children}</G>
      ) : (
        <G>{children}</G>
      )}
    </Svg>
  );
};

// ── Helper: fill + stroke based on variant ────────────────────────────────────

/** Returns fill/stroke props for a primary shape element. */
const shapeProps = (variant: PaerchenVariant, fill: string) =>
  variant === "shadow"
    ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
    : { fill, stroke: C.outline, strokeWidth: SW };

/** Returns props for a detail element (e.g. window, leaf) that is hidden in shadow. */
const detailProps = (variant: PaerchenVariant, fill: string, stroke = C.outline) =>
  variant === "shadow"
    ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
    : { fill, stroke, strokeWidth: SW };

// ── 1. Stern ──────────────────────────────────────────────────────────────────

/**
 * Five-pointed star centred at (50, 50).
 * Points computed for a canonical 5-star with outer radius 46, inner radius 19.
 */
const sternPoints = (() => {
  const cx = 50, cy = 50, outer = 46, inner = 19, n = 5;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const angle = (Math.PI / n) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
})();

export const Stern = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="stern" size={size} variant={variant}>
    <Polygon
      points={sternPoints}
      {...shapeProps(variant, C.gold)}
    />
  </SvgWrapper>
);

// ── 2. Sonne ──────────────────────────────────────────────────────────────────

/**
 * Circle with 8 evenly spaced rays.
 * Inner circle radius 28, ray inner radius 32, ray outer radius 46.
 */
const sonneRayPath = (() => {
  const cx = 50, cy = 50, r1 = 32, r2 = 46, n = 8, halfW = 0.12; // half-angle in rad
  const segs: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n - Math.PI / 2;
    const x1 = cx + r1 * Math.cos(a - halfW), y1 = cy + r1 * Math.sin(a - halfW);
    const x2 = cx + r2 * Math.cos(a), y2 = cy + r2 * Math.sin(a);
    const x3 = cx + r1 * Math.cos(a + halfW), y3 = cy + r1 * Math.sin(a + halfW);
    segs.push(`M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} Z`);
  }
  return segs.join(" ");
})();

export const Sonne = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="sonne" size={size} variant={variant}>
    {/* Rays */}
    <Path
      d={sonneRayPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.gold, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Sun disc */}
    <Circle
      cx={50}
      cy={50}
      r={28}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.yellow, stroke: C.outline, strokeWidth: SW })}
    />
  </SvgWrapper>
);

// ── 3. Herz ───────────────────────────────────────────────────────────────────

/**
 * Classic heart path centred at (50, 50).
 * Two arcs for the top lobes, a point at the bottom tip.
 */
const herzPath =
  "M 50 82 C 18 62 8 44 8 36 C 8 22 20 14 32 18 C 38 20 44 25 50 32 C 56 25 62 20 68 18 C 80 14 92 22 92 36 C 92 44 82 62 50 82 Z";

export const Herz = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="herz" size={size} variant={variant}>
    <Path d={herzPath} {...shapeProps(variant, C.red)} />
  </SvgWrapper>
);

// ── 4. Schmetterling ──────────────────────────────────────────────────────────

/**
 * Frontal butterfly: left wing + right wing (mirror), central body ellipse.
 * Left wing: a rounded-triangular bezier shape to the left of x=50.
 * Right wing: same reflected.
 */
const schmLeft =
  "M 50 38 C 42 28 18 20 12 36 C 8 48 22 62 50 62 Z";
const schmRight =
  "M 50 38 C 58 28 82 20 88 36 C 92 48 78 62 50 62 Z";
const schmBodyPath =
  "M 50 22 C 46 22 44 27 44 35 C 44 55 46 70 50 76 C 54 70 56 55 56 35 C 56 27 54 22 50 22 Z";

export const Schmetterling = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="schmetterling" size={size} variant={variant}>
    <Path d={schmLeft} {...shapeProps(variant, C.blue)} />
    <Path d={schmRight} {...shapeProps(variant, C.blue)} />
    {/* Body */}
    <Path
      d={schmBodyPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.outline, stroke: C.outline, strokeWidth: 1 })}
    />
  </SvgWrapper>
);

// ── 5. Auto (Frontalansicht) ──────────────────────────────────────────────────

/**
 * Car front view: rectangular body, windshield trapezoid, two round headlights,
 * a bumper strip. All centred at x=50.
 */
const autoBodyPath = "M 16 52 L 16 72 C 16 76 20 78 24 78 L 76 78 C 80 78 84 76 84 72 L 84 52 C 84 48 80 46 76 46 L 24 46 C 20 46 16 48 16 52 Z";
const autoWindshieldPath = "M 26 46 L 32 30 L 68 30 L 74 46 Z";
const autoGrillePath = "M 30 60 L 70 60 L 70 70 L 30 70 Z";

export const Auto = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="auto" size={size} variant={variant}>
    {/* Body */}
    <Path d={autoBodyPath} {...shapeProps(variant, C.red)} />
    {/* Windshield */}
    <Path
      d={autoWindshieldPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.lightBlue, stroke: C.outline, strokeWidth: SW })}
    />
    {/* Grille / bumper */}
    <Path
      d={autoGrillePath}
      {...detailProps(variant, C.outline, C.outline)}
    />
    {/* Left headlight */}
    <Circle
      cx={30}
      cy={55}
      r={6}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.yellow, stroke: C.outline, strokeWidth: 1.5 })}
    />
    {/* Right headlight */}
    <Circle
      cx={70}
      cy={55}
      r={6}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.yellow, stroke: C.outline, strokeWidth: 1.5 })}
    />
  </SvgWrapper>
);

// ── 6. Pilz ───────────────────────────────────────────────────────────────────

/**
 * Mushroom: rounded hat arc + rectangular centred stalk.
 * Hat is a wide semi-ellipse from x=14 to x=86, y=20 to y=62.
 * Stalk rect from x=40 to x=60, y=60 to y=86.
 * Three dot decorations on the hat.
 */
const pilzHatPath =
  "M 14 62 C 14 35 28 18 50 18 C 72 18 86 35 86 62 Z";
const pilzStalkPath = "M 40 60 L 60 60 L 60 86 L 40 86 Z";

export const Pilz = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="pilz" size={size} variant={variant}>
    {/* Stalk */}
    <Path d={pilzStalkPath} {...shapeProps(variant, C.brown)} />
    {/* Hat */}
    <Path d={pilzHatPath} {...shapeProps(variant, C.gold)} />
    {/* Dot centre */}
    <Circle
      cx={50}
      cy={40}
      r={6}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.white, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Dot left */}
    <Circle
      cx={30}
      cy={50}
      r={5}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.white, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Dot right */}
    <Circle
      cx={70}
      cy={50}
      r={5}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.white, stroke: C.outline, strokeWidth: 1 })}
    />
  </SvgWrapper>
);

// ── 7. Blume ──────────────────────────────────────────────────────────────────

/**
 * 6 petal flower with a central disc. Petals are ellipses arranged at 60° intervals.
 * Petal ellipse: rx=10, ry=20, translated to (50, 50) then rotated.
 * Using Path arcs for petal outlines to keep within the element count limit.
 */
const blumePetalPath = (() => {
  // Six petals arranged at 60° intervals around the centre (50, 50).
  // Each petal is an elongated lozenge: near-point at dist-ry from centre,
  // far-point at dist+ry, side-points at rx either side of the radial axis.
  const cx = 50, cy = 50, dist = 26, rx = 10, ry = 20, n = 6;
  const segs: string[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const pcx = cx + dist * Math.cos(angle),
      pcy = cy + dist * Math.sin(angle),
      dx = pcx - cx,
      dy = pcy - cy,
      len = Math.sqrt(dx * dx + dy * dy),
      ux = dx / len,
      uy = dy / len,
      vx = -uy,
      vy = ux,
      p0x = cx + ux * (dist - ry),
      p0y = cy + uy * (dist - ry),
      p1x = pcx + vx * rx,
      p1y = pcy + vy * rx,
      p2x = cx + ux * (dist + ry),
      p2y = cy + uy * (dist + ry),
      p3x = pcx - vx * rx,
      p3y = pcy - vy * rx;
    segs.push(
      `M ${p0x.toFixed(1)} ${p0y.toFixed(1)} ` +
      `C ${p1x.toFixed(1)} ${p1y.toFixed(1)} ${p2x.toFixed(1)} ${p2y.toFixed(1)} ${p2x.toFixed(1)} ${p2y.toFixed(1)} ` +
      `C ${p3x.toFixed(1)} ${p3y.toFixed(1)} ${p0x.toFixed(1)} ${p0y.toFixed(1)} ${p0x.toFixed(1)} ${p0y.toFixed(1)} Z`,
    );
  }
  return segs.join(" ");
})();

export const Blume = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="blume" size={size} variant={variant}>
    {/* Petals */}
    <Path d={blumePetalPath} {...shapeProps(variant, C.pink)} />
    {/* Centre disc */}
    <Circle
      cx={50}
      cy={50}
      r={14}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.yellow, stroke: C.outline, strokeWidth: SW })}
    />
  </SvgWrapper>
);

// ── 8. Ball ───────────────────────────────────────────────────────────────────

/**
 * Circle with a centred vertical stripe and highlight arc to suggest a ball.
 * Stripe from x=42 to x=58, highlight arc near top-centre.
 */
const ballHighlightPath = "M 36 34 A 22 22 0 0 1 64 34 A 10 10 0 0 0 36 34 Z";
const ballStripePath = "M 42 8 A 8 8 0 0 0 42 92 A 8 8 0 0 0 42 8 Z";

export const Ball = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="ball" size={size} variant={variant}>
    {/* Main ball circle */}
    <Circle
      cx={50}
      cy={50}
      r={42}
      {...shapeProps(variant, C.blue)}
    />
    {/* Centre vertical stripe */}
    <Path
      d={ballStripePath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.lightBlue, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Highlight lens at top-centre */}
    <Path
      d={ballHighlightPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.white, stroke: "none", strokeWidth: 0 })}
    />
  </SvgWrapper>
);

// ── 9. Apfel ──────────────────────────────────────────────────────────────────

/**
 * Apple frontal: rounded body, centred stalk at top (x=50), one symmetric leaf.
 * Body: bezier from (50, 88) round both sides.
 * Stalk: thin rect from (48, 12) to (52, 24).
 * Leaf: small teardrop centred at x=50, tilted to either side — using symmetric leaves.
 */
const apfelBodyPath =
  "M 50 28 C 30 28 14 40 14 58 C 14 74 28 88 50 88 C 72 88 86 74 86 58 C 86 40 70 28 50 28 Z";
const apfelStalkPath = "M 47 12 L 53 12 L 53 28 L 47 28 Z";
const apfelLeafLeftPath =
  "M 50 20 C 36 14 28 22 34 28 C 40 32 50 26 50 20 Z";
const apfelLeafRightPath =
  "M 50 20 C 64 14 72 22 66 28 C 60 32 50 26 50 20 Z";

export const Apfel = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="apfel" size={size} variant={variant}>
    {/* Body */}
    <Path d={apfelBodyPath} {...shapeProps(variant, C.red)} />
    {/* Stalk */}
    <Path
      d={apfelStalkPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.brown, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Left leaf */}
    <Path
      d={apfelLeafLeftPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.green, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Right leaf */}
    <Path
      d={apfelLeafRightPath}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.green, stroke: C.outline, strokeWidth: 1 })}
    />
  </SvgWrapper>
);

// ── 10. Krone ─────────────────────────────────────────────────────────────────

/**
 * Classic crown: base band + 5 upward triangular points, centred.
 * Base: rect from (12, 58) to (88, 82).
 * Three centre points and two outer points arranged symmetrically.
 * Crown path: M base-left, up through zigzag points, close.
 */
const kroneBodyPath =
  "M 12 80 L 12 58 L 26 40 L 36 58 L 50 32 L 64 58 L 74 40 L 88 58 L 88 80 Z";

export const Krone = ({
  size = 48,
  variant = "color",
}: {
  size?: number;
  variant?: PaerchenVariant;
}): ReactElement => (
  <SvgWrapper id="krone" size={size} variant={variant}>
    {/* Crown body */}
    <Path d={kroneBodyPath} {...shapeProps(variant, C.gold)} />
    {/* Centre gem */}
    <Circle
      cx={50}
      cy={62}
      r={6}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.red, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Left gem */}
    <Circle
      cx={28}
      cy={66}
      r={4}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.red, stroke: C.outline, strokeWidth: 1 })}
    />
    {/* Right gem */}
    <Circle
      cx={72}
      cy={66}
      r={4}
      {...(variant === "shadow"
        ? { fill: C.shadow, stroke: "none", strokeWidth: 0 }
        : { fill: C.red, stroke: C.outline, strokeWidth: 1 })}
    />
  </SvgWrapper>
);

// ── Registry ──────────────────────────────────────────────────────────────────

export const PAERCHEN_OBJECTS = [
  { id: "stern", label: "Stern", Component: Stern },
  { id: "sonne", label: "Sonne", Component: Sonne },
  { id: "herz", label: "Herz", Component: Herz },
  { id: "schmetterling", label: "Schmetterling", Component: Schmetterling },
  { id: "auto", label: "Auto", Component: Auto },
  { id: "pilz", label: "Pilz", Component: Pilz },
  { id: "blume", label: "Blume", Component: Blume },
  { id: "ball", label: "Ball", Component: Ball },
  { id: "apfel", label: "Apfel", Component: Apfel },
  { id: "krone", label: "Krone", Component: Krone },
] as const;

export type PaerchenObjectId = (typeof PAERCHEN_OBJECTS)[number]["id"];
