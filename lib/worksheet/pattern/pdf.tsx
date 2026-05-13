import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import {
  SHAPE_IDS,
  SHAPE_FILENAMES,
  DIFFICULTY_LABELS,
  type ShapeId,
  type Difficulty,
  type PatternMode,
} from "./config";
import type { PatternSheet, PatternRow } from "./generate";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "../theme-decoration";

// Load both the logo lockup and each shape image once at module init.
// React-PDF cannot fetch local filesystem paths — buffers must be passed directly.
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

const SHAPE_BUFFERS: Record<ShapeId, Buffer> = {
  kreis: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.kreis),
  ),
  dreieck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.dreieck),
  ),
  viereck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.viereck),
  ),
  rechteck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.rechteck),
  ),
  raute: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.raute),
  ),
  fuenfeck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.fuenfeck),
  ),
  sechseck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.sechseck),
  ),
  stern: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES.stern),
  ),
};

/** Outline (black-on-transparent silhouette) buffers for ausmalen mode. */
const SHAPE_OUTLINE_BUFFERS: Record<ShapeId, Buffer> = {
  kreis: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.kreis),
  ),
  dreieck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.dreieck),
  ),
  viereck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.viereck),
  ),
  rechteck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.rechteck),
  ),
  raute: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.raute),
  ),
  fuenfeck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.fuenfeck),
  ),
  sechseck: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.sechseck),
  ),
  stern: fs.readFileSync(
    path.join(process.cwd(), "public", "geometrics", "outlines", SHAPE_FILENAMES.stern),
  ),
};

export interface PatternPdfProps {
  childName: string;
  date: string;
  sheet: PatternSheet;
  difficulty: Difficulty;
  mode: PatternMode;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

// ── Brand palette (same as pdf.tsx and number-tracing/pdf.tsx) ─────────────
const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  accentLight: "#FEF3C7",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  writeLine: "#D1D5DB",
} as const;

const CELL_PADDING = 6, CELL_GAP = 4;

/**
 * Compute the cell size so cells fill the usable row width for the given
 * items-per-row count. Available = 483pt usable - 25pt badge column = 458pt.
 */
const computeCellSize = (itemsPerRow: number): number =>
  Math.floor((458 - itemsPerRow * CELL_GAP) / itemsPerRow);

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingLeft: 56,
    paddingRight: 56,
    fontFamily: "Helvetica",
    color: COLOR.textDark,
    backgroundColor: "#FFFFFF",
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: COLOR.brand,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 24,
    paddingBottom: 18,
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
    fontSize: 12,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
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
  // ── row layout ────────────────────────────────────────────────────────────
  // Tight marginBottom so 5 rows + cutout strip can fit on a single page.
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  numberBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: COLOR.accent,
    color: COLOR.brand,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 4,
    marginRight: 8,
    flexShrink: 0,
  },
  cellsRow: {
    flexDirection: "row",
  },
  // ── cells (size-independent parts only) ──────────────────────────────────
  cellBlank: {
    borderStyle: "dashed",
    borderColor: COLOR.writeLine,
  },
  cellSolution: {
    backgroundColor: COLOR.accentLight,
    borderWidth: 1.5,
    borderColor: COLOR.accent,
    borderRadius: 4,
  },
  // ── footer ─────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 22,
    left: 56,
    right: 56,
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
  // ── solution page header ───────────────────────────────────────────────────
  solutionHeader: {
    marginBottom: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  // ── cutout strip ──────────────────────────────────────────────────────────
  // Compact margins so the strip leaves room for two wrap-rows of cutouts
  // alongside 5 pattern rows on a single A4 page.
  cutoutSeparator: {
    marginTop: 8,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  cutoutScissors: {
    fontSize: 12,
    marginRight: 8,
  },
  cutoutDash: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: COLOR.writeLine,
    borderStyle: "dashed",
  },
  cutoutLabel: {
    fontSize: 8,
    color: COLOR.textMuted,
    marginRight: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cutoutGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cutoutPageHeader: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
});

/** Returns the base cell style object for a given cell size. */
const cellBaseStyle = (cellSize: number) => ({
  width: cellSize,
  height: cellSize,
  marginRight: CELL_GAP,
  borderWidth: 1,
  borderColor: COLOR.line,
  borderRadius: 4,
  alignItems: "center" as const,
  justifyContent: "center" as const,
});

/** Returns the shape image style for a given cell size. */
const shapeImageStyle = (cellSize: number) => ({
  width: cellSize - CELL_PADDING * 2,
  height: cellSize - CELL_PADDING * 2,
  objectFit: "contain" as const,
});

/** Returns the cutout cell style for a given cell size. */
const cutoutCellStyle = (cellSize: number) => ({
  width: cellSize,
  height: cellSize,
  marginRight: 6,
  marginBottom: 6,
  borderWidth: 1,
  borderColor: COLOR.writeLine,
  borderStyle: "dashed" as const,
  borderRadius: 4,
  alignItems: "center" as const,
  justifyContent: "center" as const,
});

/** Returns the cutout image style for a given cell size. */
const cutoutImageStyle = (cellSize: number) => ({
  width: cellSize - CELL_PADDING * 2 - 2,
  height: cellSize - CELL_PADDING * 2 - 2,
  objectFit: "contain" as const,
});

/** A single filled or blank cell. In ausmalen mode blank cells show the outline image. */
const PatternCell = ({
  shape,
  isBlank,
  isSolution,
  cellSize,
  mode,
}: {
  shape: ShapeId;
  isBlank: boolean;
  isSolution: boolean;
  cellSize: number;
  mode: PatternMode;
}) => {
  const base = cellBaseStyle(cellSize);

  if (isSolution) {
    return (
      <View style={[base, styles.cellSolution]}>
        <Image src={SHAPE_BUFFERS[shape]} style={shapeImageStyle(cellSize)} />
      </View>
    );
  }

  if (isBlank && mode === "ausmalen") {
    // Solid thin border — the outline image IS the visual cue; dashed border adds clutter.
    return (
      <View style={[base, { borderStyle: "solid", borderColor: COLOR.line }]}>
        <Image src={SHAPE_OUTLINE_BUFFERS[shape]} style={shapeImageStyle(cellSize)} />
      </View>
    );
  }

  if (isBlank) {
    return <View style={[base, styles.cellBlank]} />;
  }

  return (
    <View style={base}>
      <Image src={SHAPE_BUFFERS[shape]} style={shapeImageStyle(cellSize)} />
    </View>
  );
};

/** One row of cells with a number badge. */
const PatternRowView = ({
  row,
  rowIndex,
  solutionMode,
  cellSize,
  mode,
}: {
  row: PatternRow;
  rowIndex: number;
  solutionMode: boolean;
  cellSize: number;
  mode: PatternMode;
}) => (
  <View style={styles.rowContainer} wrap={false}>
    <Text style={styles.numberBadge}>{rowIndex + 1}.</Text>
    <View style={styles.cellsRow}>
      {row.items.map((shape, cellIndex) => {
        const isBlank = !solutionMode && row.blanks.includes(cellIndex),
          isSolution = solutionMode && row.blanks.includes(cellIndex);
        return (
          <PatternCell
            key={cellIndex}
            shape={shape}
            isBlank={isBlank}
            isSolution={isSolution}
            cellSize={cellSize}
            mode={mode}
          />
        );
      })}
    </View>
  </View>
);

// Page 1 available height estimate (pt):
//   A4 height 842 - paddingTop 56 - paddingBottom 64 - header ~100 - footer ~50 = ~572
const USABLE_HEIGHT = 572;

// Available row width for cutouts: A4 595pt minus 2x 56pt padding = 483pt.
const CUTOUT_ROW_WIDTH = 483;
// Each cutout cell takes cellSize + marginRight(6) horizontally.
const cutoutCellPitchH = (cellSize: number) => cellSize + 6;
// Each cutout cell takes cellSize + marginBottom(6) vertically.
const cutoutCellPitchV = (cellSize: number) => cellSize + 6;

/**
 * How many cutout rows the grid will wrap to, given the total count.
 * Accounts for `flexWrap: wrap` math so the strip height estimate matches
 * what react-pdf actually lays out.
 */
const cutoutGridRowCount = (count: number, cellSize: number): number => {
  const perRow = Math.max(1, Math.floor(CUTOUT_ROW_WIDTH / cutoutCellPitchH(cellSize)));
  return Math.ceil(count / perRow);
};

/**
 * Returns per-cell-size layout constants needed for page 1 overflow math.
 * Mirror of the actual style values:
 * - rowContainer marginBottom = 5 → rowHeight = cellSize + 5
 * - separator marginTop(8) + scissors text(~12) + marginBottom(5) ≈ 25
 * - each wrap row uses cellSize + marginBottom(6)
 */
const getLayoutConstants = (cellSize: number, cutoutCount: number) => ({
  rowHeight: cellSize + 5,
  cutoutStripHeight:
    25 + cutoutGridRowCount(cutoutCount, cellSize) * cutoutCellPitchV(cellSize),
});

/**
 * Inline cutout strip shown at the bottom of page 1 when space permits.
 * `wrap={false}` keeps the entire strip on a single page so the last
 * piece never splits onto a fresh page on its own.
 */
const CutoutStrip = ({ cutouts, cellSize }: { cutouts: ShapeId[]; cellSize: number }) => (
  <View wrap={false}>
    <View style={styles.cutoutSeparator}>
      <Text style={styles.cutoutScissors}>✂</Text>
      <Text style={styles.cutoutLabel}>Ausschneiden</Text>
      <View style={styles.cutoutDash} />
    </View>
    <View style={styles.cutoutGrid}>
      {cutouts.map((shape, i) => (
        <View key={i} style={cutoutCellStyle(cellSize)}>
          <Image src={SHAPE_BUFFERS[shape]} style={cutoutImageStyle(cellSize)} />
        </View>
      ))}
    </View>
  </View>
);

const PageFooter = ({ showWatermark }: { showWatermark: boolean }) => (
  <View style={styles.footer} fixed>
    <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
    {showWatermark && (
      <Text style={styles.footerWatermark}>
        Kostenfreie Version von lernikon.de · Family Pro entsperrt alle Themes
      </Text>
    )}
  </View>
);

const PatternDocument = ({
  childName,
  date,
  sheet,
  difficulty,
  mode,
  theme,
  showWatermark,
  includeSolutions,
}: PatternPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    cutouts = sheet.cutouts,
    itemsPerRow = sheet.rows[0]?.items.length ?? 7,
    cellSize = computeCellSize(itemsPerRow),
    { rowHeight, cutoutStripHeight } = getLayoutConstants(
      cellSize,
      cutouts?.length ?? 0,
    ),
    // Determine whether the cutout strip fits on page 1.
    // Ausmalen mode has no cutout strip.
    cutsOnPage1 =
      mode === "cutout" &&
      cutouts !== null &&
      sheet.rows.length * rowHeight + cutoutStripHeight <= USABLE_HEIGHT,
    cutsOnPage2 =
      mode === "cutout" && cutouts !== null && !cutsOnPage1;

  const pages: ReactElement[] = [];

  // Page 1 — worksheet with blank cells (and optional inline cutout strip).
  pages.push(
    <Page key="worksheet" size="A4" style={styles.page}>
      <View style={styles.topAccent} fixed />
      <ThemeDecoration theme={themeMeta} />

      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.brandDomain}>lernikon.de</Text>
          <Text style={styles.title}>Muster fortsetzen</Text>
          <Text style={styles.subtitle}>
            Muster {DIFFICULTY_LABELS[difficulty]} erkennen und fortsetzen
          </Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Name</Text>
          <Text style={styles.metaValue}>{childName}</Text>
          <Text style={styles.metaLabel}>Datum</Text>
          <Text style={styles.metaValue}>{date}</Text>
        </View>
      </View>

      {sheet.rows.map((row, i) => (
        <PatternRowView key={i} row={row} rowIndex={i} solutionMode={false} cellSize={cellSize} mode={mode} />
      ))}

      {cutsOnPage1 && cutouts !== null && <CutoutStrip cutouts={cutouts} cellSize={cellSize} />}

      <PageFooter showWatermark={showWatermark} />
    </Page>,
  );

  // Optional page 2 — overflow cutout strip.
  if (cutsOnPage2 && cutouts !== null) {
    pages.push(
      <Page key="cutouts" size="A4" style={styles.page}>
        <View style={styles.topAccent} fixed />
        <ThemeDecoration theme={themeMeta} />

        <View style={styles.cutoutPageHeader}>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.brandDomain}>lernikon.de</Text>
          <Text style={styles.title}>Ausschneiden und aufkleben</Text>
        </View>

        <CutoutStrip cutouts={cutouts} cellSize={cellSize} />

        <PageFooter showWatermark={showWatermark} />
      </Page>,
    );
  }

  // Solution sheet — optional, always last.
  if (includeSolutions) {
    pages.push(
      <Page key="solutions" size="A4" style={styles.page}>
        <View style={styles.topAccent} fixed />
        <ThemeDecoration theme={themeMeta} />

        <View style={styles.solutionHeader}>
          <Text style={styles.brand}>Lernikon</Text>
          <Text style={styles.brandDomain}>lernikon.de</Text>
          <Text style={styles.title}>Loesungen</Text>
          <Text style={styles.subtitle}>
            Muster {DIFFICULTY_LABELS[difficulty]} erkennen und fortsetzen
          </Text>
        </View>

        {sheet.rows.map((row, i) => (
          <PatternRowView key={i} row={row} rowIndex={i} solutionMode={true} cellSize={cellSize} mode={mode} />
        ))}

        <PageFooter showWatermark={showWatermark} />
      </Page>,
    );
  }

  return (
    <Document
      title={`Muster fortsetzen fuer ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      {pages}
    </Document>
  );
};

/** Renders the pattern worksheet to a Node Readable stream. */
export const renderPatternPdf = async (props: PatternPdfProps) =>
  renderToStream(<PatternDocument {...props} />);

