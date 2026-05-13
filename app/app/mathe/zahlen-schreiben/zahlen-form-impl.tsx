"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  DIGITS,
  LINES_PER_DIGIT_OPTIONS,
  type LinesPerDigit,
} from "@/lib/worksheet/number-tracing/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

interface ZahlenSettings {
  digits: string[];
  linesPerDigit: LinesPerDigit;
}

const DEFAULT_SETTINGS: ZahlenSettings = {
  digits: ["0"],
  linesPerDigit: 1,
};

/** Canonical position of a digit in DIGITS — used to keep the user's
 * selection in numeric order regardless of toggle sequence. */
const digitIndex = (digit: string) => DIGITS.indexOf(digit as (typeof DIGITS)[number]);

const buildFilename = (digits: string[]) =>
  `Lernikon - Mathe - Zahlen schreiben (${digits.join(",")}).pdf`;

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const ZahlenFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<ZahlenSettings>(
    "lernikon.settings.mathe-zahlen-schreiben",
    DEFAULT_SETTINGS,
  );
  const { digits, linesPerDigit } = settings;
  const update = <K extends keyof ZahlenSettings>(
    key: K,
    nextValue: ZahlenSettings[K],
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
  const canSubmit = digits.length >= 1 && digits.length <= 10;

  const toggleDigit = (digit: string) => {
    const next = digits.includes(digit)
      ? digits.filter((d) => d !== digit)
      : digits.length < 10
        ? [...digits, digit].sort((a, b) => digitIndex(a) - digitIndex(b))
        : digits;
    if (next !== digits) update("digits", next);
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
          topic: "mathe-zahlen-schreiben",
          childId,
          digits,
          linesPerDigit,
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
        operation: "zahlen-schreiben",
        range_min: 0,
        range_max: 9,
        count: digits.length,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = buildFilename(digits),
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ziffern</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-muted-foreground text-xs">
            Wähle bis zu 10 Ziffern. Aktuell:{" "}
            <span className="text-foreground font-medium">{digits.length}</span> / 10
          </p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {DIGITS.map((digit) => {
              const selected = digits.includes(digit),
                disabled = !selected && digits.length >= 10;
              return (
                <button
                  key={digit}
                  type="button"
                  onClick={() => toggleDigit(digit)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`flex h-12 items-center justify-center rounded-md border text-base font-medium transition ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : disabled
                        ? "border-border text-muted-foreground/40 cursor-not-allowed"
                        : "border-border hover:bg-accent"
                  }`}
                >
                  {digit}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zeilen pro Ziffer</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={String(linesPerDigit)}
            onValueChange={(value) =>
              update("linesPerDigit", Number(value) as LinesPerDigit)
            }
            className="grid grid-cols-4 gap-2"
          >
            {LINES_PER_DIGIT_OPTIONS.map((n) => (
              <Label
                key={n}
                htmlFor={`lines-${n}`}
                className="border-border hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3"
              >
                <RadioGroupItem id={`lines-${n}`} value={String(n)} />
                <span className="text-sm font-medium">
                  {n === 1 ? "1 Zeile" : `${n} Zeilen`}
                </span>
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
