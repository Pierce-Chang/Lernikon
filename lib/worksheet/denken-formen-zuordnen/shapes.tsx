/**
 * SVG shape primitives for the "Formen zuordnen" worksheet.
 * Each component renders a single geometric shape as a React-PDF Svg element.
 * Supports arbitrary fill colours (pastel palette) for the left column and
 * outline-only rendering (fill="none") for the right column silhouettes.
 *
 * All SVG attribute values are numeric — React-PDF rejects string numbers.
 */

import { Circle, G, Path, Polygon, Rect, Svg } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export type ShapeId =
  | "kreis"
  | "quadrat"
  | "dreieck"
  | "fuenfeck"
  | "sechseck"
  | "raute"
  | "rechteck"
  | "parallelogramm"
  | "herz"
  | "stern";

export const SHAPE_IDS = [
  "kreis",
  "quadrat",
  "dreieck",
  "fuenfeck",
  "sechseck",
  "raute",
  "rechteck",
  "parallelogramm",
  "herz",
  "stern",
] as const;

export const SHAPE_LABELS: Record<ShapeId, string> = {
  kreis: "Kreis",
  quadrat: "Quadrat",
  dreieck: "Dreieck",
  fuenfeck: "Funfeck",
  sechseck: "Sechseck",
  raute: "Raute",
  rechteck: "Rechteck",
  parallelogramm: "Parallelogramm",
  herz: "Herz",
  stern: "Stern",
};

export interface ShapeProps {
  size?: number;
  rotation?: number;
  /** Fill colour of the shape. Default "none" (outline-only / white interior). */
  fill?: string;
  /** Stroke colour. Default brand navy. */
  stroke?: string;
  /** Stroke width. Default 2. */
  strokeWidth?: number;
}

const DEFAULT_STROKE = "#1E4A7C";

export const Kreis = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Circle cx={50} cy={50} r={42} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Quadrat = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Rect x={15} y={15} width={70} height={70} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Dreieck = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon points="50,12 90,85 10,85" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

/** Regular pentagon — 5 points on a circle of r=42, starting at top (270 deg). */
const buildFuenfeckPoints = (): string => {
  const cx = 50, cy = 50, r = 42, sides = 5;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
};

const FUENFECK_POINTS = buildFuenfeckPoints();

export const Fuenfeck = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon points={FUENFECK_POINTS} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Sechseck = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon points="50,10 88,30 88,70 50,90 12,70 12,30" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Raute = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon points="50,8 90,50 50,92 10,50" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Rechteck = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Rect x={10} y={30} width={80} height={40} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Parallelogramm = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon points="20,25 90,25 80,75 10,75" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

export const Herz = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Path
        d="M 50,85 C 15,55 15,25 35,25 C 45,25 50,35 50,45 C 50,35 55,25 65,25 C 85,25 85,55 50,85 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </G>
  </Svg>
);

/** 5-pointed star — 10 points alternating outer r=42 / inner r=18, centred at 50/50. */
const buildSternPoints = (): string => {
  const cx = 50, cy = 50, outerR = 42, innerR = 18, spikes = 5;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (Math.PI / spikes) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
};

const STERN_POINTS = buildSternPoints();

export const Stern = ({
  size = 50,
  rotation = 0,
  fill = "none",
  stroke = DEFAULT_STROKE,
  strokeWidth = 2,
}: ShapeProps): ReactElement => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <G transform={`rotate(${rotation} 50 50)`}>
      <Polygon points={STERN_POINTS} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </G>
  </Svg>
);

/** Map from ShapeId to its render function. */
export const SHAPE_COMPONENTS: Record<ShapeId, (props: ShapeProps) => ReactElement> = {
  kreis: Kreis,
  quadrat: Quadrat,
  dreieck: Dreieck,
  fuenfeck: Fuenfeck,
  sechseck: Sechseck,
  raute: Raute,
  rechteck: Rechteck,
  parallelogramm: Parallelogramm,
  herz: Herz,
  stern: Stern,
};
