"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface SimpleSentencesSettings {
  count: 10 | 15 | 20;
  includeSolutions: boolean;
}

const COUNT_OPTIONS = [10, 15, 20] as const;

const DEFAULT_SETTINGS: SimpleSentencesSettings = {
  count: 15,
  includeSolutions: true,
};

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const SimpleSentencesFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<SimpleSentencesSettings>(
    "lernikon.settings.englisch-simple-sentences",
    DEFAULT_SETTINGS,
  );
  const { count = 15, includeSolutions = true } = settings;

  const update = <K extends keyof SimpleSentencesSettings>(
    key: K,
    nextValue: SimpleSentencesSettings[K],
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
          topic: "englisch-simple-sentences",
          childId,
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
          setError(
            "Konnte das Ubungsblatt nicht erstellen. Bitte erneut versuchen.",
          );
        }
        return;
      }
      capture("worksheet_generated", {
        operation: "englisch-simple-sentences",
        range_min: 0,
        range_max: 0,
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = "Lernikon - Englisch - Simple Sentences.pdf",
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      {/* Anzahl Satze */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Satze</CardTitle>
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
        <CardHeader>
          <CardTitle className="text-base">Losungsblatt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {([true, false] as const).map((val) => (
              <button
                key={String(val)}
                type="button"
                onClick={() => update("includeSolutions", val)}
                aria-pressed={includeSolutions === val}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  includeSolutions === val
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {val ? "Mit Losungen" : "Ohne Losungen"}
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
            von {quota.limit} Arbeitsblattern verfugbar.
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
