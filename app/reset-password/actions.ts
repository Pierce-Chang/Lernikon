"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

const resetSchema = z
  .object({
    password: z.string().min(8, "Mindestens 8 Zeichen."),
    confirm: z.string().min(8),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Passwörter stimmen nicht überein.",
    path: ["confirm"],
  });

export const updatePassword = async (
  raw: unknown,
): Promise<{ ok: false; error: string } | never> => {
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Ungültige Eingabe.";
    return { ok: false, error: first };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      error: "Reset-Session abgelaufen. Bitte den Link erneut anfordern.",
    };
  }

  const supabase = await createClient(),
    { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    console.warn("updatePassword error:", error.message);
    return { ok: false, error: "Konnte Passwort nicht setzen. Bitte erneut versuchen." };
  }

  redirect("/app/generator");
};
