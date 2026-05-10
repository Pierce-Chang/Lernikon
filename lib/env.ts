import { z } from "zod";

/**
 * Validate environment variables at boot.
 * Server-only secrets are not exposed to the client bundle.
 *
 * Set SKIP_ENV_VALIDATION=1 to bypass — useful for `next build` on a fresh
 * checkout, CI lint stages, or Docker image bakes. NEVER skip in production
 * runtime: missing secrets will surface as opaque downstream failures instead.
 */

const skip = process.env.SKIP_ENV_VALIDATION === "1";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PRICE_MONTHLY: z.string().min(1),
  STRIPE_PRICE_YEARLY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

type ClientEnv = z.infer<typeof clientSchema>;
type ServerEnv = z.infer<typeof serverSchema>;

const SKIP_PLACEHOLDER_CLIENT: ClientEnv = {
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "skip",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_skip",
  NEXT_PUBLIC_POSTHOG_KEY: undefined,
  NEXT_PUBLIC_POSTHOG_HOST: undefined,
};

const SKIP_PLACEHOLDER_SERVER: ServerEnv = {
  SUPABASE_SERVICE_ROLE_KEY: "skip",
  STRIPE_SECRET_KEY: "sk_test_skip",
  STRIPE_WEBHOOK_SECRET: "whsec_skip",
  STRIPE_PRICE_MONTHLY: "price_skip_monthly",
  STRIPE_PRICE_YEARLY: "price_skip_yearly",
  OPENAI_API_KEY: undefined,
};

const clientValues = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
};

const isServer = typeof window === "undefined";

let _clientEnv: ClientEnv;
if (skip) {
  _clientEnv = SKIP_PLACEHOLDER_CLIENT;
} else {
  const parsed = clientSchema.safeParse(clientValues);
  if (!parsed.success) {
    console.warn("Invalid NEXT_PUBLIC_* env vars:", parsed.error.flatten().fieldErrors);
    throw new Error("Missing or invalid public environment variables");
  }
  _clientEnv = parsed.data;
}
export const clientEnv = _clientEnv;

let _serverEnv: ServerEnv | null = null;
if (isServer) {
  if (skip) {
    _serverEnv = SKIP_PLACEHOLDER_SERVER;
  } else {
    const parsed = serverSchema.safeParse(process.env);
    if (!parsed.success) {
      console.warn("Invalid server env vars:", parsed.error.flatten().fieldErrors);
      throw new Error("Missing or invalid server environment variables");
    }
    _serverEnv = parsed.data;
  }
}

/**
 * Server-only env access. Throws if read in a client bundle.
 */
export const serverEnv = new Proxy({} as ServerEnv, {
  get(_target, prop) {
    if (!isServer) {
      throw new Error(`serverEnv.${String(prop)} accessed on the client`);
    }
    return _serverEnv?.[prop as keyof ServerEnv];
  },
});
