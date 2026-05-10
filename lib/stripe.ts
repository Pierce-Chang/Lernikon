import Stripe from "stripe";
import { serverEnv, clientEnv } from "@/lib/env";

let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (_stripe) return _stripe;
  _stripe = new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    typescript: true,
  });
  return _stripe;
};

export type StripePlanId = "monthly" | "yearly";

export const getPriceId = (plan: StripePlanId): string => {
  switch (plan) {
    case "monthly":
      return serverEnv.STRIPE_PRICE_MONTHLY;
    case "yearly":
      return serverEnv.STRIPE_PRICE_YEARLY;
  }
};

export const checkoutSuccessUrl = () =>
  `${clientEnv.NEXT_PUBLIC_APP_URL}/app/account?checkout=success`;

export const checkoutCancelUrl = () =>
  `${clientEnv.NEXT_PUBLIC_APP_URL}/app/account?checkout=cancel`;

export const portalReturnUrl = () => `${clientEnv.NEXT_PUBLIC_APP_URL}/app/account`;
