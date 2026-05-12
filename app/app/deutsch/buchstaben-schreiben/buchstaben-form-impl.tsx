"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  AVAILABLE_LETTERS,
  LETTER_CASES,
  LETTER_CASE_LABELS,
  LETTER_STYLES,
  LETTER_STYLE_HINTS,
  LETTER_STYLE_LABELS,
  LINES_PER_LETTER,
  type LetterCase,
  type LetterStyle,
  type LinesPerLetter,
} from "@/lib/worksheet/letter-tracing/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

const MAX_LETTERS = 10;

interface BuchstabenSettings {
  letters: string[];
  letterCase: LetterCase;
  linesPerLetter: LinesPerLetter;
  style: LetterStyle;
}

const DEFAULT_SETTINGS: BuchstabenSettings = {
  letters: ["A"],
  letterCase: "upper",
  linesPerLetter: 3,
  style: "druck",
};

const buildFilename = (letters: string[], letterCase: LetterCase) =>
  `Lernikon - Deutsch - Buchstaben (${LETTER_CASE_LABELS[letterCase]}) ${letters.join(",")}.pdf`;

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const BuchstabenFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<BuchstabenSettings>(
    "lernikon.settings.deutsch-buchstaben-schreiben",
    DEFAULT_SETTINGS,
  );
  const { letters, letterCase, linesPerLetter, style } = settings;
  const update = <K extends keyof BuchstabenSettings>(
    key: K,
    nextValue: BuchstabenSettings[K],
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
  const canSubmit = letters.length >= 1 && letters.length <= MAX_LETTERS;

  const toggleLetter = (letter: string) => {
    const next = letters.includes(letter)
      ? letters.filter((l) => l !== letter)
      : letters.length < MAX_LETTERS
        ? [...letters, letter]
        : letters;
    if (next !== letters) update("letters", next);
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
          topic: "deutsch-buchstaben-schreiben",
          childId,
          letters,
          case: letterCase,
          linesPerLetter,
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
        operation: "buchstaben",
        range_min: 0,
        range_max: 0,
        count: letters.length,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = buildFilename(letters, letterCase),
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
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
            {LETTER_STYLES.map((s) => (
              <Label
                key={s}
                htmlFor={`style-${s}`}
                className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
              >
                <RadioGroupItem id={`style-${s}`} value={s} />
                <span className="flex flex-col">
                  <span className="text-sm font-medium">
                    {LETTER_STYLE_LABELS[s]}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {LETTER_STYLE_HINTS[s]}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buchstaben</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs">
            Wähle bis zu {MAX_LETTERS} Buchstaben. Aktuell:{" "}
            <span className="text-foreground font-medium">{letters.length}</span> /{" "}
            {MAX_LETTERS}
          </p>
          <div className="grid grid-cols-7 gap-2 sm:grid-cols-13">
            {AVAILABLE_LETTERS.map((letter) => {
              const selected = letters.includes(letter),
                disabled = !selected && letters.length >= MAX_LETTERS;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => toggleLetter(letter)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`flex h-10 items-center justify-center rounded-md border text-sm font-medium transition ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : disabled
                        ? "border-border text-muted-foreground/40 cursor-not-allowed"
                        : "border-border hover:bg-accent"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Groß- oder Kleinschreibung</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={letterCase}
            onValueChange={(value) => update("letterCase", value as LetterCase)}
            className="grid grid-cols-3 gap-2"
          >
            {LETTER_CASES.map((c) => (
              <Label
                key={c}
                htmlFor={`case-${c}`}
                className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
              >
                <RadioGroupItem id={`case-${c}`} value={c} />
                <span className="text-sm font-medium">{LETTER_CASE_LABELS[c]}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zeilen pro Buchstabe</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={String(linesPerLetter)}
            onValueChange={(value) =>
              update("linesPerLetter", Number(value) as LinesPerLetter)
            }
            className="grid grid-cols-3 gap-2"
          >
            {LINES_PER_LETTER.map((n) => (
              <Label
                key={n}
                htmlFor={`lines-${n}`}
                className="border-border hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3"
              >
                <RadioGroupItem id={`lines-${n}`} value={String(n)} />
                <span className="text-sm font-medium">{n} Zeilen</span>
              </Label>
            ))}
          </RadioGroup>
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
