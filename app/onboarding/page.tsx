import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile, getCurrentUserRow } from "@/lib/db/queries";
import { hasUnlimited } from "@/lib/worksheet/rate-limit";
import { AuthShell } from "@/components/auth-shell";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Profil anlegen" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/onboarding");

  const [existing, userRow] = await Promise.all([
    getChildProfile(),
    getCurrentUserRow(),
  ]);
  if (existing) redirect("/app");

  const isPaid = userRow ? hasUnlimited(userRow) : false;

  return (
    <AuthShell
      title="Willkommen!"
      subtitle="Lege ein Profil für dein Kind an. Daraus personalisieren wir die Übungsblätter."
    >
      <OnboardingForm isPaid={isPaid} />
    </AuthShell>
  );
}
