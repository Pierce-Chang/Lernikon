"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import { PAAR_COUNT_OPTIONS, type PaarCount } from "@/lib/worksheet/denken-formen-zuordnen/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

interface FormenZuordnenSettings {
  paarCount: PaarCount;
  solutions: boolean;
}

const DEFAULT_SETTINGS: FormenZuordnenSettings = {
  paarCount: 6,
  solutions: true,
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const FormenZuordnenFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<FormenZuordnenSettings>(
    "lernikon.settings.denken-formen-zuordnen",
    DEFAULT_SETTINGS,
  );
  const { paarCount, solutions = true } = settings;

  const update = <K extends keyof FormenZuordnenSettings>(
    key: K,
    nextValue: FormenZuordnenSettings[K],
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
          topic: "denken-formen-zuordnen",
          childId,
          paarCount,
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
      // Analytics schema workaround: range_min=0, range_max=0, count=paarCount
      // (same pattern as mathe-division and formen-erkennen for non-arithmetic topics).
      capture("worksheet_generated", {
        operation: "formen-zuordnen",
        range_min: 0,
        range_max: 0,
        count: paarCount,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = `Lernikon - Denken - Formen zuordnen (${paarCount} Paare).pdf`,
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      {/* Anzahl Paare */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Paare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {PAAR_COUNT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => update("paarCount", n)}
                aria-pressed={paarCount === n}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition ${
                  paarCount === n
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
