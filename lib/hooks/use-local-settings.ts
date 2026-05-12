"use client";

import { useEffect, useState } from "react";

/**
 * React state that syncs with `localStorage`. Used for per-module form
 * settings (Mathe-Rechnen, Deutsch-Buchstaben, …) so a reload keeps the
 * parent's last choice.
 *
 *   const [settings, setSettings] = useLocalSettings(
 *     "lernikon.settings.mathe-rechnen",
 *     defaults,
 *   );
 *
 * The stored value is read **synchronously** in `useState`'s initializer
 * so the first client render already has the right values. This component
 * must be loaded via `dynamic({ ssr: false })` so the server never paints
 * a defaults version that the client would then flicker over.
 */
export const useLocalSettings = <T extends object>(
  key: string,
  defaults: T,
): [T, (next: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          // Merge so newly added fields fall back to defaults.
          return { ...defaults, ...parsed };
        }
      }
    } catch {
      // Corrupt or unavailable storage — keep defaults.
    }
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota / private-mode — ignore.
    }
  }, [key, value]);

  return [value, setValue];
};
