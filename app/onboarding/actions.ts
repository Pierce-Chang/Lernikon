"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { getCurrentUserRow } from "@/lib/db/queries";
import { hasUnlimited } from "@/lib/worksheet/rate-limit";
import { getTheme, isThemeId } from "@/lib/themes";

const inputSchema = z.object({
  name: z.string().min(1).max(50),
  // 0 = Vorschule, 1..10 = Klasse 1..10. Phase 1b UI offers 0..4 only.
  grade: z.number().int().min(0).max(10),
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

  // Theme-Paywall: Free-Tier kann nur kostenlose Themes wählen.
  const userRow = await getCurrentUserRow(),
    isPaid = userRow ? hasUnlimited(userRow) : false,
    themeMeta = getTheme(parsed.data.theme_preference);
  if (themeMeta.pro && !isPaid) {
    return {
      ok: false,
      error: `Das Theme „${themeMeta.label}" ist nur mit Family Pro verfügbar.`,
    };
  }

  const supabase = await createClient(),
    { error } = await supabase.from("children_profiles").insert({
      user_id: user.id,
      name: parsed.data.name,
      grade: parsed.data.grade,
      theme_preference: parsed.data.theme_preference,
    });

  if (error) {
    console.warn("createChildProfile:", error.message);
    return { ok: false, error: "Konnte das Profil nicht speichern." };
  }

  redirect("/app");
};
