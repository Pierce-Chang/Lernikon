import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export const proxy = (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    /*
     * Run on every request EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon, icons, robots, sitemap
     * - public image assets
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
