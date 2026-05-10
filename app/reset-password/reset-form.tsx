"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "./actions";

const PASSWORD_MIN = 8;

export const ResetForm = () => {
  const [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updatePassword({ password, confirm });
      if (result && !result.ok) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Neues Passwort</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
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
      <Button type="submit" disabled={pending || password.length === 0}>
        {pending ? "Wird gespeichert…" : "Passwort speichern"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
};
