import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  getCurrentUserRow,
  listChildProfiles,
} from "@/lib/db/queries";
import { hasUnlimited, isPaid } from "@/lib/worksheet/rate-limit";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChildProfileRow } from "./child-profile-row";
import { SubscriptionPanel } from "./subscription-panel";

export const metadata = { title: "Mein Konto" };

const STATUS_LABEL: Record<string, string> = {
  none: "Kostenloses Konto",
  active: "Family Pro aktiv",
  trialing: "Family Pro (Testphase)",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
};

const FREE_CHILD_CAP = 1;
const PAID_CHILD_CAP = 3;

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "long" }).format(new Date(iso));
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; upgrade?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [children, userRow] = await Promise.all([
    listChildProfiles(),
    getCurrentUserRow(),
  ]);

  const status = userRow?.subscription_status ?? "none",
    paid = isPaid(status),
    unlimited = userRow ? hasUnlimited(userRow) : false,
    periodEnd = formatDate(userRow?.subscription_period_end ?? null),
    cap = unlimited ? PAID_CHILD_CAP : FREE_CHILD_CAP,
    canAddChild = children.length < cap,
    needsUpgradeToAdd = !unlimited && children.length >= FREE_CHILD_CAP,
    params = await searchParams,
    flash = params.checkout,
    upgradeReason = params.upgrade ?? null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Mein Konto</h1>

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
      {upgradeReason === "needed" && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Mit Family Pro kannst du bis zu {PAID_CHILD_CAP} Kinderprofile anlegen.
        </div>
      )}
      {upgradeReason === "themes" && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Mit Family Pro entsperrst du alle Themes (Einhorn, Pferde, Autos und
          mehr).
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
          <CardTitle className="text-base">Kinderprofile</CardTitle>
          <CardDescription>
            {children.length} von {cap} Profilen genutzt
            {!unlimited && " · Family Pro entsperrt bis zu 3 Profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {children.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Noch kein Profil angelegt.
            </p>
          ) : (
            children.map((child) => (
              <ChildProfileRow key={child.id} child={child} isPaid={unlimited} />
            ))
          )}
          {canAddChild ? (
            <Button
              variant="outline"
              render={<Link href="/app/account/add-child" />}
            >
              + Kind hinzufügen
            </Button>
          ) : needsUpgradeToAdd ? (
            <Button
              variant="outline"
              render={<Link href="/app/account?upgrade=needed" />}
            >
              + Kind hinzufügen (Family Pro)
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Maximal {PAID_CHILD_CAP} Kinderprofile
            </Button>
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
