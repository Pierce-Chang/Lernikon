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
import type { RechtschreibSheet, RechtschreibItem } from "./generate";
import type { RechtschreibRule } from "./config";
import { RULE_SUBTITLES, BLANK_PLACEHOLDER } from "./config";
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
  // Two-column grid for the word list.
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  // Each column takes 50% of page width.
  cell: {
    width: "50%",
    paddingRight: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  // Row inside a cell: number + word display.
  itemRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  itemNumber: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    width: 24,
    flexShrink: 0,
  },
  // The word text — inline segments for template vs solution.
  itemText: {
    fontSize: 14,
    color: COLOR.textDark,
    fontFamily: "PlaywriteDEGrund",
    flexShrink: 1,
  },
  // Blank underline segment used on page 1.
  blankUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: COLOR.blank,
    paddingBottom: 1,
    marginLeft: 0,
    marginRight: 0,
  },
  blankText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontFamily: "PlaywriteDEGrund",
    letterSpacing: 1,
  },
  // Answer text color on page 2.
  answerText: {
    fontSize: 16,
    color: COLOR.brand,
    fontFamily: "PlaywriteDEGrund",
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
 * Splits a template string (containing BLANK_PLACEHOLDER) into its parts.
 * Returns an array of { text, isBlank } segments for inline rendering.
 */
const splitTemplate = (
  template: string,
  blank: string,
): Array<{ text: string; isBlank: boolean }> => {
  const idx = template.indexOf(BLANK_PLACEHOLDER);
  if (idx === -1) return [{ text: template, isBlank: false }];
  const before = template.slice(0, idx),
    after = template.slice(idx + BLANK_PLACEHOLDER.length);
  // Build blank display: underscores matching the blank length, at least 3.
  const underscoreCount = Math.max(blank.length + 1, 3),
    underscores = "_".repeat(underscoreCount);
  const segments: Array<{ text: string; isBlank: boolean }> = [];
  if (before) segments.push({ text: before, isBlank: false });
  segments.push({ text: underscores, isBlank: true });
  if (after) segments.push({ text: after, isBlank: false });
  return segments;
};

/**
 * One word item rendered as a numbered row.
 * On the Aufgabenblatt the blank is shown as underscores with a border.
 * On the Lösungsblatt the full word is shown in brand blue.
 */
const WordItem = ({
  item,
  showSolution,
}: {
  item: RechtschreibItem;
  showSolution: boolean;
}): ReactElement => {
  if (showSolution) {
    return (
      <View style={styles.cell} wrap={false}>
        <View style={styles.itemRow}>
          <Text style={styles.itemNumber}>{item.id}.</Text>
          <Text style={styles.answerText}>{item.word}</Text>
        </View>
      </View>
    );
  }

  const segments = splitTemplate(item.template, item.blank);
  return (
    <View style={styles.cell} wrap={false}>
      <View style={styles.itemRow}>
        <Text style={styles.itemNumber}>{item.id}.</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" }}>
          {segments.map((seg, i) =>
            seg.isBlank ? (
              <View key={i} style={styles.blankUnderline}>
                <Text style={styles.blankText}>{seg.text}</Text>
              </View>
            ) : (
              <Text key={i} style={styles.itemText}>
                {seg.text}
              </Text>
            ),
          )}
        </View>
      </View>
    </View>
  );
};

export interface RechtschreibungPdfProps {
  childName: string;
  date: string;
  sheet: RechtschreibSheet;
  rule: RechtschreibRule;
  theme: ThemeId;
  showWatermark: boolean;
  includeSolutions: boolean;
}

const RechtschreibungDocument = ({
  childName,
  date,
  sheet,
  rule,
  theme,
  showWatermark,
  includeSolutions,
}: RechtschreibungPdfProps): ReactElement => {
  const themeMeta = getTheme(theme),
    subtitle = RULE_SUBTITLES[rule];

  return (
    <Document
      title={`Rechtschreibung fuer ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      {/* Page 1 — Aufgabenblatt */}
      <Page size="A4" style={styles.page}>
<ThemeDecoration theme={themeMeta} />

        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Lernikon</Text>
            <Text style={styles.brandDomain}>lernikon.de</Text>
            <Text style={styles.title}>Rechtschreibung</Text>
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
          {sheet.entries.map((item) => (
            <WordItem key={item.id} item={item} showSolution={false} />
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

      {/* Page 2 — Losungsblatt (optional) */}
      {includeSolutions && (
        <Page size="A4" style={styles.page}>
    <ThemeDecoration theme={themeMeta} />

          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>Lernikon</Text>
              <Text style={styles.brandDomain}>lernikon.de</Text>
              <Text style={styles.title}>Losungen</Text>
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
            {sheet.entries.map((item) => (
              <WordItem key={item.id} item={item} showSolution={true} />
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

/** Renders the Rechtschreibung worksheet to a Node.js readable stream. */
export const renderRechtschreibungPdf = async (
  props: RechtschreibungPdfProps,
): Promise<NodeJS.ReadableStream> =>
  renderToStream(<RechtschreibungDocument {...props} />);
