"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { countChildProfiles, getCurrentUserRow } from "@/lib/db/queries";
import { hasUnlimited } from "@/lib/worksheet/rate-limit";
import { getTheme, isThemeId, type ThemeId } from "@/lib/themes";

const FREE_CHILD_CAP = 1;
const PAID_CHILD_CAP = 3;

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  // 0 = Vorschule, 1..10 = Klasse 1..10.
  grade: z.number().int().min(0).max(10),
  theme_preference: z.string().refine(isThemeId, "Unbekanntes Thema"),
});

const createSchema = z.object({
  name: z.string().min(1).max(50),
  grade: z.number().int().min(0).max(10),
  theme_preference: z.string().refine(isThemeId, "Unbekanntes Thema"),
});

const idSchema = z.object({ id: z.string().uuid() });

export const updateChildProfile = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige Eingabe." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const supabase = await createClient();

  // Theme-Paywall: Free-User darf nur kostenlose Themes setzen ODER das
  // bestehende Theme behalten (Grandfathering nach Downgrade). Vergleich
  // gegen die aktuell gespeicherte Wahl.
  const newTheme = parsed.data.theme_preference as ThemeId,
    newThemeMeta = getTheme(newTheme);
  if (newThemeMeta.pro) {
    const userRow = await getCurrentUserRow(),
      isPaid = userRow ? hasUnlimited(userRow) : false;
    if (!isPaid) {
      const { data: existing } = await supabase
        .from("children_profiles")
        .select("theme_preference")
        .eq("id", parsed.data.id)
        .eq("user_id", user.id)
        .maybeSingle();
      const currentTheme = (existing as { theme_preference: string } | null)
        ?.theme_preference;
      if (currentTheme !== newTheme) {
        return {
          ok: false,
          error: `Das Theme „${newThemeMeta.label}" ist nur mit Family Pro verfügbar.`,
        };
      }
    }
  }

  const { error } = await supabase
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
  revalidatePath("/app");
  revalidatePath("/app/mathe/rechnen");
  return { ok: true };
};

/**
 * Add a child from the account page. Enforces the tier cap (1 for free,
 * 3 for Family Pro / admins) at the app layer.
 */
export const addChildProfile = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Bitte alle Felder ausfüllen." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const userRow = await getCurrentUserRow(),
    paid = userRow ? hasUnlimited(userRow) : false,
    cap = paid ? PAID_CHILD_CAP : FREE_CHILD_CAP,
    current = await countChildProfiles();

  if (current >= cap) {
    return {
      ok: false,
      error: paid
        ? `Maximal ${PAID_CHILD_CAP} Kinderprofile pro Konto.`
        : `Mit Family Pro kannst du bis zu ${PAID_CHILD_CAP} Kinder anlegen.`,
    };
  }

  // Theme-Paywall: Free-Tier kann nur kostenlose Themes wählen.
  const themeMeta = getTheme(parsed.data.theme_preference);
  if (themeMeta.pro && !paid) {
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
    console.warn("addChildProfile:", error.message);
    return { ok: false, error: "Konnte das Profil nicht speichern." };
  }

  revalidatePath("/app/account");
  revalidatePath("/app");
  return { ok: true };
};

export const deleteChildProfile = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Ungültige ID." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Nicht angemeldet." };

  const supabase = await createClient(),
    { error } = await supabase
      .from("children_profiles")
      .delete()
      .eq("id", parsed.data.id)
      .eq("user_id", user.id);

  if (error) {
    console.warn("deleteChildProfile:", error.message);
    return { ok: false, error: "Konnte das Profil nicht löschen." };
  }

  // The FK on users.active_child_id has ON DELETE SET NULL, so Postgres
  // clears the pointer for us. Nothing extra to do here.

  revalidatePath("/app/account");
  revalidatePath("/app");
  return { ok: true };
};

/**
 * Persist the user's choice of active child on the account row. Subsequent
 * server queries pick this up via `getActiveChildProfile`. Invoked from the
 * dashboard child selector.
 */
export const setActiveChild = async (raw: unknown): Promise<void> => {
  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return;

  const user = await getCurrentUser();
  if (!user) return;

  // Verify ownership before storing. Defence in depth on top of RLS.
  const supabase = await createClient(),
    { data: owned } = await supabase
      .from("children_profiles")
      .select("id")
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .maybeSingle();
  if (!owned) return;

  const { error } = await supabase
    .from("users")
    .update({ active_child_id: parsed.data.id })
    .eq("id", user.id);
  if (error) {
    console.warn("setActiveChild:", error.message);
    return;
  }

  revalidatePath("/app");
};

/**
 * Server-action wrapper around `setActiveChild` for use as a `<form action>`.
 * Reads the id from FormData and redirects back to the dashboard.
 */
export const setActiveChildFromForm = async (form: FormData): Promise<void> => {
  await setActiveChild({ id: form.get("childId") });
  redirect("/app");
};
