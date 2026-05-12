"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "./actions";

export const LoginForm = () => {
  const searchParams = useSearchParams(),
    next = searchParams.get("next") ?? "/app";

  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInWithPassword({ email, password, next });
      if (result && !result.ok) setError(result.error);
    });
  };

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Passwort</Label>
          <Link href="/forgot-password" className="text-muted-foreground text-xs underline">
            Passwort vergessen?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button type="submit" disabled={pending || email.length === 0 || password.length === 0}>
        {pending ? "Wird angemeldet…" : "Anmelden"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}

      <p className="text-muted-foreground mt-2 text-center text-sm">
        Noch kein Konto?{" "}
        <Link href="/signup" className="text-foreground underline">
          Jetzt registrieren
        </Link>
      </p>
    </form>
  );
};
