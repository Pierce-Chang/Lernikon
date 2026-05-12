import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const child = await getChildProfile();
  if (!child) redirect("/onboarding");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Logo variant="lockup" href="/" priority className="h-9" />
          <nav className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" render={<Link href="/app" />}>
              Übersicht
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/app/account" />}>
              Mein Konto
            </Button>
            <form action="/auth/sign-out" method="post">
              <Button variant="ghost" size="sm" type="submit">
                Abmelden
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
