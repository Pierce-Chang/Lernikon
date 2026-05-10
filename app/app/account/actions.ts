"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser, createServiceClient } from "@/lib/supabase/server";
import {
  getStripe,
  getPriceId,
  checkoutSuccessUrl,
  checkoutCancelUrl,
  portalReturnUrl,
} from "@/lib/stripe";

const planSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

const ensureStripeCustomer = async (userId: string, email: string): Promise<string> => {
  const admin = createServiceClient(),
    { data, error } = await admin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle();

  if (error) throw new Error(`users lookup failed: ${error.message}`);
  const existing = (data as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;
  if (existing) return existing;

  const stripe = getStripe(),
    customer = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: userId },
    });

  const { error: updateError } = await admin
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);
  if (updateError) {
    console.warn("could not persist stripe_customer_id:", updateError.message);
  }
  return customer.id;
};

export const createCheckoutSession = async (raw: unknown): Promise<never> => {
  const parsed = planSchema.safeParse(raw);
  if (!parsed.success) throw new Error("invalid_plan");

  const user = await getCurrentUser();
  if (!user || !user.email) throw new Error("unauthenticated");

  const customerId = await ensureStripeCustomer(user.id, user.email),
    stripe = getStripe(),
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: getPriceId(parsed.data.plan), quantity: 1 }],
      success_url: checkoutSuccessUrl(),
      cancel_url: checkoutCancelUrl(),
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
      billing_address_collection: "auto",
      locale: "de",
      metadata: { supabase_user_id: user.id },
    });

  if (!session.url) throw new Error("checkout_url_missing");
  redirect(session.url);
};

export const openBillingPortal = async (): Promise<never> => {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");

  const admin = createServiceClient(),
    { data, error } = await admin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
  if (error) throw new Error(`users lookup failed: ${error.message}`);
  const customerId = (data as { stripe_customer_id: string | null } | null)
    ?.stripe_customer_id;
  if (!customerId) throw new Error("no_customer");

  const stripe = getStripe(),
    session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: portalReturnUrl(),
    });
  redirect(session.url);
};
