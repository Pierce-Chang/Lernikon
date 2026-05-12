import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Passwort vergessen"
      subtitle="Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst."
    >
      <ForgotForm />
    </AuthShell>
  );
}
