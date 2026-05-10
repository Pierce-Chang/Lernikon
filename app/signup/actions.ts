"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mindestens 8 Zeichen."),
});

export const signUpWithPassword = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Bitte alle Felder ausfüllen.";
    return { ok: false, error: first };
  }

  const supabase = await createClient(),
    redirectTo = `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/onboarding`;

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    console.warn("signUp error:", error.message);
    if (error.code === "user_already_exists" || error.message.toLowerCase().includes("registered")) {
      return {
        ok: false,
        error: "Diese E-Mail ist bereits registriert. Bitte einloggen.",
      };
    }
    return { ok: false, error: "Registrierung fehlgeschlagen. Bitte erneut versuchen." };
  }

  return { ok: true };
};
