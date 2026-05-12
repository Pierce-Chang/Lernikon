"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().startsWith("/").default("/app"),
});

export const signInWithPassword = async (
  raw: unknown,
): Promise<{ ok: false; error: string } | never> => {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Bitte E-Mail und Passwort angeben." };
  }

  const supabase = await createClient(),
    { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

  if (error) {
    console.warn("signIn error:", error.message);
    if (error.code === "email_not_confirmed") {
      return {
        ok: false,
        error: "E-Mail noch nicht bestätigt. Schau in dein Postfach.",
      };
    }
    return { ok: false, error: "E-Mail oder Passwort falsch." };
  }

  redirect(parsed.data.next);
};
