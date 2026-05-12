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
import { ThemePicker } from "@/components/theme-picker";
import { DEFAULT_THEME, type ThemeId } from "@/lib/themes";
import { SUPPORTED_GRADES, formatGrade } from "@/lib/format/grade";
import { capture } from "@/lib/analytics/client";
import { createChildProfile } from "./actions";

export const OnboardingForm = ({ isPaid }: { isPaid: boolean }) => {
  const [name, setName] = useState(""),
    [grade, setGrade] = useState<string>("1"),
    [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME),
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
        <Select value={grade} onValueChange={(value) => setGrade(value ?? "1")}>
          <SelectTrigger id="grade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_GRADES.map((g) => (
              <SelectItem key={g} value={String(g)}>
                {formatGrade(g)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Lieblingsthema</Label>
        <ThemePicker value={theme} onChange={setTheme} isPaid={isPaid} />
      </div>

      <Button type="submit" disabled={pending || name.trim().length === 0}>
        {pending ? "Wird gespeichert…" : "Profil anlegen"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </form>
  );
};
