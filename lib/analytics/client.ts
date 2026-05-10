"use client";

import posthog from "posthog-js";
import { clientEnv } from "@/lib/env";
import type { AnalyticsEvent, AnalyticsProps } from "./events";

let initialized = false;

export const initPostHog = () => {
  if (initialized) return;
  if (!clientEnv.NEXT_PUBLIC_POSTHOG_KEY || !clientEnv.NEXT_PUBLIC_POSTHOG_HOST) {
    return;
  }
  posthog.init(clientEnv.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST,
    capture_pageview: "history_change",
    autocapture: false,
    persistence: "localStorage",
    person_profiles: "identified_only",
  });
  initialized = true;
};

export const capture = <E extends AnalyticsEvent>(
  event: E,
  props?: E extends keyof AnalyticsProps ? AnalyticsProps[E] : Record<string, unknown>,
) => {
  if (!initialized) return;
  posthog.capture(event, props as Record<string, unknown> | undefined);
};

export const identify = (id: string, traits?: Record<string, unknown>) => {
  if (!initialized) return;
  posthog.identify(id, traits);
};

export const reset = () => {
  if (!initialized) return;
  posthog.reset();
};
