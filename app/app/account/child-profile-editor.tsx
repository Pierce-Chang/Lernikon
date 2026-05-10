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
import { THEMES } from "@/lib/themes";
import { updateChildProfile } from "./profile-actions";

export const ChildProfileEditor = ({
  childId,
  initialName,
  initialGrade,
  initialTheme,
}: {
  childId: string;
  initialName: string;
  initialGrade: number;
  initialTheme: string;
}) => {
  const [name, setName] = useState(initialName),
    [grade, setGrade] = useState(String(initialGrade)),
    [theme, setTheme] = useState(initialTheme),
    [pending, startTransition] = useTransition(),
    [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      const result = await updateChildProfile({
        id: childId,
        name: name.trim(),
        grade: Number(grade),
        theme_preference: theme,
      });
      setStatus(result.ok ? "saved" : "error");
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="child-name">Name</Label>
        <Input
          id="child-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={50}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="child-grade">Klasse</Label>
        <Select value={grade} onValueChange={(value) => setGrade(value ?? "2")}>
          <SelectTrigger id="child-grade">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map((g) => (
              <SelectItem key={g} value={String(g)}>
                Klasse {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="child-theme">Lieblingsthema</Label>
        <Select value={theme} onValueChange={(value) => setTheme(value ?? "weltraum")}>
          <SelectTrigger id="child-theme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {THEMES.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.emoji} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Wird gespeichert…" : "Speichern"}
        </Button>
        {status === "saved" && (
          <span className="text-sm text-emerald-700">Gespeichert.</span>
        )}
        {status === "error" && (
          <span className="text-destructive text-sm">Fehler beim Speichern.</span>
        )}
      </div>
    </form>
  );
};
