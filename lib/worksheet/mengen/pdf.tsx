import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToStream,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { SHAPE_IDS, type ShapeId } from "./config";
import type { MengenSheet } from "./generate";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "../theme-decoration";

// Filenames under `public/geometrics/` — same as pattern/config.ts SHAPE_FILENAMES.
const SHAPE_FILENAMES: Record<ShapeId, string> = {
  kreis: "kreis_gelb.png",
  dreieck: "dreieck_grün.png",
  viereck: "viereck_grün.png",
  rechteck: "rechteck_blau.png",
  raute: "raute_blau.png",
  fuenfeck: "fünfteck_rot.png",
  sechseck: "sechseck_rot.png",
  stern: "stern_gelb.png",
};

// Load logo and all filled shape buffers once at module init.
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

const SHAPE_BUFFERS: Record<ShapeId, Buffer> = SHAPE_IDS.reduce(
  (acc, id) => {
    acc[id] = fs.readFileSync(
      path.join(process.cwd(), "public", "geometrics", SHAPE_FILENAMES[id]),
    );
    return acc;
  },
  {} as Record<ShapeId, Buffer>,
);

export interface MengenPdfProps {
  childName: string;
  date: string;
  sheet: MengenSheet;
  range: "1-5" | "1-10";
  theme: ThemeId;
  showWatermark: boolean;
}

// ── Brand palette ────────────────────────────────────────────────────────────
const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  lineLight: "#F3F4F6",
} as const;

// Grid columns per task-count setting.
const COLS_BY_COUNT: Record<number, number> = { 6: 2, 12: 3, 18: 3 };

// Shape image size per column count — more columns = smaller shapes.
const SHAPE_SIZE_BY_COLS: Record<number, number> = { 2: 36, 3: 26 };

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
    marginBottom: 20,
    paddingBottom: 16,
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
  instruction: {
    fontSize: 14,
    color: COLOR.brand,
    fontFamily: "Helvetica-Bold",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
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

/**
 * Split a quantity into rows for the shape group:
 *   quantity <= 5 -> one row
 *   quantity 6-10 -> two rows (first row 5, second row the rest)
 */
const quantityRows = (quantity: number): number[][] => {
  if (quantity <= 5) return [Array.from({ length: quantity }, (_, i) => i)];
  return [
    Array.from({ length: 5 }, (_, i) => i),
    Array.from({ length: quantity - 5 }, (_, i) => i),
  ];
};

/** One cell with the shape group on top and an empty answer box below. */
const TaskCell = ({
  shape,
  quantity,
  shapeSize,
  cellWidth,
}: {
  shape: ShapeId;
  quantity: number;
  shapeSize: number;
  cellWidth: number;
}) => {
  const rows = quantityRows(quantity);
  return (
    <View
      wrap={false}
      style={{
        width: cellWidth,
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 8,
        paddingRight: 8,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      {/* Shape group */}
      <View style={{ marginBottom: 10, alignItems: "center" }}>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{ flexDirection: "row", marginTop: rowIndex > 0 ? 4 : 0 }}
          >
            {row.map((itemIndex) => (
              <Image
                key={itemIndex}
                src={SHAPE_BUFFERS[shape]}
                style={{
                  width: shapeSize,
                  height: shapeSize,
                  marginRight: itemIndex < row.length - 1 ? 3 : 0,
                }}
              />
            ))}
          </View>
        ))}
      </View>

      {/* Answer box */}
      <View
        style={{
          width: 40,
          height: 40,
          borderWidth: 2,
          borderColor: COLOR.brand,
          borderRadius: 6,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </View>
  );
};

const PageHeader = ({
  childName,
  date,
  range,
}: {
  childName: string;
  date: string;
  range: "1-5" | "1-10";
}) => {
  const rangeMax = range === "1-5" ? 5 : 10;
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Lernikon</Text>
        <Text style={styles.brandDomain}>lernikon.de</Text>
        <Text style={styles.title}>{`Mengen 1-${rangeMax}`}</Text>
        <Text style={styles.subtitle}>Vorschule · Mathe · Mengen erkennen</Text>
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

const MengenDocument = ({
  childName,
  date,
  sheet,
  range,
  theme,
  showWatermark,
}: MengenPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    count = sheet.tasks.length,
    cols = COLS_BY_COUNT[count] ?? 3,
    shapeSize = SHAPE_SIZE_BY_COLS[cols] ?? 26,
    // Usable width: A4 595 - 2*52 padding = 491pt
    cellWidth = Math.floor(491 / cols);

  return (
    <Document
      title={`Mengen 1-${range === "1-5" ? 5 : 10} fur ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      <Page size="A4" style={styles.page}>
        <ThemeDecoration theme={themeMeta} />

        <PageHeader childName={childName} date={date} range={range} />

        <Text style={styles.instruction}>
          Wie viele sind es? Schreibe die Zahl in das Kastchen.
        </Text>

        <View style={styles.grid}>
          {sheet.tasks.map((task, i) => (
            <TaskCell
              key={i}
              shape={task.shape}
              quantity={task.quantity}
              shapeSize={shapeSize}
              cellWidth={cellWidth}
            />
          ))}
        </View>

        <PageFooter showWatermark={showWatermark} />
      </Page>
    </Document>
  );
};

/** Renders the Mengen worksheet to a Node Readable stream. */
export const renderMengenPdf = async (props: MengenPdfProps) =>
  renderToStream(<MengenDocument {...props} />);
