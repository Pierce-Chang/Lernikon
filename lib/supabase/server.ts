import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clientEnv, serverEnv } from "@/lib/env";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth cookie via next/headers.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component cannot set cookies — middleware refreshes them.
          }
        },
      },
    },
  );
};

/**
 * Service-role client. Bypasses RLS — use only in trusted server contexts
 * (webhooks, scheduled jobs). Never expose to the browser.
 */
export const createServiceClient = () =>
  createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );

/**
 * Returns the currently signed-in auth user, or null.
 */
export const getCurrentUser = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
};
