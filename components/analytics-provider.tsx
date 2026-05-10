"use client";

import { useEffect } from "react";
import { getStoredConsent } from "@/components/cookie-consent";
import { initPostHog } from "@/lib/analytics/client";

/**
 * Boots PostHog when consent is granted (either already stored or just chosen
 * via the banner). No-op if the env keys are missing.
 */
export const AnalyticsProvider = () => {
  useEffect(() => {
    if (getStoredConsent() === "accepted") {
      initPostHog();
    }
    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "accepted") initPostHog();
    };
    window.addEventListener("aufgabenblatt:consent", onConsent);
    return () => window.removeEventListener("aufgabenblatt:consent", onConsent);
  }, []);

  return null;
};
