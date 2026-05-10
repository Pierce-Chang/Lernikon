import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { serverEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/lib/db/types";

export const runtime = "nodejs";

const RELEVANT_EVENTS: ReadonlySet<string> = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);

const mapStatus = (status: Stripe.Subscription.Status): SubscriptionStatus => {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "unpaid":
    case "paused":
      return "past_due";
  }
};

const updateUserFromSubscription = async (subscription: Stripe.Subscription) => {
  const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    status = mapStatus(subscription.status),
    periodEnd =
      "current_period_end" in subscription &&
      typeof subscription.current_period_end === "number"
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;

  const admin = createServiceClient(),
    { error } = await admin
      .from("users")
      .update({
        subscription_status: status,
        subscription_period_end: periodEnd,
      })
      .eq("stripe_customer_id", customerId);
  if (error) {
    console.warn("webhook: users update failed:", error.message);
  }
};

const markPastDue = async (customerId: string) => {
  const admin = createServiceClient(),
    { error } = await admin
      .from("users")
      .update({ subscription_status: "past_due" })
      .eq("stripe_customer_id", customerId);
  if (error) console.warn("webhook: mark past_due failed:", error.message);
};

export const POST = async (request: NextRequest) => {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "no_signature" }, { status: 400 });

  const payload = await request.text(),
    stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      serverEnv.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.warn("webhook signature verification failed:", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (!RELEVANT_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await updateUserFromSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice,
          customerId =
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id;
        if (customerId) await markPastDue(customerId);
        break;
      }
    }
  } catch (err) {
    console.warn("webhook handler error:", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
};
