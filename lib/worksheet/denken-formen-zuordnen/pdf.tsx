/**
 * PDF renderer for the "Formen zuordnen" worksheet.
 * Single page: two-column layout — coloured shapes left, white silhouettes right.
 * Child draws lines between matching pairs.
 */

import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import React from "react";
import type { ReactElement } from "react";
import { SHAPE_COMPONENTS } from "./shapes";
import type { FormenZuordnenSheet } from "./generate";
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

// ── Brand palette ─────────────────────────────────────────────────────────────

const COLOR = {
  brand: "#1E4A7C",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  dot: "#9CA3AF",
} as const;

// ── Layout constants ──────────────────────────────────────────────────────────

/**
 * Canvas height for the two-column layout.
 * Flow budget: paddingTop 56 + header ~109 + instruction ~38 + canvas 530
 * + paddingBottom 64 = ~797pt (A4 = 842pt). Footer is absolute, outside flow.
 */
const CANVAS_HEIGHT = 530;

/**
 * Usable width inside the page padding (595 - 52 - 52 = 491pt).
 * Left and right columns each take 40%; middle gap takes 20%.
 */
const USABLE_WIDTH = 491;
const LEFT_COL_WIDTH = Math.floor(USABLE_WIDTH * 0.4);   // 196
const MID_WIDTH = Math.floor(USABLE_WIDTH * 0.2);         // 98
const RIGHT_COL_WIDTH = USABLE_WIDTH - LEFT_COL_WIDTH - MID_WIDTH; // 197

/** Diameter of the connection dot circles. */
const DOT_SIZE = 8;
/** Radius for SVG circle in the dot. */
const DOT_R = 3;

/**
 * Shape size in pt depending on paarCount.
 * Fewer pairs -> larger shapes.
 */
const shapeSize = (paarCount: number): number => {
  if (paarCount <= 4) return 55;
  if (paarCount <= 6) return 50;
  return 45;
};

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
    marginBottom: 16,
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
  instruction: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    marginBottom: 20,
  },
  canvas: {
    position: "relative",
    height: CANVAS_HEIGHT,
    flexDirection: "row",
  },
  leftCol: {
    width: LEFT_COL_WIDTH,
    flexDirection: "column",
    justifyContent: "space-evenly",
  },
  midCol: {
    width: MID_WIDTH,
  },
  rightCol: {
    width: RIGHT_COL_WIDTH,
    flexDirection: "column",
    justifyContent: "space-evenly",
  },
  leftItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
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

// ── Sub-components ────────────────────────────────────────────────────────────

const PageHeader = ({
  childName,
  date,
  paarCount,
}: {
  childName: string;
  date: string;
  paarCount: number;
}): ReactElement => (
  <View style={styles.header}>
    <View>
      <Text style={styles.brand}>Lernikon</Text>
      <Text style={styles.brandDomain}>lernikon.de</Text>
      <Text style={styles.title}>Formen lernen</Text>
      <Text style={styles.subtitle}>{paarCount} Paare zuordnen</Text>
    </View>
    <View style={styles.metaCol}>
      <Text style={styles.metaLabel}>Name</Text>
      <Text style={styles.metaValue}>{childName}</Text>
      <Text style={styles.metaLabel}>Datum</Text>
      <Text style={styles.metaValue}>{date}</Text>
    </View>
  </View>
);

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

/** Renders the two-column worksheet layout. */
const ShapeColumns = ({
  sheet,
  paarCount,
}: {
  sheet: FormenZuordnenSheet;
  paarCount: number;
}): ReactElement => {
  const size = shapeSize(paarCount);

  return (
    <View style={styles.canvas}>
      {/* Left column — coloured shapes with right-side dot */}
      <View style={styles.leftCol}>
        {sheet.leftItems.map((item) => {
          const ShapeComp = SHAPE_COMPONENTS[item.shapeId];
          return (
            <View key={item.id} style={styles.leftItem}>
              {React.createElement(ShapeComp, { size, fill: item.color })}
              {/* Connection dot to the right of the shape */}
              <Svg width={DOT_SIZE} height={DOT_SIZE} style={{ marginLeft: 8 }}>
                <CircleSvg cx={DOT_R + 1} cy={DOT_R + 1} r={DOT_R} />
              </Svg>
            </View>
          );
        })}
      </View>

      {/* Middle gap — empty, child draws lines here */}
      <View style={styles.midCol} />

      {/* Right column — silhouette shapes with left-side dot */}
      <View style={styles.rightCol}>
        {sheet.rightOrder.map((shapeId, i) => {
          const ShapeComp = SHAPE_COMPONENTS[shapeId];
          return (
            <View key={i} style={styles.rightItem}>
              {/* Connection dot to the left of the shape */}
              <Svg width={DOT_SIZE} height={DOT_SIZE} style={{ marginRight: 8 }}>
                <CircleSvg cx={DOT_R + 1} cy={DOT_R + 1} r={DOT_R} />
              </Svg>
              {React.createElement(ShapeComp, {
                size,
                fill: "#FFFFFF",
                stroke: "#1E4A7C",
                strokeWidth: 2,
              })}
            </View>
          );
        })}
      </View>
    </View>
  );
};

/**
 * SVG circle helper — avoids the React-PDF string-number attr issue by
 * passing all values as numbers directly.
 */
const CircleSvg = ({
  cx,
  cy,
  r,
}: {
  cx: number;
  cy: number;
  r: number;
}): ReactElement => {
  // React-PDF SVG Circle component requires numeric props.
  // We build a tiny Path arc to mimic a filled circle reliably.
  const d = [
    `M ${cx - r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx + r} ${cy}`,
    `A ${r} ${r} 0 1 0 ${cx - r} ${cy}`,
    "Z",
  ].join(" ");
  return (
    <Path d={d} fill="#FFFFFF" stroke={COLOR.dot} strokeWidth={1} />
  );
};

// ── Document ──────────────────────────────────────────────────────────────────

export interface FormenZuordnenPdfProps {
  childName: string;
  date: string;
  sheet: FormenZuordnenSheet;
  paarCount: number;
  theme: ThemeId;
  showWatermark: boolean;
}

const FormenZuordnenDocument = ({
  childName,
  date,
  sheet,
  paarCount,
  theme,
  showWatermark,
}: FormenZuordnenPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);

  return (
    <Document
      title={`Formen zuordnen fur ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      <Page size="A4" style={styles.page}>
        <ThemeDecoration theme={themeMeta} />
        <PageHeader
          childName={childName}
          date={date}
          paarCount={paarCount}
        />
        <Text style={styles.instruction}>
          Was passt zusammen? Verbinde die Paare mit einer Linie!
        </Text>
        <ShapeColumns sheet={sheet} paarCount={paarCount} />
        <PageFooter showWatermark={showWatermark} />
      </Page>
    </Document>
  );
};

/**
 * Renders the Formen Zuordnen worksheet to a Node Readable stream.
 */
export const renderFormenZuordnenPdf = async (
  props: FormenZuordnenPdfProps,
): Promise<NodeJS.ReadableStream> =>
  renderToStream(<FormenZuordnenDocument {...props} />);
