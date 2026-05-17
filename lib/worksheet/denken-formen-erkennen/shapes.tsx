/**
 * SVG shape primitives for the "Formen erkennen" worksheet.
 * Each component renders a single geometric outline as a React-PDF Svg element.
 * Stroke is brand navy (#1E4A7C), fill is none by default.
 *
 * All SVG attribute values are numeric — React-PDF rejects string numbers.
 */

import { Circle, G, Path, Polygon, Rect, Svg } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export type ShapeId =
  | "quadrat"
  | "rechteck"
  | "kreis"
  | "dreieck"
  | "raute"
  | "stern"
  | "sechseck";

export const SHAPE_LABELS: Record<ShapeId, string> = {
  quadrat: "Quadrat",
  rechteck: "Rechteck",
  kreis: "Kreis",
  dreieck: "Dreieck",
  raute: "Raute",
  stern: "Stern",
  sechseck: "Sechseck",
};

/** Human-readable instruction per target shape. Used on the worksheet header. */
export const INSTRUCTION_BY_ZIEL_FORM: Record<ShapeId, string> = {
  quadrat: "Male alle Quadrate aus.",
  rechteck: "Male alle Rechtecke aus.",
  kreis: "Male alle Kreise aus.",
  dreieck: "Male alle Dreiecke aus.",
  raute: "Male alle Rauten aus.",
  stern: "Male alle Sterne aus.",
  sechseck: "Male alle Sechsecke aus.",
};

export const SHAPE_IDS = [
  "quadrat",
  "rechteck",
  "kreis",
  "dreieck",
  "raute",
  "stern",
  "sechseck",
] as const;

interface ShapeProps {
  size?: number;
  rotation?: number;
  /** When true the interior is filled with brand navy. Used on solution pages. */
  filled?: boolean;
}

const STROKE = "#1E4A7C";
const FILL_SOLID = "#1E4A7C";

export const Quadrat = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Rect
        x={15}
        y={15}
        width={70}
        height={70}
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

export const Rechteck = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Rect
        x={10}
        y={25}
        width={80}
        height={50}
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

export const Kreis = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Circle
        cx={50}
        cy={50}
        r={40}
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

export const Dreieck = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon
        points="50,12 88,82 12,82"
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

export const Raute = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon
        points="50,10 90,50 50,90 10,50"
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

/**
 * Compute the point string for a regular 5-pointed star.
 * outer radius 42, inner radius 18, centred at 50/50.
 */
const buildSternPoints = (): string => {
  const cx = 50, cy = 50, outerR = 42, innerR = 18, spikes = 5;
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return points.join(" ");
};

const STERN_POINTS = buildSternPoints();

export const Stern = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon
        points={STERN_POINTS}
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

export const Sechseck = ({
  size = 60,
  rotation = 0,
  filled = false,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon
        points="50,10 88,30 88,70 50,90 12,70 12,30"
        stroke={STROKE}
        strokeWidth={2}
        fill={filled ? FILL_SOLID : "none"}
      />
    </G>
  </Svg>
);

/** Map from ShapeId to its render function. */
export const SHAPE_COMPONENTS: Record<ShapeId, (props: ShapeProps) => ReactElement> = {
  quadrat: Quadrat,
  rechteck: Rechteck,
  kreis: Kreis,
  dreieck: Dreieck,
  raute: Raute,
  stern: Stern,
  sechseck: Sechseck,
};
