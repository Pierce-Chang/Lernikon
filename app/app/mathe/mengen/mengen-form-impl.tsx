"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import { RANGE_IDS, RANGE_LABELS, COUNT_OPTIONS, type RangeId, type CountOption } from "@/lib/worksheet/mengen/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

interface MengenSettings {
  range: RangeId;
  count: CountOption;
}

const DEFAULT_SETTINGS: MengenSettings = {
  range: "1-10",
  count: 12,
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const MengenFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [rawSettings, setSettings] = useLocalSettings<MengenSettings>(
    "lernikon.settings.mathe-mengen",
    DEFAULT_SETTINGS,
  );
  // Sanitize a stale count=18 that may linger in localStorage.
  const settings: MengenSettings = {
    ...rawSettings,
    count: (rawSettings.count as number) === 18 ? 12 : rawSettings.count,
  };
  const { range, count } = settings;
  const update = <K extends keyof MengenSettings>(
    key: K,
    nextValue: MengenSettings[K],
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
      const rangeMax = range === "1-5" ? 5 : 10,
        response = await fetch("/api/worksheet/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topic: "mathe-mengen",
            childId,
            range,
            count,
          }),
        });
      if (!response.ok) {
        if (response.status === 429) {
          capture("paywall_hit", { trigger: "rate_limit" });
          setError("Tageslimit erreicht. Mit Family Pro freischalten.");
        } else {
          const text = await response.text();
          console.warn("generate failed:", response.status, text);
          setError("Konnte das Ubungsblatt nicht erstellen. Bitte erneut versuchen.");
        }
        return;
      }
      capture("worksheet_generated", {
        operation: `mengen-1-bis-${rangeMax}`,
        range_min: 1,
        range_max: rangeMax,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Mathe - Mengen 1-${rangeMax} (${count} Aufgaben).pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bereich</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {RANGE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => update("range", id)}
                aria-pressed={range === id}
                className={`flex h-12 items-center justify-center rounded-md border text-sm font-medium transition ${
                  range === id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {RANGE_LABELS[id]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl der Aufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("count", n)}
                aria-pressed={count === n}
                className={`flex h-12 items-center justify-center rounded-md border text-sm font-medium transition ${
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
