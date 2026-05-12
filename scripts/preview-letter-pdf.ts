/**
 * Renders four sample letter-tracing PDFs (druck+upper, druck+lower,
 * schreib+upper, schreib+lower) directly from the React-PDF renderer,
 * rasterises page 1 to PNG so they can be reviewed via the Read tool,
 * and writes everything to scripts/output/.
 *
 * Run: npx tsx scripts/preview-letter-pdf.mts
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pdf } from "pdf-to-img";
import { generateLetterTracing } from "../lib/worksheet/letter-tracing/generate";
import { renderLetterTracingPdf } from "../lib/worksheet/letter-tracing/pdf";
import type { LetterStyle } from "../lib/worksheet/letter-tracing/config";

const OUTPUT_DIR = path.resolve("scripts/output");

interface Variant {
  name: string;
  style: LetterStyle;
  case: "upper" | "lower" | "both";
}

const VARIANTS: Variant[] = [
  { name: "druck-upper", style: "druck", case: "upper" },
  { name: "druck-lower", style: "druck", case: "lower" },
  { name: "druck-both", style: "druck", case: "both" },
  { name: "schreib-upper", style: "schreib", case: "upper" },
  { name: "schreib-lower", style: "schreib", case: "lower" },
  { name: "schreib-both", style: "schreib", case: "both" },
];

async function streamToBuffer(
  stream: NodeJS.ReadableStream,
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const v of VARIANTS) {
    const sheet = generateLetterTracing({
      letters: ["A"],
      case: v.case,
      linesPerLetter: 3,
      style: v.style,
    });

    const stream = await renderLetterTracingPdf({
      childName: "Testkind",
      date: "12. Mai 2026",
      sheet,
      theme: "weltraum",
      style: v.style,
      showWatermark: false,
    });

    const pdfBuffer = await streamToBuffer(stream);
    const pdfPath = path.join(OUTPUT_DIR, `${v.name}.pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);

    // Rasterise page 1 as PNG so we can view the alignment.
    const doc = await pdf(pdfPath, { scale: 2 });
    let pageIndex = 1;
    for await (const png of doc) {
      const pngPath = path.join(
        OUTPUT_DIR,
        `${v.name}-page${pageIndex}.png`,
      );
      await fs.writeFile(pngPath, png);
      pageIndex++;
      break; // only page 1
    }

    console.log(`  ✓ ${v.name}.pdf + .png`);
  }

  console.log(`Done. Files in ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
