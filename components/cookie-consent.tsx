"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "lernikon:cookie-consent";

export type ConsentChoice = "accepted" | "declined";

export const getStoredConsent = (): ConsentChoice | null => {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "accepted" || value === "declined" ? value : null;
};

const setStoredConsent = (choice: ConsentChoice) => {
  window.localStorage.setItem(STORAGE_KEY, choice);
  window.dispatchEvent(new CustomEvent("lernikon:consent", { detail: choice }));
};

const subscribeConsent = (notify: () => void) => {
  window.addEventListener("lernikon:consent", notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener("lernikon:consent", notify);
    window.removeEventListener("storage", notify);
  };
};

/**
 * Bottom-anchored consent banner. Sits hidden until the visitor has
 * not yet expressed a preference. Choice is mirrored to localStorage
 * and broadcast on `lernikon:consent`.
 */
export const CookieConsent = () => {
  const stored = useSyncExternalStore(
    subscribeConsent,
    () => getStoredConsent(),
    () => null,
  );
  const [dismissed, setDismissed] = useState(false);

  if (stored !== null || dismissed) return null;

  const onChoice = (choice: ConsentChoice) => {
    setStoredConsent(choice);
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-50">
      <div className="border-border bg-background mx-auto flex max-w-2xl flex-col gap-3 rounded-lg border p-4 shadow-lg sm:flex-row sm:items-center">
        <p className="text-foreground text-sm">
          Wir nutzen funktionale Cookies (notwendig) und — mit deiner
          Zustimmung — anonymisierte Analyse via PostHog.{" "}
          <Link href="/datenschutz" className="underline">
            Mehr erfahren
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2 sm:ml-auto">
          <Button variant="ghost" size="sm" onClick={() => onChoice("declined")}>
            Ablehnen
          </Button>
          <Button size="sm" onClick={() => onChoice("accepted")}>
            Akzeptieren
          </Button>
        </div>
      </div>
    </div>
  );
};
