"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { THEMES, type Theme, type ThemeId } from "@/lib/themes";
import { capture } from "@/lib/analytics/client";

/**
 * Visual theme picker used by onboarding + account forms.
 *
 * - Shows the PNG illustration as the tile (no emoji fallback)
 * - Pro themes display a lock badge for free users
 * - Tapping a locked theme fires `paywall_hit{trigger:theme_locked}`,
 *   keeps the previous selection, and reveals an inline upgrade CTA.
 */
export const ThemePicker = ({
  value,
  onChange,
  isPaid,
}: {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  isPaid: boolean;
}) => {
  const [paywallVisible, setPaywallVisible] = useState(false);

  const handleClick = (theme: Theme) => {
    if (theme.pro && !isPaid) {
      capture("paywall_hit", { trigger: "theme_locked" });
      setPaywallVisible(true);
      return;
    }
    onChange(theme.id);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {THEMES.map((theme) => {
          const locked = theme.pro && !isPaid,
            selected = theme.id === value;
          return (
            <button
              type="button"
              key={theme.id}
              onClick={() => handleClick(theme)}
              aria-pressed={selected}
              aria-label={
                locked
                  ? `${theme.label} (Family Pro)`
                  : theme.label
              }
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                selected
                  ? "border-brand-accent bg-brand-accent/10"
                  : "border-border hover:bg-accent"
              } ${locked ? "opacity-70" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={theme.assetPath}
                alt={theme.label}
                className="size-16 object-contain"
              />
              <span className="text-sm font-medium leading-tight">
                {theme.label}
              </span>
              <span className="text-muted-foreground text-xs leading-tight">
                {locked ? "Family Pro" : theme.description}
              </span>
              {locked && (
                <span className="bg-brand text-white absolute right-2 top-2 flex size-6 items-center justify-center rounded-full shadow-sm">
                  <Lock className="size-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      {paywallVisible && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Das Theme ist Teil von Family Pro.{" "}
          <Link
            href="/app/account?upgrade=themes"
            className="font-medium underline"
          >
            Jetzt freischalten →
          </Link>
        </div>
      )}
    </div>
  );
};
