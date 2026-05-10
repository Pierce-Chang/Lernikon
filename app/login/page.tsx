import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Anmelden" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Anmelden</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Willkommen zurück bei Lernikon.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
