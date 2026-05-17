"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  SHAPE_IDS,
  SHAPE_LABELS,
  TOTAL_COUNT_OPTIONS,
  SCHWIERIGKEIT_OPTIONS,
  SCHWIERIGKEIT_LABELS,
  type Schwierigkeit,
  type TotalCount,
} from "@/lib/worksheet/denken-formen-erkennen/config";
import type { ShapeId } from "@/lib/worksheet/denken-formen-erkennen/shapes";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

interface FormenErkennenSettings {
  zielForm: ShapeId;
  totalCount: TotalCount;
  schwierigkeit: Schwierigkeit;
  solutions: boolean;
}

const DEFAULT_SETTINGS: FormenErkennenSettings = {
  zielForm: "quadrat",
  totalCount: 12,
  schwierigkeit: "einfach",
  solutions: true,
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

/** Tailwind pill classes for schwierigkeit options. */
const SCHWIERIGKEIT_PILL_CLASS: Record<Schwierigkeit, string> = {
  einfach: "bg-emerald-100 text-emerald-700",
  mittel: "bg-amber-100 text-amber-700",
};

export const FormenErkennenFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<FormenErkennenSettings>(
    "lernikon.settings.denken-formen-erkennen",
    DEFAULT_SETTINGS,
  );
  const { zielForm, totalCount, schwierigkeit, solutions } = settings;

  const update = <K extends keyof FormenErkennenSettings>(
    key: K,
    nextValue: FormenErkennenSettings[K],
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

  const blocked =
    !quota.isPaid && quota.remaining !== null && quota.remaining <= 0;

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked) return;
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/worksheet/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "denken-formen-erkennen",
          childId,
          zielForm,
          totalCount,
          schwierigkeit,
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
          setError(
            "Konnte das Ubungsblatt nicht erstellen. Bitte erneut versuchen.",
          );
        }
        return;
      }
      // [decision] worksheet_generated AnalyticsProps requires range_min/range_max/count
      // which have no direct equivalent here. Using range_min=0, range_max=0, count=totalCount
      // as per the mathe-division pattern for non-arithmetic worksheets.
      capture("worksheet_generated", {
        operation: "formen-erkennen",
        range_min: 0,
        range_max: 0,
        count: totalCount,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Denken - Formen erkennen (${zielForm}, ${schwierigkeit}).pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      {/* Ziel-Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ziel-Form</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SHAPE_IDS.map((id) => {
              const selected = zielForm === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => update("zielForm", id)}
                  aria-pressed={selected}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {SHAPE_LABELS[id]}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Anzahl Formen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Formen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {TOTAL_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("totalCount", n)}
                aria-pressed={totalCount === n}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition ${
                  totalCount === n
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

      {/* Schwierigkeit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schwierigkeit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {SCHWIERIGKEIT_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("schwierigkeit", s)}
                aria-pressed={schwierigkeit === s}
                className={`flex flex-1 flex-col items-center gap-1 rounded-md border py-3 text-sm font-medium transition ${
                  schwierigkeit === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                <span>{SCHWIERIGKEIT_LABELS[s]}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SCHWIERIGKEIT_PILL_CLASS[s]}`}
                >
                  {s === "einfach" ? "2-3 Formen" : "4-5 Formen"}
                </span>
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Einfach: deutlich verschiedene Ablenkformen. Mittel: ahnliche Formen sind dabei.
          </p>
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
            <span className="text-foreground font-medium">{quota.remaining}</span>{" "}
            von {quota.limit} Arbeitsblatter verfugbar.
          </p>
        )}
        {blocked ? (
          <Button render={<Link href="/app/account" />}>
            Family Pro freischalten
          </Button>
        ) : (
          <Button type="submit" disabled={pending} size="lg">
            {pending ? "Wird erstellt..." : "Arbeitsblatt erstellen"}
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
