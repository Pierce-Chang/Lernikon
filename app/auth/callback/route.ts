import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link return URL. Exchanges the `code` query param for a session
 * cookie and redirects the user into the app.
 */
export const GET = async (request: NextRequest) => {
  const url = new URL(request.url),
    code = url.searchParams.get("code"),
    next = url.searchParams.get("next") ?? "/app/generator";

  if (code) {
    const supabase = await createClient(),
      { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    console.warn("auth callback exchange failed:", error.message);
  }

  const failureUrl = new URL("/login", url.origin);
  failureUrl.searchParams.set("error", "callback");
  return NextResponse.redirect(failureUrl);
};
