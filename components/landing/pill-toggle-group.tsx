"use client";

import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/** Single option shape for PillToggleGroup. */
interface PillOption<T extends string> {
  value: T;
  label: string;
}

/** Props for PillToggleGroup. */
interface PillToggleGroupProps<T extends string> {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: PillOption<T>[];
  className?: string;
}

/**
 * Controlled pill-style single-select radio group.
 * Left/Right arrow keys cycle through options. Enter/Space selects.
 */
export function PillToggleGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
}: PillToggleGroupProps<T>) {
  const currentIndex = options.findIndex((o) => o.value === value);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (currentIndex + 1) % options.length;
      onChange(options[next].value);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (currentIndex - 1 + options.length) % options.length;
      onChange(options[prev].value);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex flex-wrap gap-2"
        onKeyDown={handleKeyDown}
      >
        {options.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                isActive
                  ? "bg-brand text-white"
                  : "border border-border bg-card text-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
