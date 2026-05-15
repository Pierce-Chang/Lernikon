import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  getActiveChildProfile,
  getCurrentUserRow,
  listChildProfiles,
  listRecentWorksheets,
} from "@/lib/db/queries";
import { getQuota } from "@/lib/worksheet/rate-limit";
import { formatGradeShort } from "@/lib/format/grade";
import { greetingForHour, dashboardSubLine } from "@/lib/format/dashboard";
import {
  TopicMeta,
  TOPIC_REGISTRY,
  topicsForGradeWithRoadmap,
  isTopicId,
} from "@/lib/worksheet/topics";
import { LETTER_CASE_LABELS, LETTER_STYLE_LABELS } from "@/lib/worksheet/letter-tracing/config";
import { DIFFICULTY_LABELS, type Difficulty, type PatternMode } from "@/lib/worksheet/pattern/config";
import { Button } from "@/components/ui/button";
import { ChildSelector } from "./child-selector";
import { HowItWorksStrip } from "@/components/dashboard/how-it-works-strip";
import { GradeSections, type GradeSection } from "@/components/dashboard/grade-sections";

export const metadata = { title: "Übersicht" };

/** All supported grades in ascending order. */
const ALL_GRADES = [0, 1, 2, 3, 4] as const;

const formatRelative = (iso: string) => {
  const date = new Date(iso),
    today = new Date(),
    sameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();
  if (sameDay) {
    return new Intl.DateTimeFormat("de-DE", { timeStyle: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date);
};

/** Smart summary of a selection list: "0-9" if all selected, "A,B,C" for short lists, "N items" otherwise. */
const summarizeSelection = (
  selected: readonly string[],
  full: readonly string[],
  unitSingular: string,
  unitPlural: string,
): string => {
  if (selected.length === 0) return `0 ${unitPlural}`;
  if (selected.length === full.length) {
    return `${full[0]}-${full[full.length - 1]}`;
  }
  if (selected.length <= 4) {
    const ordered = [...selected].sort((a, b) => full.indexOf(a) - full.indexOf(b));
    return ordered.join(",");
  }
  return `${selected.length} ${selected.length === 1 ? unitSingular : unitPlural}`;
};

const pluralLines = (n: number) => `${n} ${n === 1 ? "Zeile" : "Zeilen"}`;

const DIGITS_FULL = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const ALPHABET_FULL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  ROWS_FULL = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] as const;

const OPERATION_LABEL: Record<string, string> = {
  addition: "Addition",
  subtraktion: "Subtraktion",
  gemischt: "Gemischt",
};

const summarizeWorksheet = (subject: string, config: Record<string, unknown>): string => {
  const topic = typeof config.topic === "string" ? config.topic : null;

  if (topic === "mathe-rechnen") {
    const op = OPERATION_LABEL[String(config.operation ?? "")] ?? "Rechnen",
      rmin = Number(config.rangeMin ?? 0),
      rmax = Number(config.rangeMax ?? 0),
      count = Number(config.count ?? 0);
    return `Rechnen · ${op} · ${rmin}-${rmax} · ${count} Aufgaben`;
  }

  if (topic === "mathe-zahlen-schreiben") {
    const digits = Array.isArray(config.digits) ? (config.digits as string[]) : [],
      lines = Number(config.linesPerDigit ?? 0),
      digitsLabel = summarizeSelection(digits, DIGITS_FULL, "Ziffer", "Ziffern");
    return `Zahlen schreiben · ${digitsLabel} · ${pluralLines(lines)}`;
  }

  if (topic === "mathe-einmaleins") {
    const rows = Array.isArray(config.rows) ? (config.rows as number[]) : [],
      count = Number(config.count ?? 0),
      rowsLabel = summarizeSelection(rows.map(String), ROWS_FULL, "Reihe", "Reihen");
    return `Einmaleins · ${rowsLabel} · ${count} Aufgaben`;
  }

  if (topic === "denken-muster") {
    const diffKey = String(config.difficulty ?? "abab") as Difficulty,
      diffLabel = DIFFICULTY_LABELS[diffKey] ?? diffKey,
      rows = Number(config.rowCount ?? 0),
      shapeCount = Array.isArray(config.shapes) ? config.shapes.length : 0,
      mode = String(config.mode ?? "fill") as PatternMode,
      modeLabel =
        mode === "cutout" ? " · Ausschneiden" : mode === "ausmalen" ? " · Ausmalen" : "";
    return `Muster fortsetzen · ${diffLabel} · ${rows} Reihen · ${shapeCount} Formen${modeLabel}`;
  }

  if (topic === "deutsch-woerter-abschreiben") {
    const klasse = Number(config.klasse ?? 1),
      count = Number(config.count ?? 0),
      lines = Number(config.linesPerWord ?? 0),
      style = String(config.style ?? "druck"),
      styleLabel = style === "schreib" ? "Schreibschrift" : "Druckschrift";
    return `Wörter abschreiben · Klasse ${klasse} · ${styleLabel} · ${count} Wörter · ${pluralLines(lines)}`;
  }

  if (topic === "deutsch-buchstaben-schreiben") {
    const letters = Array.isArray(config.letters) ? (config.letters as string[]) : [],
      lines = Number(config.linesPerLetter ?? 0),
      caseValue = String(config.case ?? "both"),
      styleValue = String(config.style ?? "druck"),
      caseLabel =
        caseValue in LETTER_CASE_LABELS
          ? LETTER_CASE_LABELS[caseValue as keyof typeof LETTER_CASE_LABELS]
          : "Groß + Klein",
      styleLabel =
        styleValue in LETTER_STYLE_LABELS
          ? LETTER_STYLE_LABELS[styleValue as keyof typeof LETTER_STYLE_LABELS]
          : "Druckschrift",
      lettersLabel = summarizeSelection(letters, ALPHABET_FULL, "Buchstabe", "Buchstaben");
    return `Buchstaben · ${styleLabel} · ${lettersLabel} · ${caseLabel} · ${pluralLines(lines)}`;
  }

  // Fallback: topic label from registry if we know the topic, else the raw subject.
  if (topic && isTopicId(topic)) {
    return TOPIC_REGISTRY[topic].label;
  }
  return subject;
};


export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [children, userRow, recent] = await Promise.all([
    listChildProfiles(),
    getCurrentUserRow(),
    listRecentWorksheets(user.id, 10),
  ]);
  if (children.length === 0) redirect("/onboarding");

  const active = await getActiveChildProfile(user.id);
  if (!active) redirect("/onboarding");

  const quota = await getQuota(user.id, userRow),
    quotaLine = quota.isPaid
      ? "Family Pro · unbegrenzt"
      : Number.isFinite(quota.remaining)
        ? `Heute noch ${quota.remaining} von ${quota.limit} Arbeitsblättern`
        : null,
    recentForActive = recent.filter(
      (row) => row.child_id === null || row.child_id === active.id,
    );

  // Pre-compute per-grade topic lists on the server: active grade first, rest
  // ascending. We hand a plain JSON-safe array down to the client component
  // that owns the collapse/animation state.
  const gradeOrder = [
      active.grade,
      ...ALL_GRADES.filter((g) => g !== active.grade),
    ],
    sections: GradeSection[] = gradeOrder
      .map((grade) => ({ grade, topics: topicsForGradeWithRoadmap(grade) as TopicMeta[] }))
      .filter((s) => s.topics.length > 0);

  const hour = new Date().getHours(),
    greeting = greetingForHour(hour),
    subLine = dashboardSubLine(active.name, formatGradeShort(active.grade), active.theme_preference ?? "weltraum", quotaLine);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      {!userRow?.hide_how_it_works && <HowItWorksStrip />}

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{subLine}</p>
        <p className="mt-1 text-xs text-[#1E4A7C]/70">In 30 Sekunden zum fertigen Arbeitsblatt.</p>
        {children.length > 1 && (
          <div className="mt-4">
            <ChildSelector
              items={children.map((c) => ({ id: c.id, name: c.name }))}
              activeId={active.id}
            />
          </div>
        )}
      </header>

      {/* Per-grade catalog sections: active grade always visible, others behind a reveal. */}
      <GradeSections
        sections={sections}
        activeGrade={active.grade}
        activeChildName={active.name}
      />

      {recentForActive.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">Zuletzt erstellt</h2>
          <ul
            className="mt-4 max-h-44 divide-y divide-border overflow-y-auto rounded-md border"
          >
            {recentForActive.map((row) => {
              const topicId =
                  typeof row.config_json.topic === "string" &&
                  isTopicId(row.config_json.topic)
                    ? row.config_json.topic
                    : null,
                topicMeta = topicId ? TOPIC_REGISTRY[topicId] : null,
                summary = summarizeWorksheet(row.subject, row.config_json);
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{summary}</span>
                    <span className="text-muted-foreground text-xs">
                      {formatRelative(row.generated_at)}
                    </span>
                  </div>
                  {topicMeta && (
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={topicMeta.href} />}
                      className="flex shrink-0 items-center gap-1.5"
                    >
                      <RefreshCw className="size-3.5" aria-hidden />
                      Erneut erstellen
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
