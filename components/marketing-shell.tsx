import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Header + footer used by the public marketing routes (landing & legal).
 */
export const MarketingShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Lernikon
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Anmelden
          </Button>
          <Button size="sm" render={<Link href="/signup" />}>
            Registrieren
          </Button>
        </nav>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs sm:flex-row">
        <span>© {new Date().getFullYear()} Lernikon</span>
        <nav className="flex gap-4">
          <Link href="/impressum" className="hover:text-foreground">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-foreground">
            Datenschutz
          </Link>
          <Link href="/agb" className="hover:text-foreground">
            AGB
          </Link>
        </nav>
      </div>
    </footer>
  </>
);
