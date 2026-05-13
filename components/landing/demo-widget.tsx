"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PillToggleGroup } from "./pill-toggle-group";
import { DemoMockup, type DemoRange, type DemoOperation } from "./demo-mockup";
import { DemoPrinterAnimation } from "./demo-printer-animation";
import { DemoToast } from "./demo-toast";

const RANGE_OPTIONS: { value: DemoRange; label: string }[] = [
  { value: "10", label: "1 bis 10" },
  { value: "20", label: "1 bis 20" },
  { value: "100", label: "1 bis 100" },
];

// Note: minus uses Unicode minus sign U+2212, not ASCII hyphen.
const OPERATION_OPTIONS: { value: DemoOperation; label: string }[] = [
  { value: "plus", label: "+" },
  { value: "minus", label: "−" },
  { value: "gemischt", label: "+ und −" },
];

const ANIMATION_DURATION_MS = 1200;

/**
 * Interactive demo widget on the landing page.
 * Lets visitors configure a sample worksheet and see a mock preview.
 */
export function DemoWidget() {
  const [range, setRange] = useState<DemoRange>("10");
  const [operation, setOperation] = useState<DemoOperation>("plus");
  const [animating, setAnimating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleCreate = () => {
    if (animating) return;
    setShowToast(false);
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      setShowToast(true);
    }, ANIMATION_DURATION_MS);
  };

  return (
    <section
      id="demo"
      className="mx-auto w-full max-w-5xl px-6 py-20"
    >
      {/* Section header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Schau mal, was rauskommt.
        </h2>
        <div className="bg-brand-accent mx-auto mt-3 h-1 w-10 rounded-full" />
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-balance text-sm">
          Konfiguriere ein Mathe-Blatt und sieh, wie es für dein Kind aussehen würde.
        </p>
      </div>

      {/* Two-column grid: controls left, mockup right */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Controls column. Below lg, the grid collapses to one column and
            we center the controls to mirror the mockup below. */}
        <div className="mx-auto flex w-full max-w-sm flex-col gap-6 lg:mx-0 lg:max-w-none">
          <PillToggleGroup
            label="Zahlenraum"
            value={range}
            onChange={setRange}
            options={RANGE_OPTIONS}
          />
          <PillToggleGroup
            label="Rechenart"
            value={operation}
            onChange={setOperation}
            options={OPERATION_OPTIONS}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={animating}
            onClick={handleCreate}
          >
            {animating ? "Wird erstellt..." : "Übungsblatt erstellen"}
          </Button>
        </div>

        {/* Mockup column with printer animation overlay.
            max-w-sm caps the A4-ratio card so it does not grow unbounded
            on wide viewports. Smaller cap keeps the absolute height in check
            while preserving the portrait ratio. */}
        <div className="relative mx-auto w-full max-w-sm">
          <DemoMockup range={range} operation={operation} />
          <DemoPrinterAnimation show={animating} />
        </div>
      </div>

      {/* Conversion toast */}
      <DemoToast show={showToast} onClose={() => setShowToast(false)} />
    </section>
  );
}
