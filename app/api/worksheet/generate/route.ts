import { NextResponse, type NextRequest } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile, getCurrentUserRow } from "@/lib/db/queries";
import { getQuota } from "@/lib/worksheet/rate-limit";
import { worksheetConfigSchema } from "@/lib/worksheet/config";
import { generateProblems } from "@/lib/worksheet/generate";
import { renderWorksheetPdf } from "@/lib/worksheet/pdf";
import { isThemeId } from "@/lib/themes";

export const runtime = "nodejs";

const formatRange = (min: number, max: number) => `${min}–${max}`;

const formatDate = () =>
  new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date());

export const POST = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [child, userRow] = await Promise.all([getChildProfile(), getCurrentUserRow()]);
  if (!child) return NextResponse.json({ error: "no_profile" }, { status: 400 });

  const status = userRow?.subscription_status ?? "none",
    quota = await getQuota(user.id, status);
  if (!quota.isPaid && quota.remaining <= 0) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const parsed = worksheetConfigSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_config", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const config = parsed.data,
    problems = generateProblems(config),
    theme = isThemeId(child.theme_preference) ? child.theme_preference : "weltraum";

  // Log first so the rate limiter is updated even if the client cancels mid-stream.
  const supabase = await createClient(),
    { error: logError } = await supabase.from("worksheets_log").insert({
      user_id: user.id,
      child_id: child.id,
      subject: config.subject,
      operation: config.operation,
      config_json: config as unknown as Record<string, unknown>,
    });
  if (logError) {
    console.warn("worksheets_log insert:", logError.message);
    return NextResponse.json({ error: "log_failed" }, { status: 500 });
  }

  const stream = await renderWorksheetPdf({
    childName: child.name,
    date: formatDate(),
    operation: config.operation,
    rangeLabel: formatRange(config.rangeMin, config.rangeMax),
    problems,
    theme,
    showWatermark: !quota.isPaid,
  });

  // Convert Node Readable to a Web ReadableStream the Response can consume.
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
  });

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="lernikon.pdf"`,
      "cache-control": "no-store",
    },
  });
};
