"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  OPERATION_OPTIONS,
  STELLEN_OPTIONS,
  COUNT_OPTIONS,
  OPERATION_LABELS,
  type SchriftlichOperation,
  type Stellen,
  type SchriftlichCount,
} from "@/lib/worksheet/schriftlich/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface SchriftlichSettings {
  operation: SchriftlichOperation;
  stellen: Stellen;
  count: SchriftlichCount;
  solutions: boolean;
}

const DEFAULT_SETTINGS: SchriftlichSettings = {
  operation: "addition",
  stellen: 3,
  count: 12,
  solutions: true,
};

const STELLEN_LABELS: Record<Stellen, string> = {
  3: "3-stellig",
  4: "4-stellig",
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const SchriftlichFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<SchriftlichSettings>(
    "lernikon.settings.mathe-schriftlich",
    DEFAULT_SETTINGS,
  );
  const { operation, stellen, count, solutions } = settings;
  const update = <K extends keyof SchriftlichSettings>(
    key: K,
    nextValue: SchriftlichSettings[K],
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
          topic: "mathe-schriftlich",
          childId,
          operation,
          stellen,
          count,
          solutions,
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
        operation,
        range_min: stellen === 3 ? 100 : 1000,
        range_max: stellen === 3 ? 999 : 9999,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Mathe - Schriftliche Verfahren.pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Klasse 4. Spaltenlayout mit Ubertrag und Losungen.
      </p>

      {/* Rechenart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rechenart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {OPERATION_OPTIONS.map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => update("operation", op)}
                aria-pressed={operation === op}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  operation === op
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {OPERATION_LABELS[op]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stellen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {STELLEN_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("stellen", s)}
                aria-pressed={stellen === s}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  stellen === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {STELLEN_LABELS[s]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anzahl Aufgaben */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Aufgaben</CardTitle>
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

      {/* Losungsblatt */}
      <Card>
        <CardContent className="pt-6">
          <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={solutions}
              onChange={(event) => update("solutions", event.target.checked)}
              className="accent-brand-accent size-4"
            />
            <span className="text-sm font-medium">Losungsblatt mitdrucken</span>
            <span className="text-muted-foreground ml-auto text-xs">
              {solutions ? "ja" : "nein"}
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
