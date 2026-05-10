"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { isThemeId } from "@/lib/themes";

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  grade: z.number().int().min(1).max(4),
  theme_preference: z.string().refine(isThemeId, "Unbekanntes Thema"),
});

export const updateChildProfile = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const supabase = await createClient(),
    { error } = await supabase
      .from("children_profiles")
      .update({
        name: parsed.data.name,
        grade: parsed.data.grade,
        theme_preference: parsed.data.theme_preference,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id);

  if (error) {
    console.warn("updateChildProfile:", error.message);
    return { ok: false, error: "Konnte das Profil nicht speichern." };
  }

  revalidatePath("/app/account");
  revalidatePath("/app/generator");
  return { ok: true };
};
