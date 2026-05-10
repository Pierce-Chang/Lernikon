import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Passwort vergessen" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Passwort vergessen</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Wir schicken dir einen Link, mit dem du ein neues Passwort setzen kannst.
      </p>
      <ForgotForm />
    </main>
  );
}
