/**
 * Typed event names — keep this file in sync with the funnel dashboard
 * in PostHog.
 */
export type AnalyticsEvent =
  | "signup_completed"
  | "onboarding_completed"
  | "worksheet_generated"
  | "paywall_hit"
  | "checkout_started"
  | "subscription_started"
  | "subscription_canceled";

/**
 * Paywall-trigger taxonomy. Each value pinpoints which gating mechanism caused
 * the upgrade prompt — used to measure conversion per lever in PostHog. Keep
 * this list closed (no free strings) so the funnel dashboard stays clean.
 */
export type PaywallTrigger =
  | "rate_limit" // free daily quota exhausted
  | "child_slot_locked" // free user tried to add a second child
  | "theme_locked" // free user picked a Pro-only theme
  | "subject_locked" // free user tried a Pro-only subject/topic
  | "feature"; // generic catch-all for unscoped Pro features

export interface AnalyticsProps {
  worksheet_generated: {
    operation: string;
    range_min: number;
    range_max: number;
    count: number;
  };
  paywall_hit: { trigger: PaywallTrigger };
  checkout_started: { plan: "monthly" | "yearly" };
  subscription_started: { plan: "monthly" | "yearly" };
  subscription_canceled: Record<string, never>;
  signup_completed: Record<string, never>;
  onboarding_completed: { grade: number; theme: string };
}
