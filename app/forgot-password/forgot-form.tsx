"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "./actions";

export const ForgotForm = () => {
  const [email, setEmail] = useState(""),
    [pending, startTransition] = useTransition(),
    [sent, setSent] = useState(false);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      await requestPasswordReset({ email });
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="border-border bg-muted/40 rounded-lg border p-4 text-sm">
        <p className="font-medium">Falls ein Konto existiert, ist eine Mail unterwegs.</p>
        <p className="text-muted-foreground mt-1">
          Klicke den Link in der Mail, um ein neues Passwort zu setzen.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="du@beispiel.de"
        />
      </div>
      <Button type="submit" disabled={pending || email.length === 0}>
        {pending ? "Wird gesendet…" : "Reset-Link senden"}
      </Button>
      <p className="text-muted-foreground mt-2 text-center text-sm">
        <Link href="/login" className="text-foreground underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </form>
  );
};
