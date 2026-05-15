import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getActiveChildProfile, getCurrentUserRow } from "@/lib/db/queries";
import { getQuota } from "@/lib/worksheet/rate-limit";
import { formatGradeShort } from "@/lib/format/grade";
import { Button } from "@/components/ui/button";
import { BruecheForm } from "./brueche-form";

export const metadata = { title: "Mathe · Brüche" };

export default async function MatheBruechePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [child, userRow] = await Promise.all([
    getActiveChildProfile(user.id),
    getCurrentUserRow(),
  ]);
  if (!child) redirect("/onboarding");

  const quota = await getQuota(user.id, userRow);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/app" />}>
          ← Zurück zur Übersicht
        </Button>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Brüche</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Für <span className="font-medium">{child.name}</span> ·{" "}
        {formatGradeShort(child.grade)} · Thema {child.theme_preference}
      </p>

      <BruecheForm
        childId={child.id}
        quota={{
          isPaid: quota.isPaid,
          used: quota.used,
          remaining: Number.isFinite(quota.remaining) ? quota.remaining : null,
          limit: Number.isFinite(quota.limit) ? quota.limit : null,
        }}
      />
    </main>
  );
}
