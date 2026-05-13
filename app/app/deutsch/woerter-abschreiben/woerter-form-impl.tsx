"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  KLASSE_OPTIONS,
  COUNT_OPTIONS,
  LINES_PER_WORD_OPTIONS,
  STYLE_OPTIONS,
  STYLE_LABELS,
  STYLE_HINTS,
  type Klasse,
  type Count,
  type LinesPerWord,
  type LetterStyle,
} from "@/lib/worksheet/woerter-abschreiben/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

interface WoerterSettings {
  klasse: Klasse;
  count: Count;
  linesPerWord: LinesPerWord;
  style: LetterStyle;
}

/** Clamps the child's grade to the nearest valid Klasse option (1 or 2). */
const gradeToKlasse = (grade: number): Klasse => {
  if (grade === 2) return 2;
  return 1; // 0 (Vorschule), 1, and anything outside [1,2] default to 1
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const WoerterFormImpl = ({
  childId,
  childGrade,
  quota,
}: {
  childId: string;
  childGrade: number;
  quota: QuotaProps;
}) => {
  // Default klasse is derived from the child profile grade.
  // useLocalSettings merges over this default, so returning users keep their last choice.
  const defaultSettings: WoerterSettings = {
    klasse: gradeToKlasse(childGrade),
    count: 8,
    linesPerWord: 2,
    style: "druck",
  };

  const [settings, setSettings] = useLocalSettings<WoerterSettings>(
    "lernikon.settings.deutsch-woerter-abschreiben",
    defaultSettings,
  );

  // Sanitize stale style values so older localStorage cannot break the schema.
  const validStyles = STYLE_OPTIONS as readonly string[];
  if (!validStyles.includes(settings.style as string)) {
    setSettings({ ...settings, style: "druck" });
  }

  const { klasse, count, linesPerWord, style } = settings;
  const update = <K extends keyof WoerterSettings>(
    key: K,
    nextValue: WoerterSettings[K],
  ) => setSettings({ ...settings, [key]: nextValue });

  const [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null),
    [preview, setPreview] = useState<{ url: string; filename: string } | null>(null);

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
    window.location.reload();
  };

  const blocked = !quota.isPaid && quota.remaining !== null && quota.remaining <= 0;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/worksheet/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "deutsch-woerter-abschreiben",
          childId,
          klasse,
          count,
          linesPerWord,
          style,
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
        operation: "woerter-abschreiben",
        range_min: 0,
        range_max: 0,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Deutsch - Woerter abschreiben - Klasse ${klasse}.pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      {/* Klasse toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Klasse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {KLASSE_OPTIONS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => update("klasse", k)}
                aria-pressed={klasse === k}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  klasse === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                Klasse {k}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anzahl Wörter toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Wörter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("count", n)}
                aria-pressed={count === n}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  count === n
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

      {/* Zeilen pro Wort toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zeilen pro Wort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {LINES_PER_WORD_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("linesPerWord", n)}
                aria-pressed={linesPerWord === n}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  linesPerWord === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {n === 1 ? "1 Zeile" : `${n} Zeilen`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schrift radio — only rendered when there's more than one option. */}
      {STYLE_OPTIONS.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schrift</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={style}
              onValueChange={(value) => update("style", value as LetterStyle)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {STYLE_OPTIONS.map((s) => (
                <Label
                  key={s}
                  htmlFor={`style-${s}`}
                  className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
                >
                  <RadioGroupItem id={`style-${s}`} value={s} />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">{STYLE_LABELS[s]}</span>
                    <span className="text-muted-foreground text-xs">{STYLE_HINTS[s]}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

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
          <Button type="submit" disabled={pending} size="lg">
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
