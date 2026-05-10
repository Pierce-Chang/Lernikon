import { SignUpForm } from "./signup-form";

export const metadata = { title: "Konto erstellen" };

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Konto erstellen</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        3 Arbeitsblätter pro Tag gratis. Keine Kreditkarte nötig.
      </p>
      <SignUpForm />
    </main>
  );
}
