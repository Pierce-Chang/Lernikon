import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Neues Passwort setzen" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Neues Passwort</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Du bist über den Reset-Link angemeldet. Wähle dein neues Passwort.
      </p>
      <ResetForm />
    </main>
  );
}
