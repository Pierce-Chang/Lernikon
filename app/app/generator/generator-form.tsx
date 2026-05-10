"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXERCISE_COUNTS, OPERATIONS, type Operation } from "@/lib/worksheet/config";
import { capture } from "@/lib/analytics/client";

export interface QuotaProps {
  isPaid: boolean;
  used: number;
  remaining: number | null;
  limit: number | null;
}

const OPERATION_LABELS: Record<Operation, string> = {
  addition: "Addition (+)",
  subtraktion: "Subtraktion (−)",
};

const todaySlug = (childName: string) => {
  const date = new Date().toISOString().slice(0, 10);
  return `lernikon-${childName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${date}.pdf`;
};

export const GeneratorForm = ({
  childName,
  quota,
}: {
  childName: string;
  quota: QuotaProps;
}) => {
  const [operation, setOperation] = useState<Operation>("addition"),
    [range, setRange] = useState<[number, number]>([1, 20]),
    [count, setCount] = useState<number>(10),
    [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null);

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
          subject: "mathe",
          operation,
          rangeMin: range[0],
          rangeMax: range[1],
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
        a = document.createElement("a");
      a.href = url;
      a.download = todaySlug(childName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.location.reload();
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
            onValueChange={(value) => setOperation(value as Operation)}
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
            <span>von {range[0]}</span>
            <span>bis {range[1]}</span>
          </div>
          <Slider
            value={range}
            min={1}
            max={100}
            step={1}
            onValueChange={(value) => {
              const arr = Array.isArray(value) ? value : [value];
              if (arr.length >= 2) setRange([arr[0], arr[1]] as [number, number]);
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
            onValueChange={(value) => setCount(Number(value))}
            className="grid grid-cols-4 gap-2"
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
    </form>
  );
};
