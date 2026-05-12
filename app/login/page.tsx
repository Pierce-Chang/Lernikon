import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <AuthShell title="Anmelden" subtitle="Willkommen zurück bei Lernikon.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
