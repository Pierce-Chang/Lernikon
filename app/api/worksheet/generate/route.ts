import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  getActiveChildProfile,
  getChildProfileById,
  getCurrentUserRow,
} from "@/lib/db/queries";
import { getQuota } from "@/lib/worksheet/rate-limit";
import { mathRechnenConfigSchema } from "@/lib/worksheet/config";
import { generateProblems } from "@/lib/worksheet/generate";
import { renderWorksheetPdf } from "@/lib/worksheet/pdf";
import {
  letterTracingConfigSchema,
  LETTER_CASE_LABELS,
} from "@/lib/worksheet/letter-tracing/config";
import { generateLetterTracing } from "@/lib/worksheet/letter-tracing/generate";
import { renderLetterTracingPdf } from "@/lib/worksheet/letter-tracing/pdf";
import { numberTracingConfigSchema } from "@/lib/worksheet/number-tracing/config";
import { generateNumberTracing } from "@/lib/worksheet/number-tracing/generate";
import { renderNumberTracingPdf } from "@/lib/worksheet/number-tracing/pdf";
import {
  PatternConfigSchema,
  SHAPE_IDS,
  DIFFICULTY_LABELS,
} from "@/lib/worksheet/pattern/config";
import { generatePatternSequences } from "@/lib/worksheet/pattern/generate";
import { renderPatternPdf } from "@/lib/worksheet/pattern/pdf";
import { einmaleinsConfigSchema, ROW_IDS } from "@/lib/worksheet/einmaleins/config";
import { generateEinmaleinsProblems } from "@/lib/worksheet/einmaleins/generate";
import { WoerterConfigSchema, STYLE_LABELS } from "@/lib/worksheet/woerter-abschreiben/config";
import { generateWoerter } from "@/lib/worksheet/woerter-abschreiben/generate";
import { renderWoerterPdf } from "@/lib/worksheet/woerter-abschreiben/pdf";
import { DiktatConfigSchema } from "@/lib/worksheet/diktat/config";
import { generateDiktat } from "@/lib/worksheet/diktat/generate";
import { renderDiktatPdf } from "@/lib/worksheet/diktat/pdf";
import { schriftlichConfigSchema, OPERATION_LABELS as SCHRIFTLICH_OP_LABELS } from "@/lib/worksheet/schriftlich/config";
import { generateSchriftlich } from "@/lib/worksheet/schriftlich/generate";
import { renderSchriftlichPdf } from "@/lib/worksheet/schriftlich/pdf";
import { rechtschreibungConfigSchema, RULE_SUBTITLES } from "@/lib/worksheet/rechtschreibung/config";
import { generateRechtschreibung } from "@/lib/worksheet/rechtschreibung/generate";
import { renderRechtschreibungPdf } from "@/lib/worksheet/rechtschreibung/pdf";
import { bruecheConfigSchema, MODUS_LABELS } from "@/lib/worksheet/brueche/config";
import { generateBrueche } from "@/lib/worksheet/brueche/generate";
import { renderBruechePdf } from "@/lib/worksheet/brueche/pdf";
import { wortartenConfigSchema } from "@/lib/worksheet/wortarten/config";
import { generateWortarten } from "@/lib/worksheet/wortarten/generate";
import { renderWortartenPdf } from "@/lib/worksheet/wortarten/pdf";
import { multiplikationConfigSchema, STELLEN_LABELS as MUL_STELLEN_LABELS } from "@/lib/worksheet/multiplikation/config";
import { generateMultiplikation } from "@/lib/worksheet/multiplikation/generate";
import { renderMultiplikationPdf } from "@/lib/worksheet/multiplikation/pdf";
import { divisionConfigSchema, STELLEN_LABELS as DIV_STELLEN_LABELS, VERFAHREN_LABELS as DIV_VERFAHREN_LABELS } from "@/lib/worksheet/division/config";
import { generateDivision } from "@/lib/worksheet/division/generate";
import { renderDivisionPdf } from "@/lib/worksheet/division/pdf";
import { formenErkennenConfigSchema, SCHWIERIGKEIT_LABELS as FORMEN_SCHWIERIGKEIT_LABELS } from "@/lib/worksheet/denken-formen-erkennen/config";
import { generateFormenErkennen } from "@/lib/worksheet/denken-formen-erkennen/generate";
import { renderFormenErkennenPdf } from "@/lib/worksheet/denken-formen-erkennen/pdf";
import { SHAPE_LABELS as FORMEN_SHAPE_LABELS } from "@/lib/worksheet/denken-formen-erkennen/shapes";
import { formenZuordnenConfigSchema } from "@/lib/worksheet/denken-formen-zuordnen/config";
import { generateFormenZuordnen } from "@/lib/worksheet/denken-formen-zuordnen/generate";
import { renderFormenZuordnenPdf } from "@/lib/worksheet/denken-formen-zuordnen/pdf";
import { mengenConfigSchema } from "@/lib/worksheet/mengen/config";
import { generateMengen } from "@/lib/worksheet/mengen/generate";
import { renderMengenPdf } from "@/lib/worksheet/mengen/pdf";
import { marienkaeferConfigSchema } from "@/lib/worksheet/marienkaefer/config";
import { generateMarienkaefer } from "@/lib/worksheet/marienkaefer/generate";
import { renderMarienkaeferPdf } from "@/lib/worksheet/marienkaefer/pdf";
import { faelleConfigSchema, MODE_LABELS } from "@/lib/worksheet/faelle/config";
import { generateFaelle } from "@/lib/worksheet/faelle/generate";
import { renderFaellePdf } from "@/lib/worksheet/faelle/pdf";
import {
  vokabelnConfigSchema,
  BUCKET_IDS,
  BUCKET_LABELS,
} from "@/lib/worksheet/englisch-vokabeln-abschreiben/config";
import { generateVokabelnAbschreiben } from "@/lib/worksheet/englisch-vokabeln-abschreiben/generate";
import { renderVokabelnPdf } from "@/lib/worksheet/englisch-vokabeln-abschreiben/pdf";
import { TOPIC_IDS, type TopicId } from "@/lib/worksheet/topics";
import { isThemeId } from "@/lib/themes";

export const runtime = "nodejs";

const formatRange = (min: number, max: number) => `bis ${max}`;

const formatDate = () =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date());

/** ISO calendar date (YYYY-MM-DD) for the local server timezone — used in filenames. */
const formatIsoDate = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

const envelopeSchema = z.object({
  topic: z.enum(TOPIC_IDS),
  childId: z.string().uuid().optional(),
});

/** Discriminated result of one topic's render — the route plumbs this onwards. */
interface RenderResult {
  stream: NodeJS.ReadableStream;
  filenameBase: string;
  logSubject: string;
  logOperation: string | null;
  logConfig: Record<string, unknown>;
}

export const POST = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userRow = await getCurrentUserRow(),
    quota = await getQuota(user.id, userRow);
  if (!quota.isPaid && quota.remaining <= 0) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const envelopeParse = envelopeSchema.safeParse(payload);
  if (!envelopeParse.success) {
    return NextResponse.json(
      { error: "invalid_envelope", details: envelopeParse.error.flatten() },
      { status: 400 },
    );
  }

  // Use the client-specified child if it belongs to the user, otherwise fall
  // back to the active-child resolver. Returning 400 on a present-but-foreign
  // childId would also be reasonable; falling back keeps the UX smoother.
  const requestedChild = envelopeParse.data.childId
      ? await getChildProfileById(envelopeParse.data.childId)
      : null,
    child = requestedChild ?? (await getActiveChildProfile(user.id));
  if (!child) return NextResponse.json({ error: "no_profile" }, { status: 400 });

  const topic: TopicId = envelopeParse.data.topic,
    theme = isThemeId(child.theme_preference) ? child.theme_preference : "weltraum";

  let rendered: RenderResult;
  try {
    rendered = await dispatchTopic(topic, payload, {
      childName: child.name,
      theme,
      isPaid: quota.isPaid,
    });
  } catch (err) {
    if (err instanceof TopicError) {
      return NextResponse.json({ error: err.code, details: err.details }, {
        status: err.status,
      });
    }
    throw err;
  }

  // Log first so the rate limiter is updated even if the client cancels mid-stream.
  const supabase = await createClient(),
    { error: logError } = await supabase.from("worksheets_log").insert({
      user_id: user.id,
      child_id: child.id,
      subject: rendered.logSubject,
      operation: rendered.logOperation,
      config_json: { topic, ...rendered.logConfig },
    });
  if (logError) {
    console.warn("worksheets_log insert:", logError.message);
    return NextResponse.json({ error: "log_failed" }, { status: 500 });
  }

  // Today's worksheet count for this user (includes the row we just inserted).
  // Used to build a unique filename so the browser doesn't append " (1)" etc.
  const now = new Date(),
    dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    { count: todayCountRaw } = await supabase
      .from("worksheets_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("generated_at", dayStart.toISOString()),
    todayCount = todayCountRaw ?? 1;

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      rendered.stream.on("data", (chunk: Buffer) =>
        controller.enqueue(new Uint8Array(chunk)),
      );
      rendered.stream.on("end", () => controller.close());
      rendered.stream.on("error", (err) => controller.error(err));
    },
  });

  const filename = `${rendered.filenameBase} - ${formatIsoDate(now)} - Nr. ${todayCount}.pdf`;

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
};

class TopicError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(code);
  }
}

interface DispatchContext {
  childName: string;
  theme: import("@/lib/themes").ThemeId;
  isPaid: boolean;
}

/** Topic-specific config parsing + generation + PDF rendering. */
const dispatchTopic = async (
  topic: TopicId,
  payload: unknown,
  ctx: DispatchContext,
): Promise<RenderResult> => {
  switch (topic) {
    case "mathe-rechnen": {
      const parsed = mathRechnenConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        problems = generateProblems(config),
        opLabel =
          config.operation === "addition"
            ? "Addition"
            : config.operation === "subtraktion"
              ? "Subtraktion"
              : "Gemischt",
        stream = await renderWorksheetPdf({
          childName: ctx.childName,
          date: formatDate(),
          operation: config.operation,
          rangeLabel: formatRange(config.rangeMin, config.rangeMax),
          problems,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.includeSolutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Rechnen - ${opLabel} ${config.rangeMin}-${config.rangeMax}`,
        logSubject: "mathe",
        logOperation: config.operation,
        logConfig: config,
      };
    }
    case "mathe-zahlen-schreiben": {
      const parsed = numberTracingConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateNumberTracing(config),
        digitsLabel = config.digits.join(","),
        stream = await renderNumberTracingPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Zahlen schreiben (${digitsLabel})`,
        logSubject: "mathe",
        logOperation: "zahlen-schreiben",
        logConfig: config,
      };
    }
    case "deutsch-buchstaben-schreiben": {
      const parsed = letterTracingConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateLetterTracing(config),
        lettersLabel = config.letters.join(","),
        caseLabel = LETTER_CASE_LABELS[config.case],
        stream = await renderLetterTracingPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          theme: ctx.theme,
          style: config.style,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `Lernikon - Deutsch - Buchstaben (${caseLabel}) ${lettersLabel}`,
        logSubject: "deutsch",
        logOperation: null,
        logConfig: config,
      };
    }
    case "denken-muster": {
      const parsed = PatternConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      // Server-side canonical sort of shapes — defensive against stale client state.
      const config = {
        ...parsed.data,
        shapes: SHAPE_IDS.filter((id) => parsed.data.shapes.includes(id)),
      };
      const sheet = generatePatternSequences(config),
        diffLabel = DIFFICULTY_LABELS[config.difficulty],
        stream = await renderPatternPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          difficulty: config.difficulty,
          mode: config.mode,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.includeSolutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Denken - Muster fortsetzen (${diffLabel} ${config.rowCount} Reihen)`,
        logSubject: "denken",
        logOperation: "muster",
        logConfig: config,
      };
    }
    case "mathe-einmaleins": {
      const parsed = einmaleinsConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      // Server-side canonical sort — defensive against stale client state.
      const config = {
        ...parsed.data,
        rows: ROW_IDS.filter((id) => parsed.data.rows.includes(id)),
      };
      const problems = generateEinmaleinsProblems(config),
        rowsLabel = config.rows.join(", "),
        stream = await renderWorksheetPdf({
          childName: ctx.childName,
          date: formatDate(),
          operation: "einmaleins",
          rangeLabel: rowsLabel,
          problems,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.includeSolutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Einmaleins - Reihen ${rowsLabel}`,
        logSubject: "mathe",
        logOperation: "einmaleins",
        logConfig: config,
      };
    }
    case "deutsch-woerter-abschreiben": {
      const parsed = WoerterConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        blocks = generateWoerter(config),
        styleLabel = STYLE_LABELS[config.style],
        stream = await renderWoerterPdf({
          childName: ctx.childName,
          date: formatDate(),
          blocks,
          theme: ctx.theme,
          style: config.style,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `Lernikon - Deutsch - Woerter abschreiben - Klasse ${config.klasse} (${styleLabel})`,
        logSubject: "deutsch",
        logOperation: "woerter-abschreiben",
        logConfig: config,
      };
    }
    case "deutsch-diktate": {
      const parsed = DiktatConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateDiktat(config),
        stream = await renderDiktatPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `Lernikon - Deutsch - Diktat - Klasse ${config.klasse}`,
        logSubject: "deutsch",
        logOperation: "diktat",
        logConfig: config,
      };
    }
    case "mathe-schriftlich": {
      const parsed = schriftlichConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        problems = generateSchriftlich(config),
        opLabel = SCHRIFTLICH_OP_LABELS[config.operation],
        stream = await renderSchriftlichPdf({
          childName: ctx.childName,
          date: formatDate(),
          problems,
          operation: config.operation,
          stellen: config.stellen,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Schriftlich - ${opLabel} ${config.stellen}-stellig`,
        logSubject: "mathe",
        logOperation: "schriftlich",
        logConfig: config,
      };
    }
    case "deutsch-rechtschreibung": {
      const parsed = rechtschreibungConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateRechtschreibung(config),
        ruleLabel = RULE_SUBTITLES[config.rule].replace(/\.$/, ""),
        stream = await renderRechtschreibungPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          rule: config.rule,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Deutsch - Rechtschreibung - Klasse 3 (${ruleLabel})`,
        logSubject: "deutsch",
        logOperation: "rechtschreibung",
        logConfig: config,
      };
    }
    case "mathe-brueche": {
      const parsed = bruecheConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        { problems } = generateBrueche(config),
        modusLabel = MODUS_LABELS[config.modus],
        stream = await renderBruechePdf({
          childName: ctx.childName,
          date: formatDate(),
          problems,
          modus: config.modus,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Bruche - ${modusLabel}`,
        logSubject: "mathe",
        logOperation: "brueche",
        logConfig: config,
      };
    }
    case "deutsch-wortarten": {
      const parsed = wortartenConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateWortarten(config),
        stream = await renderWortartenPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Deutsch - Wortarten - Klasse 2`,
        logSubject: "deutsch",
        logOperation: "wortarten",
        logConfig: config,
      };
    }
    case "mathe-multiplikation": {
      const parsed = multiplikationConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        problems = generateMultiplikation(config),
        stellenLabel = MUL_STELLEN_LABELS[config.stellen],
        stream = await renderMultiplikationPdf({
          childName: ctx.childName,
          date: formatDate(),
          problems,
          stellen: config.stellen,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
          merkkasten: config.merkkasten,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Schriftliche Multiplikation (${stellenLabel})`,
        logSubject: "mathe",
        logOperation: "multiplikation",
        logConfig: config,
      };
    }
    case "mathe-division": {
      const parsed = divisionConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        problems = generateDivision(config),
        stellenLabel = DIV_STELLEN_LABELS[config.stellen],
        verfahrenLabel = DIV_VERFAHREN_LABELS[config.verfahren],
        stream = await renderDivisionPdf({
          childName: ctx.childName,
          date: formatDate(),
          problems,
          stellen: config.stellen,
          verfahren: config.verfahren,
          mitRest: config.mitRest,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
          merkkasten: config.merkkasten,
        });
      return {
        stream,
        filenameBase: `Lernikon - Mathe - Schriftliche Division (${stellenLabel}, ${verfahrenLabel})${config.mitRest ? " mit Rest" : ""}`,
        logSubject: "mathe",
        logOperation: "division",
        logConfig: config,
      };
    }
    case "denken-formen-erkennen": {
      const parsed = formenErkennenConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateFormenErkennen(config),
        zielFormLabel = FORMEN_SHAPE_LABELS[config.zielForm],
        schwierigkeitLabel = FORMEN_SCHWIERIGKEIT_LABELS[config.schwierigkeit],
        stream = await renderFormenErkennenPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          zielForm: config.zielForm,
          totalCount: config.totalCount,
          schwierigkeit: config.schwierigkeit,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.solutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Denken - Formen erkennen (${zielFormLabel}, ${schwierigkeitLabel})`,
        logSubject: "denken",
        logOperation: "formen-erkennen",
        logConfig: config,
      };
    }
    case "mathe-mengen": {
      const parsed = mengenConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        rangeMax = config.range === "1-5" ? 5 : 10,
        sheet = generateMengen(config),
        stream = await renderMengenPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          range: config.range,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `mengen-1-bis-${rangeMax}-${config.count}-aufgaben`,
        logSubject: "mathe",
        logOperation: `mengen-1-bis-${rangeMax}`,
        logConfig: { range: config.range, count: config.count, seed: sheet.seed },
      };
    }
    case "mathe-marienkaefer": {
      const parsed = marienkaeferConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateMarienkaefer(config),
        stream = await renderMarienkaeferPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `marienkaefer-zaehlen-${config.count}-aufgaben`,
        logSubject: "mathe",
        logOperation: "marienkaefer-zaehlen",
        logConfig: { count: config.count, seed: sheet.seed },
      };
    }
    case "denken-formen-zuordnen": {
      const parsed = formenZuordnenConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateFormenZuordnen(config),
        stream = await renderFormenZuordnenPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          paarCount: config.paarCount,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `Lernikon - Denken - Formen zuordnen (${config.paarCount} Paare)`,
        logSubject: "denken",
        logOperation: "formen-zuordnen",
        logConfig: config,
      };
    }
    case "deutsch-faelle": {
      const parsed = faelleConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        sheet = generateFaelle(config),
        modeLabel = MODE_LABELS[config.mode],
        stream = await renderFaellePdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          mode: config.mode,
          theme: ctx.theme,
          showWatermark: !ctx.isPaid,
          includeSolutions: config.showSolutions,
        });
      return {
        stream,
        filenameBase: `Lernikon - Deutsch - 4 Faelle - ${modeLabel}`,
        logSubject: "deutsch",
        logOperation: `faelle-${config.mode}`,
        logConfig: { mode: config.mode, count: config.count, showSolutions: config.showSolutions, seed: sheet.seed },
      };
    }
    case "englisch-vokabeln-abschreiben": {
      const parsed = vokabelnConfigSchema.safeParse(payload);
      if (!parsed.success) {
        throw new TopicError(400, "invalid_config", parsed.error.flatten());
      }
      const config = parsed.data,
        // Server-side canonical bucket sort so stale client state cannot reorder picks.
        canonicalBuckets = BUCKET_IDS.filter((id) =>
          config.buckets.includes(id),
        ),
        sheet = generateVokabelnAbschreiben({
          ...config,
          buckets: canonicalBuckets,
        }),
        bucketLabelsList = canonicalBuckets.map((id) => BUCKET_LABELS[id]),
        stream = await renderVokabelnPdf({
          childName: ctx.childName,
          date: formatDate(),
          sheet,
          theme: ctx.theme,
          schrift: config.schrift,
          bucketLabels: bucketLabelsList,
          showWatermark: !ctx.isPaid,
        });
      return {
        stream,
        filenameBase: `Lernikon - Englisch - Vokabeln abschreiben - ${bucketLabelsList.join(", ")}`,
        logSubject: "englisch",
        logOperation: null,
        logConfig: {
          buckets: canonicalBuckets,
          count: config.count,
          linesPerWord: config.linesPerWord,
          schrift: config.schrift,
          seed: sheet.seed,
        },
      };
    }
    default:
      throw new TopicError(400, "unknown_topic", { topic });
  }
};
