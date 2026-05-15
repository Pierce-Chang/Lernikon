import Link from "next/link";
import { LayoutDashboard, CircleUser, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The three authed nav buttons shared between the landing page header (logged-in branch)
 * and the /app layout header. Single source of truth for icons and copy.
 */
export function AppNavLinks() {
  return (
    <>
      <Button variant="ghost" size="sm" render={<Link href="/app" />}>
        <LayoutDashboard aria-hidden className="transition-transform group-hover/button:scale-110" />
        Übersicht
      </Button>
      <Button variant="ghost" size="sm" render={<Link href="/app/account" />}>
        <CircleUser aria-hidden className="transition-transform group-hover/button:scale-110" />
        Mein Konto
      </Button>
      <form action="/auth/sign-out" method="post">
        <Button variant="ghost" size="sm" type="submit">
          <LogOut aria-hidden className="transition-transform group-hover/button:translate-x-0.5" />
          Abmelden
        </Button>
      </form>
    </>
  );
}
