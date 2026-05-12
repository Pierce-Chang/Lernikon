import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Neues Passwort setzen" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/forgot-password?expired=1");
  }

  return (
    <AuthShell
      title="Neues Passwort"
      subtitle="Du bist über den Reset-Link angemeldet. Wähle dein neues Passwort."
    >
      <ResetForm />
    </AuthShell>
  );
}
