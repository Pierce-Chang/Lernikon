"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  BUCKET_IDS,
  BUCKET_LABELS,
  SCHRIFT_OPTIONS,
  SCHRIFT_LABELS,
  type BucketId,
  type Schrift,
} from "@/lib/worksheet/englisch-vokabeln-abschreiben/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface VokabelnSettings {
  buckets: BucketId[];
  count: 5 | 8 | 10;
  linesPerWord: 1 | 2 | 3;
  schrift: Schrift;
}

const COUNT_OPTIONS = [5, 8, 10] as const;
const LINES_OPTIONS = [1, 2, 3] as const;

const DEFAULT_SETTINGS: VokabelnSettings = {
  buckets: [...BUCKET_IDS],
  count: 8,
  linesPerWord: 2,
  schrift: "helvetica",
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const VokabelnFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<VokabelnSettings>(
    "lernikon.settings.englisch-vokabeln-abschreiben",
    DEFAULT_SETTINGS,
  );
  const {
    buckets = [...BUCKET_IDS],
    count = 8,
    linesPerWord = 2,
    schrift = "helvetica",
  } = settings;

  const update = <K extends keyof VokabelnSettings>(
    key: K,
    nextValue: VokabelnSettings[K],
  ) => setSettings({ ...settings, [key]: nextValue });

  const toggleBucket = (id: BucketId) => {
    if (buckets.includes(id)) {
      // Keep at least one bucket selected.
      if (buckets.length <= 1) return;
      update("buckets", buckets.filter((b) => b !== id));
    } else {
      update("buckets", [...buckets, id]);
    }
  };

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
          topic: "englisch-vokabeln-abschreiben",
          childId,
          buckets,
          count,
          linesPerWord,
          schrift,
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
            "Konnte das Übungsblatt nicht erstellen. Bitte erneut versuchen.",
          );
        }
        return;
      }
      capture("worksheet_generated", {
        operation: "englisch-vokabeln-abschreiben",
        range_min: 0,
        range_max: 0,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = "Lernikon - Englisch - Vokabeln abschreiben.pdf",
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      {/* Themen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Themen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BUCKET_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleBucket(id)}
                aria-pressed={buckets.includes(id)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  buckets.includes(id)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {BUCKET_LABELS[id]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anzahl Wörter */}
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

      {/* Zeilen pro Wort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zeilen pro Wort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {LINES_OPTIONS.map((n) => (
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
                {n}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Schrift */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schrift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SCHRIFT_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("schrift", s)}
                aria-pressed={schrift === s}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  schrift === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {SCHRIFT_LABELS[s]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {!quota.isPaid && quota.remaining !== null && quota.limit !== null && (
          <p className="text-muted-foreground text-sm">
            Heute noch{" "}
            <span className="text-foreground font-medium">{quota.remaining}</span>{" "}
            von {quota.limit} Arbeitsblättern verfügbar.
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
