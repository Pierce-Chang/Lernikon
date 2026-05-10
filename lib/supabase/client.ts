import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/lib/env";

/**
 * Supabase client for use in Client Components.
 * Untyped at the call site — typed Database generics break the postgrest-js
 * conditional types in this version. Use the helper queries in lib/db/queries
 * for typed reads.
 */
export const createClient = () =>
  createBrowserClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
