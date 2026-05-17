"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  STELLEN_OPTIONS,
  COUNT_OPTIONS,
  VERFAHREN_OPTIONS,
  STELLEN_LABELS,
  VERFAHREN_LABELS,
  type DivStellen,
  type DivCount,
  type DivVerfahren,
} from "@/lib/worksheet/division/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface DivisionSettings {
  stellen: DivStellen;
  count: DivCount;
  verfahren: DivVerfahren;
  mitRest: boolean;
  merkkasten: boolean;
  solutions: boolean;
}

const DEFAULT_SETTINGS: DivisionSettings = {
  stellen: "3:1",
  count: 8,
  verfahren: "abzieh",
  mitRest: false,
  merkkasten: false,
  solutions: true,
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const DivisionFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<DivisionSettings>(
    "lernikon.settings.mathe-division",
    DEFAULT_SETTINGS,
  );
  const {
    stellen,
    count,
    verfahren = "abzieh",
    mitRest = false,
    merkkasten = false,
    solutions = true,
  } = settings;

  const update = <K extends keyof DivisionSettings>(
    key: K,
    nextValue: DivisionSettings[K],
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
          topic: "mathe-division",
          childId,
          stellen,
          count,
          verfahren,
          mitRest,
          merkkasten,
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
        operation: "division",
        range_min: stellen === "3:1" ? 100 : 1000,
        range_max: stellen === "3:1" ? 999 : 9999,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Mathe - Schriftliche Division.pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Klasse 4. Schriftliche Division mit Heruntergeholt-Verfahren und optionalem Losungsblatt.
      </p>

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

      {/* Verfahren */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verfahren</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {VERFAHREN_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => update("verfahren", v)}
                aria-pressed={verfahren === v}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  verfahren === v
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {VERFAHREN_LABELS[v]}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Welches Verfahren in der Schule deines Kindes geubt wird. Im Zweifel: Abziehverfahren ist der haufigere Standard.
          </p>
        </CardContent>
      </Card>

      {/* Mit Rest */}
      <Card>
        <CardContent className="pt-6">
          <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={mitRest}
              onChange={(event) => update("mitRest", event.target.checked)}
              className="accent-brand-accent size-4"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Aufgaben mit Rest zulassen</span>
              <span className="text-muted-foreground text-xs">
                Wenn aus, gehen alle Aufgaben restfrei auf.
              </span>
            </div>
            <span className="text-muted-foreground ml-auto text-xs">
              {mitRest ? "ja" : "nein"}
            </span>
          </label>
        </CardContent>
      </Card>

      {/* Merkkasten */}
      <Card>
        <CardContent className="pt-6">
          <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={merkkasten}
              onChange={(event) => update("merkkasten", event.target.checked)}
              className="accent-brand-accent size-4"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">Merkkasten mitdrucken</span>
              <span className="text-muted-foreground text-xs">
                Kleiner Erklarkasten oben auf dem Blatt, falls dein Kind oder du das Verfahren nochmal nachlesen wollt.
              </span>
            </div>
            <span className="text-muted-foreground ml-auto text-xs">
              {merkkasten ? "ja" : "nein"}
            </span>
          </label>
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
