"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  ROW_IDS,
  COUNT_OPTIONS,
  ROW_DIFFICULTY_LABEL,
  type RowId,
  type Count,
} from "@/lib/worksheet/einmaleins/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface EinmaleinsSettings {
  rows: RowId[];
  count: Count;
  includeSolutions: boolean;
}

const DEFAULT_SETTINGS: EinmaleinsSettings = {
  rows: [...ROW_IDS],
  count: 15,
  includeSolutions: true,
};

/**
 * Pill background + text color per difficulty label. Mirrors the muster form
 * so all topics share one Ampel palette (emerald / amber / rose).
 */
const DIFFICULTY_PILL_CLASS: Record<string, string> = {
  Einfach: "bg-emerald-100 text-emerald-700",
  Mittel: "bg-amber-100 text-amber-700",
  Schwer: "bg-rose-100 text-rose-700",
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const EinmaleinsFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<EinmaleinsSettings>(
    "lernikon.settings.mathe-einmaleins",
    DEFAULT_SETTINGS,
  );
  const { rows, count, includeSolutions } = settings;
  const update = <K extends keyof EinmaleinsSettings>(
    key: K,
    nextValue: EinmaleinsSettings[K],
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

  /** Toggle a row chip on/off; at least one must remain selected. */
  const toggleRow = (row: RowId) => {
    if (rows.includes(row)) {
      if (rows.length === 1) return; // keep at least one
      update("rows", rows.filter((r) => r !== row));
    } else {
      update("rows", ([...rows, row].sort((a, b) => a - b) as RowId[]));
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/worksheet/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "mathe-einmaleins",
          childId,
          rows,
          count,
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
        operation: "einmaleins",
        range_min: Math.min(...rows),
        range_max: Math.max(...rows),
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Mathe - Einmaleins.pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      {/* Reihen multiselect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reihen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {ROW_IDS.map((row) => {
              const selected = rows.includes(row),
                diffLabel = ROW_DIFFICULTY_LABEL[row],
                pillClass = DIFFICULTY_PILL_CLASS[diffLabel] ?? "bg-gray-100 text-gray-700";
              return (
                <div key={row} className="flex flex-col items-center gap-1">
                  <span
                    className={`rounded px-1 py-0.5 text-[8px] font-semibold leading-none ${pillClass}`}
                  >
                    {diffLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleRow(row)}
                    className={`flex h-12 w-full items-center justify-center rounded-md border text-lg font-bold transition ${
                      selected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {row}
                  </button>
                </div>
              );
            })}
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

      {/* Lösungsblatt */}
      <Card>
        <CardContent className="pt-6">
          <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={includeSolutions}
              onChange={(event) => update("includeSolutions", event.target.checked)}
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
