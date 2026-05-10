import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const child = await getChildProfile();
  if (!child) redirect("/onboarding");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/app/generator" className="font-semibold tracking-tight">
            Lernikon
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Button variant="ghost" size="sm" render={<Link href="/app/generator" />}>
              Generator
            </Button>
            <Button variant="ghost" size="sm" render={<Link href="/app/account" />}>
              Konto
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
