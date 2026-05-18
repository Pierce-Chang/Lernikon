import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { MODUS_SUBTITLES, type BruecheModus } from "./config";
import type {
  BruecheProblem,
  DarstellenProblem,
  VergleichenProblem,
  RechnenProblem,
} from "./generate";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "@/lib/worksheet/theme-decoration";

const LOGO_LOCKUP_BUFFER = fs.readFileSync(
  path.join(
    process.cwd(),
    "public",
    "logos",
    "paperplane",
    "png",
    "lockup-horizontal-navy-800.png",
  ),
);

// Kid-display font: single-storey German schoolbook print script (Grundschrift).
// Multi-char <Text> renders cleanly — no shaping bug unlike PlaywriteDESAS.
Font.register({
  family: "PlaywriteDEGrund",
  src: path.join(
    process.cwd(),
    "public",
    "fonts",
    "PlaywriteDEGrund-Regular.ttf",
  ),
});

// ── Brand palette ─────────────────────────────────────────────────────────────
const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  shaded: "#1E4A7C",
  outline: "#1E4A7C",
  blank: "#9CA3AF",
} as const;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingLeft: 52,
    paddingRight: 52,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  brand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandDomain: {
    fontSize: 8,
    color: COLOR.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: COLOR.textDark,
  },
  subtitle: {
    fontSize: 11,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
  },
  metaCol: {
    alignItems: "flex-end",
  },
  metaLabel: {
    fontSize: 9,
    color: COLOR.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 12,
    color: COLOR.textDark,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
    marginBottom: 8,
  },
  // ── grids ─────────────────────────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellHalf: {
    width: "50%",
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  cellInner: {
    padding: 12,
    borderWidth: 0.75,
    borderStyle: "dotted",
    borderColor: COLOR.line,
    borderRadius: 6,
    alignItems: "center",
  },
  answerInner: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  problemLabel: {
    fontSize: 8,
    color: COLOR.textMuted,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  // ── vergleichen / rechnen row layout ──────────────────────────────────────
  rowGrid: {
    flexDirection: "column",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.line,
  },
  rowIndex: {
    fontSize: 9,
    color: COLOR.textMuted,
    fontFamily: "Helvetica-Bold",
    width: 18,
  },
  rowSpacer: {
    width: 10,
  },
  // ── footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 22,
    left: 52,
    right: 52,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLOR.line,
    flexDirection: "column",
    alignItems: "center",
  },
  footerLogo: {
    width: 92,
    height: 22,
  },
  footerWatermark: {
    fontSize: 7,
    color: COLOR.textMuted,
    letterSpacing: 0.5,
    marginTop: 6,
  },
});

// ── Bruch fraction primitive ──────────────────────────────────────────────────

type BruchSize = "sm" | "md" | "lg";

const BRUCH_SIZES: Record<BruchSize, { fontSize: number; barWidth: number; barThick: number }> = {
  sm: { fontSize: 10, barWidth: 16, barThick: 0.75 },
  md: { fontSize: 14, barWidth: 22, barThick: 1 },
  lg: { fontSize: 20, barWidth: 32, barThick: 1.5 },
};

/**
 * Stacked fraction rendered as View+Text so it works reliably across modes.
 * The bar is a thin View between the numerator and denominator.
 */
const Bruch = ({
  n,
  d,
  size = "md",
  color = COLOR.textDark,
}: {
  n: number;
  d: number;
  size?: BruchSize;
  color?: string;
}): ReactElement => {
  const { fontSize, barWidth, barThick } = BRUCH_SIZES[size];
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize, fontFamily: "PlaywriteDEGrund", color }}>{String(n)}</Text>
      <View
        style={{
          width: barWidth,
          height: barThick,
          backgroundColor: color,
          marginTop: 1,
          marginBottom: 1,
        }}
      />
      <Text style={{ fontSize, fontFamily: "PlaywriteDEGrund", color }}>{String(d)}</Text>
    </View>
  );
};

/**
 * Blank fraction slot — only the Bruchstrich, with transparent spacers above and below.
 * Used on the Aufgabenblatt for the answer area.
 */
const BruchBlank = ({ size = "lg" }: { size?: BruchSize }): ReactElement => {
  const { fontSize, barWidth, barThick } = BRUCH_SIZES[size];
  return (
    <View style={{ alignItems: "center" }}>
      {/* Top spacer — preserves slot height, no ink mark */}
      <View style={{ height: fontSize }} />
      {/* Fraction bar */}
      <View
        style={{
          width: barWidth,
          height: barThick,
          backgroundColor: COLOR.textDark,
          marginTop: 2,
          marginBottom: 2,
        }}
      />
      {/* Bottom spacer — preserves slot height, no ink mark */}
      <View style={{ height: fontSize }} />
    </View>
  );
};

/**
 * Comparison operator slot — a square box between the two Brueche.
 * Pass `answer` to print the operator inside (Loesungsblatt); omit for the empty box (Aufgabenblatt).
 */
const OpBlank = ({ answer }: { answer?: string }): ReactElement => (
  <View style={{ alignItems: "center", justifyContent: "center", width: 28 }}>
    <View
      style={{
        width: 22,
        height: 22,
        borderWidth: 1,
        borderColor: COLOR.brand,
        borderRadius: 2,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {answer !== undefined && (
        <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold", color: COLOR.brand }}>
          {answer}
        </Text>
      )}
    </View>
  </View>
);

// ── SVG shapes for Darstellen mode ───────────────────────────────────────────

/** Converts polar coords (r, angle in radians) to Cartesian relative to (cx, cy). */
const polarToCartesian = (
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } => ({
  x: cx + r * Math.sin(angleRad),
  y: cy - r * Math.cos(angleRad),
});

/**
 * Builds an SVG arc path for a single pie sector.
 * Angles are measured clockwise from 12 o'clock (top).
 * Uses the SVG A (arc) command with correct large-arc-flag.
 */
const pieSectorPath = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string => {
  const start = polarToCartesian(cx, cy, r, startAngle),
    end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  // M center, L start, A arc to end, Z close (back to center for filled sector)
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    "Z",
  ].join(" ");
};

/** Builds the full-circle outline path. */
const circleOutlinePath = (cx: number, cy: number, r: number): string =>
  `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${(cx - 0.001).toFixed(3)} ${(cy - r).toFixed(3)} Z`;

/**
 * Kreis (pie chart style) with shaded numerator/denominator sectors.
 * Layer order:
 *   1. All sectors with navy stroke — gives every cell a visible outline.
 *   2. White radial dividers only between adjacent shaded sectors (i+1 < numerator)
 *      — makes stacked shaded sectors individually countable without hiding unshaded outlines.
 *   3. Navy outer circle — keeps the outer edge crisp regardless of divider layer.
 */
const KreisDarstellung = ({
  numerator,
  denominator,
  size = 80,
}: {
  numerator: number;
  denominator: number;
  size?: number;
}): ReactElement => {
  const cx = size / 2,
    cy = size / 2,
    r = (size / 2) * 0.82; // leave a small margin

  const sectorAngle = (2 * Math.PI) / denominator;

  // All sector paths with their fill; stroke applied uniformly in JSX.
  const allSectors: Array<{ d: string; shaded: boolean }> = Array.from(
    { length: denominator },
    (_, i) => {
      const start = i * sectorAngle,
        end = (i + 1) * sectorAngle;
      return { d: pieSectorPath(cx, cy, r, start, end), shaded: i < numerator };
    },
  );

  // White radial dividers only at shaded-shaded boundaries: between sector i and i+1
  // where i+1 < numerator (i.e. both sides are shaded).
  const shadedDividers: Array<{ x1: number; y1: number; x2: number; y2: number }> =
    Array.from({ length: numerator > 0 ? numerator - 1 : 0 }, (_, i) => {
      // Boundary angle between shaded sector i and shaded sector i+1
      const angle = (i + 1) * sectorAngle;
      const edge = polarToCartesian(cx, cy, r, angle);
      return { x1: cx, y1: cy, x2: edge.x, y2: edge.y };
    });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Layer 1: all sectors — navy stroke gives every cell a visible outline */}
      {allSectors.map(({ d, shaded }, i) => (
        <Path
          key={`sec${i}`}
          d={d}
          fill={shaded ? COLOR.shaded : "#FFFFFF"}
          stroke={COLOR.outline}
          strokeWidth={1}
        />
      ))}
      {/* Layer 2: white radial dividers at shaded-shaded boundaries only */}
      {shadedDividers.map(({ x1, y1, x2, y2 }, i) => (
        <Path
          key={`div${i}`}
          d={`M ${x1} ${y1} L ${x2.toFixed(3)} ${y2.toFixed(3)}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
        />
      ))}
      {/* Layer 3: navy circle outline — drawn last to keep the outer edge crisp */}
      <Path
        d={circleOutlinePath(cx, cy, r)}
        fill="none"
        stroke={COLOR.outline}
        strokeWidth={1}
      />
    </Svg>
  );
};

/**
 * Rechteck divided into equal vertical strips.
 * First `numerator` strips are shaded.
 * Layer order:
 *   1. All strips with navy stroke — gives every strip a visible outline.
 *   2. White vertical dividers only at shaded-shaded boundaries (i+1 < numerator)
 *      — makes stacked shaded strips individually countable without hiding unshaded outlines.
 *   3. Navy outer border — keeps the outer edge crisp regardless of divider layer.
 */
const RechteckDarstellung = ({
  numerator,
  denominator,
  width = 88,
  height = 40,
}: {
  numerator: number;
  denominator: number;
  width?: number;
  height?: number;
}): ReactElement => {
  const stripW = width / denominator;

  const strips = Array.from({ length: denominator }, (_, i) => ({
    x: i * stripW,
    shaded: i < numerator,
  }));

  // White dividers only at shaded-shaded boundaries: between strip i and strip i+1
  // where i+1 < numerator (i.e. both sides are shaded).
  const shadedDividerXs: number[] = Array.from(
    { length: numerator > 0 ? numerator - 1 : 0 },
    (_, i) => (i + 1) * stripW,
  );

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Layer 1: all strips — navy stroke gives every strip a visible outline */}
      {strips.map(({ x, shaded }, i) => (
        <Path
          key={i}
          d={`M ${x.toFixed(3)} 0 L ${(x + stripW).toFixed(3)} 0 L ${(x + stripW).toFixed(3)} ${height} L ${x.toFixed(3)} ${height} Z`}
          fill={shaded ? COLOR.shaded : "#FFFFFF"}
          stroke={COLOR.outline}
          strokeWidth={1}
        />
      ))}
      {/* Layer 2: white vertical dividers at shaded-shaded boundaries only */}
      {shadedDividerXs.map((x, i) => (
        <Path
          key={`div${i}`}
          d={`M ${x.toFixed(3)} 0 L ${x.toFixed(3)} ${height}`}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
        />
      ))}
      {/* Layer 3: navy outer border — drawn last to keep the outer edge crisp */}
      <Path
        d={`M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`}
        fill="none"
        stroke={COLOR.outline}
        strokeWidth={1}
      />
    </Svg>
  );
};

// ── Darstellen cell ───────────────────────────────────────────────────────────

const DarstellenCell = ({
  problem,
  index,
  showAnswer,
}: {
  problem: DarstellenProblem;
  index: number;
  showAnswer: boolean;
}): ReactElement => {
  const innerStyle = showAnswer ? styles.answerInner : styles.cellInner;
  return (
    <View style={styles.cellHalf} wrap={false}>
      <View style={innerStyle}>
        <Text style={styles.problemLabel}>{index + 1}.</Text>
        {/* Shape */}
        {problem.shape === "kreis" ? (
          <KreisDarstellung
            numerator={problem.numerator}
            denominator={problem.denominator}
            size={78}
          />
        ) : (
          <RechteckDarstellung
            numerator={problem.numerator}
            denominator={problem.denominator}
            width={90}
            height={38}
          />
        )}
        {/* Answer slot — blank on Aufgabenblatt, filled on Loesungsblatt */}
        <View style={{ marginTop: 8 }}>
          {showAnswer ? (
            <Bruch
              n={problem.numerator}
              d={problem.denominator}
              size="lg"
              color={COLOR.brand}
            />
          ) : (
            <BruchBlank size="lg" />
          )}
        </View>
      </View>
    </View>
  );
};

// ── Vergleichen row ───────────────────────────────────────────────────────────

/**
 * A single vergleichen problem rendered inside a card cell.
 * Used in the 2-up grid so two problems share one row.
 */
const VergleichenCell = ({
  problem,
  index,
  showAnswer,
}: {
  problem: VergleichenProblem;
  index: number;
  showAnswer: boolean;
}): ReactElement => {
  const innerStyle = showAnswer ? styles.answerInner : styles.cellInner;
  return (
    <View style={styles.cellHalf} wrap={false}>
      <View style={innerStyle}>
        <Text style={styles.problemLabel}>{index + 1}.</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Bruch n={problem.left.n} d={problem.left.d} size="md" />
          <View style={{ width: 10 }} />
          <OpBlank answer={showAnswer ? problem.answer : undefined} />
          <View style={{ width: 10 }} />
          <Bruch n={problem.right.n} d={problem.right.d} size="md" />
        </View>
      </View>
    </View>
  );
};

// ── Rechnen cell (2-up grid) ──────────────────────────────────────────────────

/**
 * A single rechnen problem rendered inside a card cell.
 * Used in the 2-up grid so two problems share one row.
 */
const RechnenCell = ({
  problem,
  index,
  showAnswer,
}: {
  problem: RechnenProblem;
  index: number;
  showAnswer: boolean;
}): ReactElement => {
  const innerStyle = showAnswer ? styles.answerInner : styles.cellInner;
  return (
    <View style={styles.cellHalf} wrap={false}>
      <View style={innerStyle}>
        <Text style={styles.problemLabel}>{index + 1}.</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Bruch n={problem.left.n} d={problem.left.d} size="md" />
          <View style={{ width: 4 }} />
          <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: COLOR.textDark }}>
            {problem.op}
          </Text>
          <View style={{ width: 4 }} />
          <Bruch n={problem.right.n} d={problem.right.d} size="md" />
          <View style={{ width: 4 }} />
          <Text style={{ fontSize: 14, fontFamily: "Helvetica", color: COLOR.textDark }}>=</Text>
          <View style={{ width: 4 }} />
          {showAnswer ? (
            <Bruch n={problem.resultN} d={problem.resultD} size="md" color={COLOR.brand} />
          ) : (
            <BruchBlank size="md" />
          )}
        </View>
      </View>
    </View>
  );
};

// ── Page body (shared between Aufgabenblatt and Loesungsblatt) ────────────────

const PageBody = ({
  problems,
  modus,
  showAnswer,
}: {
  problems: BruecheProblem[];
  modus: BruecheModus;
  showAnswer: boolean;
}): ReactElement => {
  if (modus === "darstellen") {
    return (
      <View style={styles.grid}>
        {problems.map((p, i) => (
          <DarstellenCell
            key={i}
            problem={p as DarstellenProblem}
            index={i}
            showAnswer={showAnswer}
          />
        ))}
      </View>
    );
  }

  if (modus === "vergleichen") {
    return (
      <View style={styles.grid}>
        {problems.map((p, i) => (
          <VergleichenCell
            key={i}
            problem={p as VergleichenProblem}
            index={i}
            showAnswer={showAnswer}
          />
        ))}
      </View>
    );
  }

  // modus === "rechnen"
  return (
    <View style={styles.grid}>
      {problems.map((p, i) => (
        <RechnenCell
          key={i}
          problem={p as RechnenProblem}
          index={i}
          showAnswer={showAnswer}
        />
      ))}
    </View>
  );
};

// ── Header ────────────────────────────────────────────────────────────────────

const PageHeader = ({
  childName,
  date,
  subtitle,
  isLoesungen,
}: {
  childName: string;
  date: string;
  subtitle: string;
  isLoesungen: boolean;
}): ReactElement => (
  <View style={styles.header}>
    <View>
      <Text style={styles.brand}>Lernikon</Text>
      <Text style={styles.brandDomain}>lernikon.de</Text>
      <Text style={styles.title}>{isLoesungen ? "Losungen" : "Bruche"}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <View style={styles.metaCol}>
      <Text style={styles.metaLabel}>Name</Text>
      <Text style={styles.metaValue}>{childName}</Text>
      <Text style={styles.metaLabel}>Datum</Text>
      <Text style={styles.metaValue}>{date}</Text>
    </View>
  </View>
);

// ── Footer ────────────────────────────────────────────────────────────────────

const PageFooter = ({ showWatermark }: { showWatermark: boolean }): ReactElement => (
  <View style={styles.footer} fixed>
    <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
    {showWatermark && (
      <Text style={styles.footerWatermark}>
        Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes
      </Text>
    )}
  </View>
);

// ── Document ──────────────────────────────────────────────────────────────────

export interface BruechePdfProps {
  childName: string;
  date: string;
  problems: BruecheProblem[];
  modus: BruecheModus;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const BruecheDocument = ({
  childName,
  date,
  problems,
  modus,
  theme,
  showWatermark,
  includeSolutions,
}: BruechePdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    subtitle = MODUS_SUBTITLES[modus];

  return (
    <Document
      title={`Bruche fur ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      {/* Page 1 — Aufgabenblatt */}
      <Page size="A4" style={styles.page}>
<ThemeDecoration theme={themeMeta} />
        <PageHeader
          childName={childName}
          date={date}
          subtitle={subtitle}
          isLoesungen={false}
        />
        <PageBody problems={problems} modus={modus} showAnswer={false} />
        <PageFooter showWatermark={showWatermark} />
      </Page>

      {/* Page 2 — Loesungsblatt (optional) */}
      {includeSolutions && (
        <Page size="A4" style={styles.page}>
    <ThemeDecoration theme={themeMeta} />
          <PageHeader
            childName={childName}
            date={date}
            subtitle={subtitle}
            isLoesungen={true}
          />
          <PageBody problems={problems} modus={modus} showAnswer={true} />
          <PageFooter showWatermark={showWatermark} />
        </Page>
      )}
    </Document>
  );
};

/**
 * Renders the Brueche worksheet to a Node Readable stream.
 */
export const renderBruechePdf = async (
  props: BruechePdfProps,
): Promise<NodeJS.ReadableStream> => renderToStream(<BruecheDocument {...props} />);
