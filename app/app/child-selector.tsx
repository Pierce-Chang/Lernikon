"use client";

import { useTransition } from "react";
import { setActiveChild } from "@/app/app/account/profile-actions";
import { getTheme, type ThemeId } from "@/lib/themes";

export interface ChildPill {
  id: string;
  name: string;
  theme: ThemeId;
}

/**
 * Pill-group switcher on the Dashboard. The currently active child uses the
 * gold accent on a navy-text background; the other pills are muted.
 * The parent gates rendering on `items.length > 1` already, but we also
 * short-circuit here so the component is safe to drop anywhere.
 *
 * Selection is persisted via the server action which writes
 * users.active_child_id. After the action, the RSC tree is revalidated and
 * the Dashboard re-renders with the new active child driving the greeting,
 * the "Klasse" pill, and the history filter.
 */
export const ChildSelector = ({
  items,
  activeId,
}: {
  items: ChildPill[];
  activeId: string;
}) => {
  const [pending, startTransition] = useTransition();

  if (items.length <= 1) return null;

  const select = (id: string) => {
    if (id === activeId || pending) return;
    startTransition(async () => {
      try {
        await setActiveChild({ id });
      } catch (error) {
        console.warn("setActiveChild failed:", error);
      }
    });
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Aktives Kind wählen"
    >
      <span className="text-muted-foreground text-xs uppercase tracking-wide">
        Kind wechseln
      </span>
      {items.map((child) => {
        const active = child.id === activeId;
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => select(child.id)}
            disabled={pending}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B942] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${
              active
                ? "border-[#F4B942] bg-[#F4B942] text-[#1E4A7C] shadow-sm"
                : "border-border bg-background text-foreground hover:border-[#F4B942]/60 hover:bg-[#F4B942]/10"
            }`}
          >
            <span
              className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-current/20 p-0.5"
              aria-hidden
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getTheme(child.theme).assetPath}
                alt=""
                width={28}
                height={28}
                className="size-full object-contain"
              />
            </span>
            {child.name}
          </button>
        );
      })}
    </div>
  );
};
