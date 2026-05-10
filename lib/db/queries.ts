import { createClient } from "@/lib/supabase/server";
import type { ChildProfileRow, UserRow } from "@/lib/db/types";

/**
 * Returns the public.users row for the current auth user.
 * The row is normally inserted by the auth trigger; null indicates a
 * fresh account whose trigger hasn't fired yet.
 */
export const getCurrentUserRow = async (): Promise<UserRow | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("*").maybeSingle();
  if (error) {
    console.warn("getCurrentUserRow:", error.message);
    return null;
  }
  return (data ?? null) as UserRow | null;
};

export const getChildProfile = async (): Promise<ChildProfileRow | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("children_profiles")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("getChildProfile:", error.message);
    return null;
  }
  return (data ?? null) as ChildProfileRow | null;
};

export const countWorksheetsLast24h = async (userId: string): Promise<number> => {
  const supabase = await createClient(),
    since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("worksheets_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("generated_at", since);
  if (error) {
    console.warn("countWorksheetsLast24h:", error.message);
    return 0;
  }
  return count ?? 0;
};
