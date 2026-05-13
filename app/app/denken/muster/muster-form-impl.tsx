"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  SHAPE_IDS,
  SHAPE_LABELS,
  DIFFICULTY_IDS,
  DIFFICULTY_LABELS,
  DIFFICULTY_EXAMPLES,
  ROW_COUNT_OPTIONS,
  ITEMS_PER_ROW_OPTIONS,
  PATTERN_MODE_IDS,
  PATTERN_MODE_LABELS,
  PATTERN_MODE_DESCRIPTIONS,
  PATTERN_MODE_DIFFICULTY,
  DIFFICULTY_DIFFICULTY_LABEL,
  ITEMS_PER_ROW_DIFFICULTY_LABEL,
  type ShapeId,
  type Difficulty,
  type RowCount,
  type ItemsPerRow,
  type PatternMode,
} from "@/lib/worksheet/pattern/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

/**
 * Mirror of PATTERN_MODE_DIFFICULTY → Tailwind pill class. Tailwind's JIT
 * scanner needs static class strings, so we cannot build them from a color
 * variable at runtime.
 */
const MODE_DIFFICULTY_PILL_CLASS: Record<PatternMode, string> = {
  ausmalen: "bg-emerald-100 text-emerald-700",
  cutout: "bg-amber-100 text-amber-700",
  fill: "bg-rose-100 text-rose-700",
};

/** Pill class for the pattern difficulty card (ABAB / ABBABB / ABCABC / Gemischt). */
const PATTERN_DIFFICULTY_PILL_CLASS: Record<Difficulty, string> = {
  abab: "bg-emerald-100 text-emerald-700",
  abbabb: "bg-amber-100 text-amber-700",
  abcabc: "bg-rose-100 text-rose-700",
  gemischt: "bg-violet-100 text-violet-700",
};

/** Pill class for the items-per-row toggle. */
const ITEMS_PER_ROW_PILL_CLASS: Record<ItemsPerRow, string> = {
  6: "bg-emerald-100 text-emerald-700",
  7: "bg-amber-100 text-amber-700",
};

/** URL path for each shape image served from `public/geometrics/`. */
const SHAPE_IMAGE_SRC: Record<ShapeId, string> = {
  kreis: "/geometrics/kreis_gelb.png",
  dreieck: "/geometrics/dreieck_gr%C3%BCn.png",
  viereck: "/geometrics/viereck_gr%C3%BCn.png",
  rechteck: "/geometrics/rechteck_blau.png",
  raute: "/geometrics/raute_blau.png",
  fuenfeck: "/geometrics/f%C3%BCnfteck_rot.png",
  sechseck: "/geometrics/sechseck_rot.png",
  stern: "/geometrics/stern_gelb.png",
};

interface MusterSettings {
  shapes: ShapeId[];
  difficulty: Difficulty;
  rowCount: RowCount;
  itemsPerRow: ItemsPerRow;
  mode: PatternMode;
  includeSolutions: boolean;
}

const DEFAULT_SETTINGS: MusterSettings = {
  shapes: [...SHAPE_IDS],
  difficulty: "abab",
  rowCount: 5,
  itemsPerRow: 6,
  mode: "fill",
  includeSolutions: true,
};

/** Returns shapes in canonical SHAPE_IDS order regardless of toggle sequence. */
const sortShapes = (shapes: ShapeId[]): ShapeId[] =>
  SHAPE_IDS.filter((id) => shapes.includes(id));

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const MusterFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<MusterSettings>(
    "lernikon.settings.denken-muster",
    DEFAULT_SETTINGS,
  );
  const { shapes, difficulty, rowCount, itemsPerRow, mode, includeSolutions } = settings;

  const update = <K extends keyof MusterSettings>(
    key: K,
    nextValue: MusterSettings[K],
  ) => setSettings({ ...settings, [key]: nextValue });

  const [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null),
    [preview, setPreview] = useState<{ url: string; filename: string } | null>(
      null,
    );

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    window.location.reload();
  };

  const blocked = !quota.isPaid && quota.remaining !== null && quota.remaining <= 0;
  const canSubmit = shapes.length >= 2;

  const toggleShape = (id: ShapeId) => {
    const next = shapes.includes(id)
      ? shapes.length > 2
        ? shapes.filter((s) => s !== id)
        : shapes // enforce minimum 2
      : [...shapes, id];
    update("shapes", sortShapes(next));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked || !canSubmit) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/worksheet/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "denken-muster",
          childId,
          shapes,
          difficulty,
          rowCount,
          itemsPerRow,
          mode,
          includeSolutions,
        }),
      });
      if (!response.ok) {
        if (response.status === 429) {
          capture("paywall_hit", { trigger: "rate_limit" });
          setError("Tageslimit erreicht. Mit Family Pro freischalten.");
        } else {
          const text = await response.text();
          console.warn("generate failed:", response.status, text);
          setError("Konnte das Übungsblatt nicht erstellen. Bitte erneut versuchen.");
        }
        return;
      }
      capture("worksheet_generated", {
        operation: "muster",
        range_min: 0,
        range_max: 0,
        count: rowCount,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Denken - Muster fortsetzen (${difficulty}).pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs">
            Mindestens 2 Formen auswählen. Aktuell:{" "}
            <span className="text-foreground font-medium">{shapes.length}</span> / 8
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SHAPE_IDS.map((id) => {
              const selected = shapes.includes(id),
                isLast = selected && shapes.length <= 2;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleShape(id)}
                  disabled={isLast}
                  aria-pressed={selected}
                  title={isLast ? "Mindestens 2 Formen müssen ausgewählt sein." : undefined}
                  className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs font-medium transition ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : isLast
                        ? "cursor-not-allowed opacity-40"
                        : "border-border hover:bg-accent"
                  }`}
                >
                  <span className="relative h-10 w-10">
                    <Image
                      src={SHAPE_IMAGE_SRC[id]}
                      alt={SHAPE_LABELS[id]}
                      fill
                      sizes="40px"
                      className="object-contain"
                    />
                  </span>
                  {SHAPE_LABELS[id]}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aufgabentyp</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={mode}
            onValueChange={(value) => update("mode", value as PatternMode)}
            className="flex flex-col gap-2"
          >
            {PATTERN_MODE_IDS.map((m) => (
              <Label
                key={m}
                htmlFor={`mode-${m}`}
                className="border-border hover:bg-accent flex cursor-pointer items-start gap-3 rounded-md border p-3"
              >
                <RadioGroupItem id={`mode-${m}`} value={m} className="mt-0.5" />
                <div className="flex flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{PATTERN_MODE_LABELS[m]}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${MODE_DIFFICULTY_PILL_CLASS[m]}`}
                    >
                      {PATTERN_MODE_DIFFICULTY[m]}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {PATTERN_MODE_DESCRIPTIONS[m]}
                  </span>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schwierigkeitsgrad</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={difficulty}
            onValueChange={(value) => update("difficulty", value as Difficulty)}
            className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          >
            {DIFFICULTY_IDS.map((d) => (
              <Label
                key={d}
                htmlFor={`diff-${d}`}
                className="border-border hover:bg-accent flex cursor-pointer flex-col items-center gap-1 rounded-md border p-3"
              >
                <RadioGroupItem id={`diff-${d}`} value={d} />
                <span className="text-sm font-medium">{DIFFICULTY_LABELS[d]}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PATTERN_DIFFICULTY_PILL_CLASS[d]}`}
                >
                  {DIFFICULTY_DIFFICULTY_LABEL[d]}
                </span>
                <span className="text-muted-foreground text-xs tracking-widest">
                  {DIFFICULTY_EXAMPLES[d]}
                </span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Reihen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {ROW_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("rowCount", n)}
                aria-pressed={rowCount === n}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition ${
                  rowCount === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Felder pro Reihe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {ITEMS_PER_ROW_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("itemsPerRow", n)}
                aria-pressed={itemsPerRow === n}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md border py-2 text-sm font-medium transition ${
                  itemsPerRow === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span>{n}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${ITEMS_PER_ROW_PILL_CLASS[n]}`}
                >
                  {ITEMS_PER_ROW_DIFFICULTY_LABEL[n]}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={includeSolutions}
              onChange={(event) =>
                update("includeSolutions", event.target.checked)
              }
              className="accent-brand-accent size-4"
            />
            <span className="text-sm font-medium">Lösungsblatt mitdrucken</span>
            <span className="text-muted-foreground ml-auto text-xs">
              {includeSolutions ? "ja" : "nein"}
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {!quota.isPaid && quota.remaining !== null && quota.limit !== null && (
          <p className="text-muted-foreground text-sm">
            Heute noch{" "}
            <span className="text-foreground font-medium">{quota.remaining}</span> von{" "}
            {quota.limit} Arbeitsblättern verfügbar.
          </p>
        )}
        {blocked ? (
          <Button render={<Link href="/app/account" />}>Family Pro freischalten</Button>
        ) : (
          <Button type="submit" disabled={pending || !canSubmit} size="lg">
            {pending ? "Wird erstellt…" : "Arbeitsblatt erstellen"}
          </Button>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
      {preview && (
        <WorksheetPreview
          url={preview.url}
          filename={preview.filename}
          onClose={closePreview}
        />
      )}
    </form>
  );
};
