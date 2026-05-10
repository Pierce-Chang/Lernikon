import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile } from "@/lib/db/queries";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Profil anlegen" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");

  const existing = await getChildProfile();
  if (existing) redirect("/app/generator");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Willkommen!</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Lege ein Profil für dein Kind an. Daraus personalisieren wir die Übungsblätter.
      </p>
      <OnboardingForm />
    </main>
  );
}
