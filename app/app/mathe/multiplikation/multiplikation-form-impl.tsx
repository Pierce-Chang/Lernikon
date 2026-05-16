"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  STELLEN_OPTIONS,
  COUNT_OPTIONS,
  STELLEN_LABELS,
  type MulStellen,
  type MulCount,
} from "@/lib/worksheet/multiplikation/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface MultiplikationSettings {
  stellen: MulStellen;
  count: MulCount;
  solutions: boolean;
  merkkasten: boolean;
}

const DEFAULT_SETTINGS: MultiplikationSettings = {
  stellen: "3x2",
  count: 8,
  solutions: true,
  merkkasten: false,
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const MultiplikationFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<MultiplikationSettings>(
    "lernikon.settings.mathe-multiplikation",
    DEFAULT_SETTINGS,
  );
  const { stellen, count, solutions, merkkasten = false } = settings;
  const update = <K extends keyof MultiplikationSettings>(
    key: K,
    nextValue: MultiplikationSettings[K],
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
          topic: "mathe-multiplikation",
          childId,
          stellen,
          count,
          solutions,
          merkkasten,
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
        operation: "multiplikation",
        range_min: 100,
        range_max: stellen === "3x2" ? 9999 : 999,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Mathe - Schriftliche Multiplikation.pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Klasse 4. Schriftliche Multiplikation mit Teilprodukten und Losungsblatt.
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
