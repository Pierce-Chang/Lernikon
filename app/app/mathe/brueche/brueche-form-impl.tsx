"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import {
  MODUS_OPTIONS,
  COUNT_OPTIONS_DARSTELLEN,
  COUNT_OPTIONS_VERGLEICHEN_RECHNEN,
  MODUS_LABELS,
  type BruecheModus,
  type BruecheCount,
} from "@/lib/worksheet/brueche/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";
import type { QuotaProps } from "@/app/app/mathe/rechnen/rechnen-form-impl";

interface BruecheSettings {
  modus: BruecheModus;
  count: BruecheCount;
  solutions: boolean;
}

const DEFAULT_SETTINGS: BruecheSettings = {
  modus: "darstellen",
  count: 12,
  solutions: true,
};

/** Returns the count option list for the given modus. */
const countOptionsForModus = (m: BruecheModus) =>
  m === "darstellen"
    ? COUNT_OPTIONS_DARSTELLEN
    : COUNT_OPTIONS_VERGLEICHEN_RECHNEN;

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const BruecheFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<BruecheSettings>(
    "lernikon.settings.mathe-brueche",
    DEFAULT_SETTINGS,
  );
  const { modus, count, solutions } = settings;
  const update = <K extends keyof BruecheSettings>(
    key: K,
    nextValue: BruecheSettings[K],
  ) => setSettings({ ...settings, [key]: nextValue });

  // When modus changes, snap count to the middle of the new option list if the
  // current count is not valid for that modus.
  useEffect(() => {
    const options = countOptionsForModus(modus);
    if (!(options as readonly number[]).includes(count)) {
      const middle = options[Math.floor(options.length / 2)] as BruecheCount;
      setSettings({ ...settings, count: middle });
    }
  // count is intentionally excluded: we only want to react to modus changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modus]);

  const countOptions = countOptionsForModus(modus);

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
          topic: "mathe-brueche",
          childId,
          modus,
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
      capture("worksheet_generated", { operation: modus, range_min: 0, range_max: 0, count });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = "Lernikon - Mathe - Bruche.pdf",
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        Klasse 4. Drei Aufgabentypen: Bruche darstellen, vergleichen, rechnen.
      </p>

      {/* Modus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {MODUS_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update("modus", m)}
                aria-pressed={modus === m}
                className={`flex-1 rounded-md border py-3 text-sm font-medium transition ${
                  modus === m
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent"
                }`}
              >
                {MODUS_LABELS[m]}
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
            {countOptions.map((n) => (
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
