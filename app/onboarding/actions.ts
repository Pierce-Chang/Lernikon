"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { isThemeId } from "@/lib/themes";

const inputSchema = z.object({
  name: z.string().min(1).max(50),
  grade: z.number().int().min(1).max(4),
  theme_preference: z.string().refine(isThemeId, "Unbekanntes Thema"),
});

export const createChildProfile = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Bitte alle Felder ausfüllen." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const supabase = await createClient(),
    { error } = await supabase.from("children_profiles").insert({
      user_id: user.id,
      name: parsed.data.name,
      grade: parsed.data.grade as 1 | 2 | 3 | 4,
      theme_preference: parsed.data.theme_preference,
    });

  if (error) {
    console.warn("createChildProfile:", error.message);
    return { ok: false, error: "Konnte das Profil nicht speichern." };
  }

  redirect("/app/generator");
};
