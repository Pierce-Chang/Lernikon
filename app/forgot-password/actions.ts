"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientEnv } from "@/lib/env";

const forgotSchema = z.object({
  email: z.string().email(),
});

export const requestPasswordReset = async (
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const parsed = forgotSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Bitte eine gültige E-Mail eingeben." };
  }

  const supabase = await createClient(),
    redirectTo = `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`;

  // Supabase intentionally returns success even when no account matches —
  // do not leak whether the address exists.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    console.warn("resetPasswordForEmail error:", error.message);
  }

  return { ok: true };
};
