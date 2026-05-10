"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { THEMES } from "@/lib/themes";
import { capture } from "@/lib/analytics/client";
import { createChildProfile } from "./actions";

const GRADES = [1, 2, 3, 4] as const;

export const OnboardingForm = () => {
  const [name, setName] = useState(""),
    [grade, setGrade] = useState<string>("2"),
    [theme, setTheme] = useState<string>("weltraum"),
    [pending, startTransition] = useTransition(),
    [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      capture("onboarding_completed", { grade: Number(grade), theme });
      const result = await createChildProfile({
        name: name.trim(),
        grade: Number(grade),
        theme_preference: theme,
      });
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Vorname deines Kindes</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
          required
          placeholder="z.B. Lina"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="grade">Klasse</Label>
        <Select value={grade} onValueChange={(value) => setGrade(value ?? "2")}>
          <SelectTrigger id="grade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((g) => (
              <SelectItem key={g} value={String(g)}>
                Klasse {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Lieblingsthema</Label>
        <RadioGroup value={theme} onValueChange={setTheme} className="gap-2">
          {THEMES.map((t) => (
            <Label
              key={t.id}
              htmlFor={`theme-${t.id}`}
              className="border-border hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md border p-3"
            >
              <RadioGroupItem id={`theme-${t.id}`} value={t.id} />
              <span className="text-xl">{t.emoji}</span>
              <span className="flex flex-col">
                <span className="font-medium">{t.label}</span>
                <span className="text-muted-foreground text-xs">{t.description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <Button type="submit" disabled={pending || name.trim().length === 0}>
        {pending ? "Wird gespeichert…" : "Profil anlegen"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
};
