"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorksheetPreview } from "@/components/worksheet-preview";
import { EXERCISE_COUNTS, OPERATIONS, type Operation } from "@/lib/worksheet/config";
import { useLocalSettings } from "@/lib/hooks/use-local-settings";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

interface RechnenSettings {
  operation: Operation;
  range: [number, number];
  count: number;
  includeSolutions: boolean;
}

const DEFAULT_SETTINGS: RechnenSettings = {
  operation: "addition",
  range: [1, 10],
  count: 12,
  includeSolutions: true,
};

const OPERATION_LABELS: Record<Operation, string> = {
  addition: "Addition (+)",
  subtraktion: "Subtraktion (−)",
  gemischt: "Gemischt (+/−)",
};

const OPERATION_FILENAME: Record<Operation, string> = {
  addition: "Addition",
  subtraktion: "Subtraktion",
  gemischt: "Gemischt",
};

const buildFilename = (operation: Operation, rangeMin: number, rangeMax: number) =>
  `Lernikon - Mathe - ${OPERATION_FILENAME[operation]} ${rangeMin}-${rangeMax}.pdf`;

const filenameFromResponse = (response: Response, fallback: string): string => {
  const header = response.headers.get("content-disposition");
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? fallback;
};

export const RechnenFormImpl = ({
  childId,
  quota,
}: {
  childId: string;
  quota: QuotaProps;
}) => {
  const [settings, setSettings] = useLocalSettings<RechnenSettings>(
    "lernikon.settings.mathe-rechnen",
    DEFAULT_SETTINGS,
  );
  const { operation, range, count, includeSolutions } = settings;
  const update = <K extends keyof RechnenSettings>(
    key: K,
    nextValue: RechnenSettings[K],
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
          topic: "mathe-rechnen",
          childId,
          operation,
          rangeMin: range[0],
          rangeMax: range[1],
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
        operation,
        range_min: range[0],
        range_max: range[1],
        count,
      });
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        fallback = buildFilename(operation, range[0], range[1]),
        filename = filenameFromResponse(response, fallback);
      setPreview({ url, filename });
    });
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rechenart</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={operation}
            onValueChange={(value) => update("operation", value as Operation)}
            className="grid grid-cols-2 gap-2"
          >
            {OPERATIONS.map((op) => (
              <Label
                key={op}
                htmlFor={`op-${op}`}
                className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
              >
                <RadioGroupItem id={`op-${op}`} value={op} />
                <span className="text-sm font-medium">{OPERATION_LABELS[op]}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zahlenraum</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>Zahlen ab {range[0]}</span>
            <span>Ergebnis bis {range[1]}</span>
          </div>
          <Slider
            value={range}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => {
              const arr = Array.isArray(value) ? value : [value];
              if (arr.length >= 2)
                update("range", [arr[0], arr[1]] as [number, number]);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anzahl Aufgaben</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={String(count)}
            onValueChange={(value) => update("count", Number(value))}
            className="grid grid-cols-3 gap-2 sm:grid-cols-5"
          >
            {EXERCISE_COUNTS.map((n) => (
              <Label
                key={n}
                htmlFor={`count-${n}`}
                className="border-border hover:bg-accent flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3"
              >
                <RadioGroupItem id={`count-${n}`} value={String(n)} />
                <span className="text-sm font-medium">{n}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <label className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={includeSolutions}
              onChange={(event) =>
                update("includeSolutions", event.target.checked)
              }
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
