/**
 * PDF renderer for the "Formen erkennen" worksheet.
 * Page 1: worksheet with outline shapes scattered on the canvas.
 * Page 2 (optional): solution page with target shapes filled in brand navy.
 */

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
import React from "react";
import type { ReactElement } from "react";
import {
  SHAPE_COMPONENTS,
  SHAPE_LABELS,
  INSTRUCTION_BY_ZIEL_FORM,
  type ShapeId,
} from "./shapes";
import type { FormenSheet } from "./generate";
import { SCHWIERIGKEIT_LABELS, type Schwierigkeit } from "./config";
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
    height: 565,
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
  zielForm,
  totalCount,
  schwierigkeit,
  isLoesungen,
}: {
  childName: string;
  date: string;
  zielForm: ShapeId;
  totalCount: number;
  schwierigkeit: Schwierigkeit;
  isLoesungen: boolean;
}): ReactElement => {
  const subtitle = `${SHAPE_LABELS[zielForm]} finden · ${totalCount} Formen · ${SCHWIERIGKEIT_LABELS[schwierigkeit]}`;
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Lernikon</Text>
        <Text style={styles.brandDomain}>lernikon.de</Text>
        <Text style={styles.title}>
          {isLoesungen ? "Losungen" : "Formen erkennen"}
        </Text>
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
};

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

/** Renders all shape slots in absolute positions on the canvas. */
const ShapeCanvas = ({
  sheet,
  filled,
}: {
  sheet: FormenSheet;
  /** When true, target shapes are rendered filled (solution page). */
  filled: boolean;
}): ReactElement => (
  <View style={styles.canvas}>
    {sheet.slots.map((slot, i) => {
      const ShapeComponent = SHAPE_COMPONENTS[slot.shapeId];
      const shouldFill = filled && slot.isZiel;
      return (
        <View
          key={i}
          style={{
            position: "absolute",
            left: slot.x,
            top: slot.y,
          }}
        >
          {React.createElement(ShapeComponent, {
            size: slot.size,
            rotation: slot.rotation,
            filled: shouldFill,
          })}
        </View>
      );
    })}
  </View>
);

// ── Document ──────────────────────────────────────────────────────────────────

export interface FormenErkennenPdfProps {
  childName: string;
  date: string;
  sheet: FormenSheet;
  zielForm: ShapeId;
  totalCount: number;
  schwierigkeit: Schwierigkeit;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const FormenErkennenDocument = ({
  childName,
  date,
  sheet,
  zielForm,
  totalCount,
  schwierigkeit,
  theme,
  showWatermark,
  includeSolutions,
}: FormenErkennenPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);
  const instruction = INSTRUCTION_BY_ZIEL_FORM[zielForm];

  return (
    <Document
      title={`Formen erkennen fur ${childName}`}
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
          zielForm={zielForm}
          totalCount={totalCount}
          schwierigkeit={schwierigkeit}
          isLoesungen={false}
        />
        <Text style={styles.instruction}>{instruction}</Text>
        <ShapeCanvas sheet={sheet} filled={false} />
        <PageFooter showWatermark={showWatermark} />
      </Page>

      {/* Page 2 — Loesungsblatt (optional) */}
      {includeSolutions && (
        <Page size="A4" style={styles.page}>
          <ThemeDecoration theme={themeMeta} />
          <PageHeader
            childName={childName}
            date={date}
            zielForm={zielForm}
            totalCount={totalCount}
            schwierigkeit={schwierigkeit}
            isLoesungen={true}
          />
          <Text style={styles.instruction}>{instruction}</Text>
          <ShapeCanvas sheet={sheet} filled={true} />
          <PageFooter showWatermark={showWatermark} />
        </Page>
      )}
    </Document>
  );
};

/**
 * Renders the Formen Erkennen worksheet to a Node Readable stream.
 */
export const renderFormenErkennenPdf = async (
  props: FormenErkennenPdfProps,
): Promise<NodeJS.ReadableStream> =>
  renderToStream(<FormenErkennenDocument {...props} />);
