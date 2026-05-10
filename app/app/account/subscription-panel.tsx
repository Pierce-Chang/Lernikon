"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { capture } from "@/lib/analytics/client";
import { createCheckoutSession, openBillingPortal } from "./actions";

export const SubscriptionPanel = ({ paid }: { paid: boolean }) => {
  const [pending, startTransition] = useTransition();

  if (paid) {
    return (
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await openBillingPortal();
          })
        }
      >
        {pending ? "Wird geöffnet…" : "Abo verwalten"}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Family Pro: unbegrenzt viele Arbeitsblätter, ohne Wasserzeichen.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              capture("checkout_started", { plan: "monthly" });
              await createCheckoutSession({ plan: "monthly" });
            })
          }
        >
          {pending ? "Bitte warten…" : "Monatlich · 7,99 €"}
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              capture("checkout_started", { plan: "yearly" });
              await createCheckoutSession({ plan: "yearly" });
            })
          }
        >
          {pending ? "Bitte warten…" : "Jährlich · 59 € (38 % günstiger)"}
        </Button>
      </div>
    </div>
  );
};
