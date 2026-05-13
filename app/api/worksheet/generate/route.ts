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
    default:
      throw new TopicError(400, "unknown_topic", { topic });
  }
};
