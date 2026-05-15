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
import type { DiktatSheet, DiktatSentence } from "./generate";
import { getTheme, type ThemeId } from "@/lib/themes";
import { ThemeDecoration } from "../theme-decoration";

// Cached once at module init — React-PDF cannot fetch local paths.
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

// Helvetica is a built-in PDF font — no external registration needed.
Font.register({
  family: "Helvetica",
  src: "Helvetica",
});

export interface DiktatPdfProps {
  childName: string;
  date: string;
  sheet: DiktatSheet;
  theme: ThemeId;
  showWatermark: boolean;
}

const COLOR = {
  brand: "#1E4A7C",
  accent: "#F4B942",
  textDark: "#1F2937",
  textMuted: "#6B7280",
  line: "#94A3B8",
  lineHelper: "#CBD5E1",
} as const;

// 3-Linien-Lineatur constants — copied from woerter-abschreiben/pdf.tsx.
// Extract to a shared module once there is a third consumer.
const BAND_HEIGHT = 20; // pt per band
const ROW_HEIGHT = BAND_HEIGHT * 2; // 40 pt total
const ROW_GAP = 10; // pt between rows inside one sentence block
const SENTENCE_GAP = 20; // pt between sentence blocks

// 2 rows per sentence — long enough for a short Klasse 2 sentence;
// tight enough to fit 5 blocks comfortably on one page.
// count=12 will overflow to a third page; that is intentional (spec allows it).
const ROWS_PER_SENTENCE = 2;

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
    marginBottom: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
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
  // Page 1 — parent list
  sentenceListItem: {
    flexDirection: "row",
    marginBottom: 18,
  },
  sentenceNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    width: 28,
    flexShrink: 0,
  },
  sentenceText: {
    fontSize: 14,
    lineHeight: 1.6,
    color: COLOR.textDark,
    flex: 1,
  },
  // Page 2+ — child writing sheet
  nameRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  nameField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    marginRight: 32,
  },
  datumField: {
    width: 130,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  fieldLabel: {
    fontSize: 11,
    color: COLOR.textMuted,
    marginRight: 8,
    flexShrink: 0,
  },
  fieldLine: {
    flex: 1,
    height: 0.75,
    backgroundColor: COLOR.textDark,
  },
  datumLine: {
    flex: 1,
    height: 0.75,
    backgroundColor: COLOR.textDark,
  },
  sentenceBlock: {
    marginBottom: SENTENCE_GAP,
  },
  blockLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLOR.brand,
    marginBottom: 4,
  },
  lineRow: {
    position: "relative",
    height: ROW_HEIGHT,
    marginBottom: ROW_GAP,
  },
  lineTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 0.5,
    backgroundColor: COLOR.line,
  },
  lineMid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: BAND_HEIGHT,
    height: 0.5,
    backgroundColor: COLOR.lineHelper,
  },
  lineBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    top: BAND_HEIGHT * 2,
    height: 0.5,
    backgroundColor: COLOR.line,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 56,
    right: 56,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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

/** One blank 3-Linien-Lineatur row for the child to write in. */
const LineaturRow = (): ReactElement => (
  <View style={styles.lineRow} wrap={false}>
    <View style={styles.lineTop} />
    <View style={styles.lineMid} />
    <View style={styles.lineBottom} />
  </View>
);

/** Numbered block of N blank lineatur rows for one dictated sentence. */
const SentenceBlock = ({ sentence }: { sentence: DiktatSentence }): ReactElement => {
  const rows = Array.from({ length: ROWS_PER_SENTENCE }, (_, i) => i);
  return (
    <View style={styles.sentenceBlock} wrap={false}>
      <Text style={styles.blockLabel}>{sentence.id}.</Text>
      {rows.map((i) => (
        <LineaturRow key={i} />
      ))}
    </View>
  );
};

/** Page 1: numbered sentence list for the parent to read aloud. */
const ParentPage = ({
  sentences,
  themeMeta,
  showWatermark,
}: {
  sentences: DiktatSentence[];
  themeMeta: ReturnType<typeof getTheme>;
  showWatermark: boolean;
}): ReactElement => (
  <Page size="A4" style={styles.page}>
    <View style={styles.topAccent} fixed />
    <ThemeDecoration theme={themeMeta} />

    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Lernikon</Text>
        <Text style={styles.brandDomain}>lernikon.de</Text>
        <Text style={styles.title}>Diktat</Text>
        <Text style={styles.subtitle}>vorlesen fur die Eltern</Text>
      </View>
      <View style={styles.metaCol}>
        <Text style={styles.metaLabel}>Klasse</Text>
        <Text style={styles.metaValue}>2</Text>
      </View>
    </View>

    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 11, color: COLOR.textMuted, lineHeight: 1.5 }}>
        Lies die Satze einzeln vor. Mach kurze Pausen.
      </Text>
    </View>

    {sentences.map((s) => (
      <View key={s.id} style={styles.sentenceListItem}>
        <Text style={styles.sentenceNumber}>{s.id}.</Text>
        <Text style={styles.sentenceText}>{s.text}</Text>
      </View>
    ))}

    <View style={styles.footer} fixed>
      <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
      {showWatermark && (
        <Text style={styles.footerWatermark}>
          Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
        </Text>
      )}
    </View>
  </Page>
);

/** Page 2+: numbered lineatur blocks for the child to write dictated sentences. */
const ChildPage = ({
  sentences,
  themeMeta,
  showWatermark,
}: {
  sentences: DiktatSentence[];
  themeMeta: ReturnType<typeof getTheme>;
  showWatermark: boolean;
}): ReactElement => (
  <Page size="A4" style={styles.page}>
    <View style={styles.topAccent} fixed />
    <ThemeDecoration theme={themeMeta} />

    <View style={styles.header}>
      <View>
        <Text style={styles.brand}>Lernikon</Text>
        <Text style={styles.brandDomain}>lernikon.de</Text>
        <Text style={styles.title}>Diktat</Text>
      </View>
      <View style={styles.metaCol}>
        <Text style={styles.metaLabel}>Klasse</Text>
        <Text style={styles.metaValue}>2</Text>
      </View>
    </View>

    <View style={styles.nameRow}>
      <View style={styles.nameField}>
        <Text style={styles.fieldLabel}>Name:</Text>
        <View style={styles.fieldLine} />
      </View>
      <View style={styles.datumField}>
        <Text style={styles.fieldLabel}>Datum:</Text>
        <View style={styles.datumLine} />
      </View>
    </View>

    {sentences.map((s) => (
      <SentenceBlock key={s.id} sentence={s} />
    ))}

    <View style={styles.footer} fixed>
      <Image src={LOGO_LOCKUP_BUFFER} style={styles.footerLogo} />
      {showWatermark && (
        <Text style={styles.footerWatermark}>
          Kostenfreie Version von lernikon.de - Family Pro entsperrt alle Themes
        </Text>
      )}
    </View>
  </Page>
);

const DiktatDocument = ({ childName, sheet, theme, showWatermark }: DiktatPdfProps): ReactElement => {
  const themeMeta = getTheme(theme);
  return (
    <Document
      title={`Diktat fuer ${childName}`}
      author="Lernikon"
      creator="Lernikon"
      producer="Lernikon"
    >
      <ParentPage
        sentences={sheet.sentences}
        themeMeta={themeMeta}
        showWatermark={showWatermark}
      />
      <ChildPage
        sentences={sheet.sentences}
        themeMeta={themeMeta}
        showWatermark={showWatermark}
      />
    </Document>
  );
};

/** Renders the Diktat worksheet to a Node.js readable stream. */
export const renderDiktatPdf = async (props: DiktatPdfProps) => {
  return renderToStream(<DiktatDocument {...props} />);
};
