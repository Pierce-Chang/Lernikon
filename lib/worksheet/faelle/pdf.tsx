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
import type { FaelleSheet, FaelleTask } from "./generate";
import type { FaelleMode } from "./config";
import { MODE_SUBTITLES } from "./config";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "@/lib/worksheet/theme-decoration";
import {
  OutlinedGrundText,
  PLAYWRITE_DEGRUND_FONT_PATH,
} from "@/lib/worksheet/outlined-grund-text";

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
// React-PDF misplaces combining mark glyphs for umlauts in this font, so
// sentence text below is rendered as fontkit outlines via OutlinedGrundText.
// Never set fontWeight: "bold" on this family.
Font.register({
  family: "PlaywriteDEGrund",
  src: PLAYWRITE_DEGRUND_FONT_PATH,
});

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#E5E7EB",
  blank: "#1E4A7C",
} as const;

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
  // Two-column grid for the sentence list.
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  // Each column takes 50% of page width.
  cell: {
    width: "50%",
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  // Row inside a cell: number + sentence display.
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    width: 22,
    flexShrink: 0,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  // Helper question in small italic Helvetica.
  frageText: {
    fontSize: 9,
    color: COLOR.textMuted,
    fontFamily: "Helvetica-Oblique",
    marginTop: 3,
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

/** Fixed sentence column width in points — passed to OutlinedGrundText for line wrapping. */
const OUTLINE_TEXT_WIDTH = 205;

/**
 * One sentence item rendered as a numbered row.
 * Worksheet page: blank shown as underscored whitespace + helper question.
 * Answer key: full sentence replaced with loesung in brand blue.
 */
const SentenceItem = ({
  task,
  showSolution,
}: {
  task: FaelleTask;
  showSolution: boolean;
}): ReactElement => {
  if (showSolution) {
    // Replace the blank with the loesung in brand blue.
    const filled = task.template.replace(/_+/, task.loesung);
    return (
      <View style={styles.cell} wrap={false}>
        <View style={styles.itemRow}>
          <Text style={styles.itemNumber}>{task.id}.</Text>
          <View style={styles.itemContent}>
            <OutlinedGrundText text={filled} fontSize={13} color={COLOR.brand} width={OUTLINE_TEXT_WIDTH} />
            <Text style={styles.frageText}>({task.frage})</Text>
          </View>
        </View>
      </View>
    );
  }

  // Replace the blank placeholder with proportional underscores in one atomic string.
  const underscoreCount = Math.max(task.loesung.length + 2, 3),
    displaySentence = task.template.replace(/_+/, "_".repeat(underscoreCount));

  return (
    <View style={styles.cell} wrap={false}>
      <View style={styles.itemRow}>
        <Text style={styles.itemNumber}>{task.id}.</Text>
        <View style={styles.itemContent}>
          <OutlinedGrundText text={displaySentence} fontSize={12} color={COLOR.textDark} width={OUTLINE_TEXT_WIDTH} />
          <Text style={styles.frageText}>({task.frage})</Text>
        </View>
      </View>
    </View>
  );
};

export interface FaellePdfProps {
  childName: string;
  date: string;
  sheet: FaelleSheet;
  mode: FaelleMode;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const FaelleDocument = ({
  childName,
  date,
  sheet,
  mode,
  theme,
  showWatermark,
  includeSolutions,
}: FaellePdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    subtitle = MODE_SUBTITLES[mode];

  return (
    <Document
      title={`4 Fälle für ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      {/* Page 1 - worksheet */}
      <Page size="A4" style={styles.page}>
        <ThemeDecoration theme={themeMeta} />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Lernikon</Text>
            <Text style={styles.brandDomain}>lernikon.de</Text>
            <Text style={styles.title}>4 Fälle</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Name</Text>
            <Text style={styles.metaValue}>{childName}</Text>
            <Text style={styles.metaLabel}>Datum</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {sheet.tasks.map((task) => (
            <SentenceItem key={task.id} task={task} showSolution={false} />
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
          {showWatermark && (
            <Text style={styles.footerWatermark}>
              Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
            </Text>
          )}
        </View>
      </Page>

      {/* Page 2 - answer key (optional) */}
      {includeSolutions && (
        <Page size="A4" style={styles.page}>
          <ThemeDecoration theme={themeMeta} />

          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>Lernikon</Text>
              <Text style={styles.brandDomain}>lernikon.de</Text>
              <Text style={styles.title}>Lösungen</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Name</Text>
              <Text style={styles.metaValue}>{childName}</Text>
              <Text style={styles.metaLabel}>Datum</Text>
              <Text style={styles.metaValue}>{date}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {sheet.tasks.map((task) => (
              <SentenceItem key={task.id} task={task} showSolution={true} />
            ))}
          </View>

          <View style={styles.footer} fixed>
            <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
            {showWatermark && (
              <Text style={styles.footerWatermark}>
                Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
              </Text>
            )}
          </View>
        </Page>
      )}
    </Document>
  );
};

/** Renders the 4-Fälle worksheet to a Node.js readable stream. */
export const renderFaellePdf = async (props: FaellePdfProps): Promise<NodeJS.ReadableStream> =>
  renderToStream(<FaelleDocument {...props} />);
