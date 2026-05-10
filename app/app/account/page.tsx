import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getChildProfile, getCurrentUserRow } from "@/lib/db/queries";
import { isPaid } from "@/lib/worksheet/rate-limit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChildProfileEditor } from "./child-profile-editor";
import { SubscriptionPanel } from "./subscription-panel";

export const metadata = { title: "Konto" };

const STATUS_LABEL: Record<string, string> = {
  none: "Kostenloses Konto",
  active: "Family Pro aktiv",
  trialing: "Family Pro (Testphase)",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
};

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(iso));
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [child, userRow] = await Promise.all([getChildProfile(), getCurrentUserRow()]);
  const status = userRow?.subscription_status ?? "none",
    paid = isPaid(status),
    periodEnd = formatDate(userRow?.subscription_period_end ?? null),
    flash = (await searchParams).checkout;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Konto</h1>

      {flash === "success" && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Vielen Dank! Dein Family-Pro-Abo ist aktiv.
        </div>
      )}
      {flash === "cancel" && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Checkout abgebrochen. Du kannst es jederzeit erneut versuchen.
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Anmeldung</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Abo</CardTitle>
          <CardDescription>
            {STATUS_LABEL[status] ?? status}
            {paid && periodEnd && ` · läuft bis ${periodEnd}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionPanel paid={paid} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Kind-Profil</CardTitle>
          <CardDescription>Wird auf jedem Übungsblatt verwendet.</CardDescription>
        </CardHeader>
        <CardContent>
          {child ? (
            <ChildProfileEditor
              childId={child.id}
              initialName={child.name}
              initialGrade={child.grade}
              initialTheme={child.theme_preference}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Noch kein Profil angelegt.</p>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <form action="/auth/sign-out" method="post">
        <button type="submit" className="text-muted-foreground text-sm underline">
          Abmelden
        </button>
      </form>
    </main>
  );
}
