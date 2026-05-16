"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, createClient } from "@/lib/supabase/server";

/**
 * Persists the user's preference to hide the "So funktioniert's" strip on
 * the Dashboard. Stored on the account row so it travels across browsers.
 * RLS limits the update to the calling user's own row.
 */
export const setHideHowItWorks = async (hide: boolean) => {
  const user = await getCurrentUser();
  if (!user) throw new Error("not authenticated");

  const supabase = await createClient(),
    { error } = await supabase
      .from("users")
      .update({ hide_how_it_works: hide })
      .eq("id", user.id);

  if (error) {
    console.warn("setHideHowItWorks failed:", error.message);
    throw new Error("update failed");
  }

  revalidatePath("/app");
};
