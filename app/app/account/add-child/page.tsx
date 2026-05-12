import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import {
  countChildProfiles,
  getCurrentUserRow,
} from "@/lib/db/queries";
import { hasUnlimited } from "@/lib/worksheet/rate-limit";
import { Button } from "@/components/ui/button";
import { AddChildForm } from "./add-child-form";

export const metadata = { title: "Kind hinzufügen" };

const FREE_CHILD_CAP = 1;
const PAID_CHILD_CAP = 3;

export default async function AddChildPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [count, userRow] = await Promise.all([
    countChildProfiles(),
    getCurrentUserRow(),
  ]);
  const unlimited = userRow ? hasUnlimited(userRow) : false,
    cap = unlimited ? PAID_CHILD_CAP : FREE_CHILD_CAP;

  // Free user already has the first profile → bounce to upgrade prompt.
  if (!unlimited && count >= FREE_CHILD_CAP) {
    redirect("/app/account?upgrade=needed");
  }

  // Paid user already at the cap.
  if (count >= cap) {
    redirect("/app/account");
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" render={<Link href="/app/account" />}>
          ← Zurück zum Konto
        </Button>
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Kind hinzufügen</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Lege ein weiteres Profil an. Du kannst beim Erstellen eines Übungsblattes
        zwischen deinen Kindern wechseln.
      </p>

      <div className="mt-8">
        <AddChildForm isPaid={unlimited} />
      </div>
    </main>
  );
}
