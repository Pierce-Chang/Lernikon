"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpWithPassword } from "./actions";

const PASSWORD_MIN = 8;

export const SignUpForm = () => {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null),
    [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    if (password.length < PASSWORD_MIN) {
      setError(`Passwort muss mindestens ${PASSWORD_MIN} Zeichen lang sein.`);
      return;
    }
    startTransition(async () => {
      const result = await signUpWithPassword({ email, password });
      if (result.ok) {
        setSentTo(email);
      } else {
        setError(result.error);
      }
    });
  };

  if (sentTo) {
    return (
      <div className="border-border bg-muted/40 rounded-lg border p-4 text-sm">
        <p className="font-medium">Fast geschafft.</p>
        <p className="text-muted-foreground mt-1">
          Wir haben einen Bestätigungslink an <span className="font-medium">{sentTo}</span>{" "}
          geschickt. Klicke ihn an, um dein Konto zu aktivieren.
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Passwort</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Mindestens {PASSWORD_MIN} Zeichen.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Passwort bestätigen</Label>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || email.length === 0 || password.length === 0}>
        {pending ? "Konto wird angelegt…" : "Konto erstellen"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <p className="text-muted-foreground mt-2 text-center text-sm">
        Schon ein Konto?{" "}
        <Link href="/login" className="text-foreground underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
};
