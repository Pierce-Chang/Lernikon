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
import type {
  EnglischSimpleSentencesSheet,
  EnglischSimpleSentencesTask,
} from "./generate";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "@/lib/worksheet/theme-decoration";
import { PLAYWRITE_DEGRUND_FONT_PATH } from "@/lib/worksheet/outlined-grund-text";

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
// English ASCII sentences are safe through normal <Text> — no combining-mark bug.
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
  // Sentence text in kid-display font.
  sentenceText: {
    fontFamily: "PlaywriteDEGrund",
    fontSize: 12,
    color: COLOR.textDark,
  },
  // Sentence text on the solution page — brand blue.
  sentenceTextSolution: {
    fontFamily: "PlaywriteDEGrund",
    fontSize: 13,
    color: COLOR.brand,
  },
  // Infinitive hint in small italic Helvetica — identical pattern to faelle frageText.
  hintText: {
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

/**
 * One sentence item rendered as a numbered row.
 * Worksheet page: blank shown as proportional underscores + infinitive hint below.
 * Answer key: full sentence with answer in brand blue + hint below.
 */
const SentenceItem = ({
  task,
  showSolution,
}: {
  task: EnglischSimpleSentencesTask;
  showSolution: boolean;
}): ReactElement => {
  if (showSolution) {
    const filled = task.template.replace(/___/, task.answer);
    return (
      <View style={styles.cell} wrap={false}>
        <View style={styles.itemRow}>
          <Text style={styles.itemNumber}>{task.id}.</Text>
          <View style={styles.itemContent}>
            <Text style={styles.sentenceTextSolution}>{filled}</Text>
            <Text style={styles.hintText}>({task.hint})</Text>
          </View>
        </View>
      </View>
    );
  }

  // Replace the blank placeholder with proportional underscores.
  const underscoreCount = Math.max(task.answer.length + 2, 3),
    displaySentence = task.template.replace(/___/, "_".repeat(underscoreCount));

  return (
    <View style={styles.cell} wrap={false}>
      <View style={styles.itemRow}>
        <Text style={styles.itemNumber}>{task.id}.</Text>
        <View style={styles.itemContent}>
          <Text style={styles.sentenceText}>{displaySentence}</Text>
          <Text style={styles.hintText}>({task.hint})</Text>
        </View>
      </View>
    </View>
  );
};

export interface EnglischSimpleSentencesPdfProps {
  childName: string;
  date: string;
  sheet: EnglischSimpleSentencesSheet;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const EnglischSimpleSentencesDocument = ({
  childName,
  date,
  sheet,
  theme,
  showWatermark,
  includeSolutions,
}: EnglischSimpleSentencesPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);

  return (
    <Document
      title={`Simple Sentences fuer ${childName}`}
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
            <Text style={styles.title}>Simple Sentences</Text>
            <Text style={styles.subtitle}>to be (am, is, are)</Text>
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
              <Text style={styles.title}>Loesungen</Text>
              <Text style={styles.subtitle}>to be (am, is, are)</Text>
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

/** Renders the Simple Sentences worksheet to a Node.js readable stream. */
export const renderEnglischSimpleSentencesPdf = async (
  props: EnglischSimpleSentencesPdfProps,
): Promise<NodeJS.ReadableStream> =>
  renderToStream(<EnglischSimpleSentencesDocument {...props} />);
