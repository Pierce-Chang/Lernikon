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

export interface AnalyticsProps {
  worksheet_generated: {
    operation: string;
    range_min: number;
    range_max: number;
    count: number;
  };
  paywall_hit: { trigger: "rate_limit" | "feature" };
  checkout_started: { plan: "monthly" | "yearly" };
  subscription_started: { plan: "monthly" | "yearly" };
  subscription_canceled: Record<string, never>;
  signup_completed: Record<string, never>;
  onboarding_completed: { grade: number; theme: string };
}
