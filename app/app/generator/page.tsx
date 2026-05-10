import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile, getCurrentUserRow } from "@/lib/db/queries";
import { getQuota } from "@/lib/worksheet/rate-limit";
import { GeneratorForm } from "./generator-form";

export const metadata = { title: "Übungsblatt erstellen" };

export default async function GeneratorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [child, userRow] = await Promise.all([getChildProfile(), getCurrentUserRow()]);
  if (!child) redirect("/onboarding");

  const quota = await getQuota(user.id, userRow);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Übungsblatt erstellen</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Für <span className="font-medium">{child.name}</span> · Klasse {child.grade} ·{" "}
        Thema {child.theme_preference}
      </p>

      <GeneratorForm
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
