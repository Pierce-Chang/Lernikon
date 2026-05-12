import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "./signup-form";

export const metadata = { title: "Konto erstellen" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Konto erstellen"
      subtitle="3 Arbeitsblätter pro Tag gratis. Keine Kreditkarte nötig."
    >
      <SignUpForm />
    </AuthShell>
  );
}
